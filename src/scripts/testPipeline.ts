import { prisma } from '../lib/prisma.ts';
import { syncQueue } from '../queues/syncQueue.ts';
import { notificationQueue } from '../queues/notificationQueue.ts';
import { sendEpisodeNotification, sendSyncCompleteEmail, getMasterEmail } from '../lib/mailer.ts';
import { logger } from '../lib/logger.ts';

// ANSI Color helper for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
};

function logStep(stepNum: number, title: string) {
    console.log(`\n${colors.bright}${colors.cyan}====================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}[TEST PIPELINE STEP ${stepNum}] ${title}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}====================================================${colors.reset}`);
}

async function runTestPipeline() {
    console.log(`${colors.bright}${colors.magenta}🚀 Starting Tsuchi E2E Verification & Test Pipeline${colors.reset}`);
    const masterEmail = getMasterEmail() || 'vinjo1505@gmail.com';
    console.log(`${colors.cyan}📌 Target Master Email: ${colors.yellow}${masterEmail}${colors.reset}`);

    // ────────────────────────────────────────────────────────
    // Step 1: Health & Database Connectivity Check
    // ────────────────────────────────────────────────────────
    logStep(1, 'Database & Infrastructure Connectivity Check');
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log(`${colors.green}  ✓ PostgreSQL (Prisma) connection operational.${colors.reset}`);
    } catch (err: any) {
        console.error(`${colors.red}  ✗ Failed to connect to PostgreSQL: ${err.message}${colors.reset}`);
        process.exit(1);
    }

    // ────────────────────────────────────────────────────────
    // Step 2: Fetch Airing Anime from Jikan API
    // ────────────────────────────────────────────────────────
    logStep(2, 'Fetching Currently Airing Anime from Jikan API');
    console.log(`${colors.cyan}  → Fetching https://api.jikan.moe/v4/seasons/now...${colors.reset}`);

    const response = await fetch('https://api.jikan.moe/v4/seasons/now');
    if (!response.ok) {
        console.error(`${colors.red}  ✗ Jikan API request failed with status ${response.status}${colors.reset}`);
        process.exit(1);
    }

    const { data }: any = await response.json();
    const validAnime = data.filter((show: any) => show.episodes && show.episodes > 0 && show.title);

    if (validAnime.length === 0) {
        console.error(`${colors.red}  ✗ No valid airing anime with episode counts returned from Jikan API.${colors.reset}`);
        process.exit(1);
    }

    const targetShow = validAnime[0];
    const targetMalId = targetShow.mal_id;
    const targetTitle = targetShow.title_english || targetShow.title;
    const targetEpisodes = targetShow.episodes;
    const targetImage = targetShow.images?.jpg?.large_image_url || targetShow.images?.jpg?.image_url;

    console.log(`${colors.green}  ✓ Target Anime Selected: "${targetTitle}" (MAL ID: ${targetMalId})${colors.reset}`);
    console.log(`${colors.yellow}    Current Episode Count on Jikan: Ep ${targetEpisodes}${colors.reset}`);

    // ────────────────────────────────────────────────────────
    // Step 3: Seed Database State for Episode Drop Simulation
    // ────────────────────────────────────────────────────────
    logStep(3, 'Seeding DB: Test User & Stale Anime Episode Count');

    // 3a. Upsert Test User
    const testUser = await prisma.user.upsert({
        where: { email: masterEmail },
        update: {},
        create: {
            email: masterEmail,
            name: 'Master Test User',
        },
    });
    console.log(`${colors.green}  ✓ Test User Seeded: ${testUser.email} (ID: ${testUser.id})${colors.reset}`);

    // 3b. Upsert Anime with episode count set to 0 (so sync worker detects new episode drop)
    const seededAnime = await prisma.anime.upsert({
        where: { externalId: targetMalId },
        update: {
            latestEpisode: 0,
            status: targetShow.status || 'Currently Airing',
            imageUrl: targetImage,
        },
        create: {
            externalId: targetMalId,
            title: targetTitle,
            latestEpisode: 0,
            status: targetShow.status || 'Currently Airing',
            imageUrl: targetImage,
        },
    });
    console.log(`${colors.green}  ✓ Anime Seeded in DB with episode count forced to 0: "${seededAnime.title}"${colors.reset}`);

    // 3c. Upsert Subscription
    const subscription = await prisma.subscription.upsert({
        where: {
            userId_animeId: {
                userId: testUser.id,
                animeId: seededAnime.id,
            },
        },
        update: {},
        create: {
            userId: testUser.id,
            animeId: seededAnime.id,
        },
    });
    console.log(`${colors.green}  ✓ Subscription Seeded: User ${testUser.email} → "${seededAnime.title}" (Sub ID: ${subscription.id})${colors.reset}`);

    // ────────────────────────────────────────────────────────
    // Step 4: Direct Notification & Master Email Test
    // ────────────────────────────────────────────────────────
    logStep(4, 'Direct Notification & Master Email Test');
    console.log(`${colors.cyan}  → Sending direct test episode alert email...${colors.reset}`);
    try {
        await sendEpisodeNotification(testUser.email, targetTitle, targetEpisodes);
        console.log(`${colors.green}  ✓ Direct episode notification dispatched successfully.${colors.reset}`);
    } catch (err: any) {
        console.error(`${colors.red}  ✗ Failed to send direct episode notification: ${err.message}${colors.reset}`);
    }

    console.log(`${colors.cyan}  → Sending direct test sync complete email...${colors.reset}`);
    try {
        await sendSyncCompleteEmail({
            totalAnime: validAnime.length,
            updatedAnime: 1,
            queuedJobs: 1,
        });
        console.log(`${colors.green}  ✓ Direct sync complete report dispatched to master email.${colors.reset}`);
    } catch (err: any) {
        console.error(`${colors.red}  ✗ Failed to send sync complete report: ${err.message}${colors.reset}`);
    }

    // ────────────────────────────────────────────────────────
    // Step 5: Queue Integration Test (Trigger BullMQ Sync Queue)
    // ────────────────────────────────────────────────────────
    logStep(5, 'BullMQ Queue Integration Test');
    console.log(`${colors.cyan}  → Enqueuing 'fetch-latest-episodes' job into syncQueue...${colors.reset}`);

    const syncJob = await syncQueue.add('fetch-latest-episodes', {
        triggeredBy: 'testPipeline',
        timestamp: new Date().toISOString(),
    });

    console.log(`${colors.green}  ✓ Sync Job successfully enqueued to BullMQ! (Job ID: ${syncJob.id})${colors.reset}`);

    // ────────────────────────────────────────────────────────
    // Step 6: Pipeline Verification Summary
    // ────────────────────────────────────────────────────────
    logStep(6, 'Pipeline Test Summary');
    console.log(`${colors.bright}${colors.green}🎉 Test Pipeline Execution Complete!${colors.reset}`);
    console.log(`
${colors.cyan}Summary of Actions Executed:${colors.reset}
  1. Database connected and verified.
  2. Jikan API fetched: Found ${validAnime.length} airing shows.
  3. Seeded DB show "${targetTitle}" with episode count set to 0.
  4. Subscribed user ${masterEmail} to "${targetTitle}".
  5. Tested episode alert email & sync report email dispatch.
  6. Enqueued sync job ID #${syncJob.id} into BullMQ.

${colors.yellow}👉 Make sure your server process ('bun run src/index.ts') is running to process the queued sync job!${colors.reset}
    `);

    await prisma.$disconnect();
    process.exit(0);
}

runTestPipeline().catch(async (e) => {
    console.error(`\n${colors.red}💥 Test Pipeline Error:${colors.reset}`, e);
    await prisma.$disconnect();
    process.exit(1);
});