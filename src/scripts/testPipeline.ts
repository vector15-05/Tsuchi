import { prisma } from '../lib/prisma.ts';
import { syncQueue } from '../queues/syncQueue.ts';

async function runTest() {
    const TEST_EMAIL = 'vinjo1505@gmail.com';

    console.log(`[Test] 0. Fetching a guaranteed airing anime from Jikan...`);
    const response = await fetch('https://api.jikan.moe/v4/seasons/now');
    const json = await response.json() as { data: any[] };
    const { data } = json;

    // Find the first anime in the current season that has a known episode count
    const targetAnime = data.find((show: any) => show.episodes && show.episodes > 0);

    if (!targetAnime) {
        console.error("Could not find a valid anime in the current season.");
        process.exit(1);
    }

    const TARGET_MAL_ID = targetAnime.mal_id;
    const TARGET_TITLE = targetAnime.title;

    console.log(`[Test] 1. Seeding ${TARGET_TITLE} (MAL ID: ${TARGET_MAL_ID}) with 0 episodes...`);

    const anime = await prisma.anime.upsert({
        where: { externalId: TARGET_MAL_ID },
        update: { latestEpisode: 0 },
        create: {
            externalId: TARGET_MAL_ID,
            title: TARGET_TITLE,
            latestEpisode: 0,
            status: "Currently Airing",
        }
    });

    console.log(`[Test] 2. Seeding Test User (${TEST_EMAIL})...`);
    const user = await prisma.user.upsert({
        where: { email: TEST_EMAIL },
        update: {},
        create: { email: TEST_EMAIL }
    });

    console.log(`[Test] 3. Subscribing user to anime...`);
    await prisma.subscription.upsert({
        where: {
            userId_animeId: {
                userId: user.id,
                animeId: anime.id
            }
        },
        update: {},
        create: {
            userId: user.id,
            animeId: anime.id
        }
    });

    console.log(`[Test] 4. Triggering the Sync Queue...`);
    await syncQueue.add('fetch-latest-episodes', {});

    console.log(`[Test] ✅ Seed complete! Watch your server terminal now.`);

    await prisma.$disconnect();
    process.exit(0);
}

runTest().catch((e) => {
    console.error(e);
    process.exit(1);
});