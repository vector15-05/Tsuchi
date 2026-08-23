import { Worker } from "bullmq";
import redisConnection from "../lib/redis.ts"
import { prisma } from '../lib/prisma.ts'

interface JikanAnime {
    mal_id: number;
    title: string;
    title_english: string | null;
    episodes: number | null;
    status: string;
}

interface JikanResponse{
    data: JikanAnime[]
}

export const syncWorker = new Worker(
    'tsuchi-sync-queue',
    async (job) => {
        if (job.name === 'fetch-latest-episodes') {
            console.log(`[Sync Worker] Fetching current season from Jikan API...`);

            const response = await fetch('https://api.jikan.moe/v4/seasons/now')
            if (!response.ok) throw new Error(`Jikan API failed: ${response.statusText}`);

            const { data } = await response.json() as JikanResponse;

            for (const show of data) {
                if(!show.episodes) continue;

                const anime = await prisma.anime.upsert({
                    where: {externalId: show.mal_id},
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

                if(show.episodes > anime.latestEpisode){
                    console.log(`[Tsuchi] New episode detected: ${anime.title} (Episode ${show.episodes})`);

                    await prisma.anime.update({
                        where: {id: anime.id},
                        data: {latestEpisode: show.episodes}
                    });

                    // TODO: Email logic
                }
            }
            console.log(`[Sync Worker] Database sync complete.`);
        }
    },
    {connection: redisConnection}
);

syncWorker.on('failed' , (job,err) => {
    console.error(`[Sync Worker] Job ${job?.id} failed:`, err.message);
})