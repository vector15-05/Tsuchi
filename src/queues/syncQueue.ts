import { Queue } from "bullmq"
import redisConnect from '../lib/redis.ts'

export const syncQueue = new Queue('tsuchi-sync-queue', {
    connection: redisConnect
});

export async function scheduleAnimeSync() {
    await syncQueue.upsertJobScheduler(
        'hourly-anime-sync',
        {
            pattern: '*/15 * * * *'
        },
        {
            name: 'fetch-latest-episodes',
            data: {},
            opts: {
                removeOnComplete: true,
                removeOnFail: 10,
            }
        }
    );

    console.log("[BullMQ] Scheduled hourly anime sync job");
}
