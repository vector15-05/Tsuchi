import {Queue} from 'bullmq';
import { createRedisConnection } from '../lib/redis.ts'

export const notificationQueue = new Queue('tsuchi-notifications',
    {
        connection: createRedisConnection(),
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: 100,
        }
    }
)