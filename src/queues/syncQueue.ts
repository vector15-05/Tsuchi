import { Queue } from "bullmq"
import { createRedisConnection } from '../lib/redis.ts'

export const syncQueue = new Queue('tsuchi-sync-queue', {
    connection: createRedisConnection()
});

export async function scheduleAnimeSync() {
    await syncQueue.upsertJobScheduler(
        'hourly-anime-sync',
        {
            pattern: '0 * * * *'
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

    // Trigger an immediate initial sync job on startup so sync email sends right away
    await syncQueue.add('fetch-latest-episodes', {}, {
        removeOnComplete: true,
        removeOnFail: 10,
    });
    console.log("[BullMQ] Triggered initial anime sync job on startup");
}
