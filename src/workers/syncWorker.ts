import { Worker } from "bullmq";
import redisConnection from "../lib/redis.ts"
import { prisma } from '../lib/prisma.ts'
import { notificationQueue } from '../queues/notificationQueue.ts';
import { logger } from '../lib/logger.ts';

interface JikanAnime {
    mal_id: number;
    title: string;
    title_english: string | null;
    episodes: number | null;
    status: string;
}

interface JikanResponse {
    data: JikanAnime[]
}

interface SubscriptionWithUser {
    id: string;
    userId: string;
    animeId: string;
    createdAt: Date;
    user: {
        id: string;
        email: string;
        createdAt: Date;
    };
}

export const syncWorker = new Worker(
    'tsuchi-sync-queue',
    async (job) => {
        if (job.name === 'fetch-latest-episodes') {
            logger.info(`[Sync Worker] Fetching current season from Jikan API...`);

            const response = await fetch('https://api.jikan.moe/v4/seasons/now')
            if (!response.ok) throw new Error(`Jikan API failed: ${response.statusText}`);

            const { data } = await response.json() as JikanResponse;

            for (const show of data) {
                if (!show.episodes) continue;

                const anime = await prisma.anime.upsert({
                    where: { externalId: show.mal_id },
                    update: {
                        status: show.status,
                    },
                    create: {
                        externalId: show.mal_id,
                        title: show.title_english || show.title,
                        latestEpisode: show.episodes,
                        status: show.status,
                    }
                });

                logger.debug(`Checking ${anime.title}: API says Ep ${show.episodes}, DB says Ep ${anime.latestEpisode}`); 

                if (show.episodes > anime.latestEpisode) {
                    logger.info(`[Tsuchi] New episode detected: ${anime.title} (Episode ${show.episodes})`);

                    await prisma.anime.update({
                        where: { id: anime.id },
                        data: { latestEpisode: show.episodes }
                    });

                    // Email logic

                    const subscribers = await prisma.subscription.findMany({
                        where: { animeId: anime.id },
                        include: { user: true }
                    });

                    if (subscribers.length > 0) {
                        const emailJobs = subscribers.map((sub: SubscriptionWithUser) => ({
                            name: 'send-email',
                            data: {
                                email: sub.user.email,
                                animeTitle: anime.title,
                                episode: show.episodes
                            }
                        }));

                        await notificationQueue.addBulk(emailJobs);
                        logger.info(`[Tsuchi] Queued ${subscribers.length} email jobs for ${anime.title}.`);
                    }
                }
            }
            logger.info(`[Sync Worker] Database sync complete.`);
        }
    },
    { connection: redisConnection }
);

syncWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Sync Worker Job failed');
})