import { Worker } from 'bullmq';
import { createRedisConnection } from '../lib/redis.ts';
import { logger } from '../lib/logger.ts';
import { sendEpisodeNotification, sendWelcomeEmail } from '../lib/mailer.ts';

export const notificationWorker = new Worker(
    'tsuchi-notifications',
    async (job) => {
        if (job.name === 'send-email') {
            const { email, animeTitle } = job.data;
            const episodeNumber = job.data.episodeNumber ?? job.data.episode;

            logger.info({ email, animeTitle, episodeNumber }, 'Processing email alert job');
            await sendEpisodeNotification(email, animeTitle, episodeNumber);
        } else if (job.name === 'send-welcome-email') {
            const { email, name } = job.data;

            logger.info({ email, name }, 'Processing welcome email job');
            await sendWelcomeEmail(email, name);
        }
    },
    { connection: createRedisConnection(), concurrency: 10 }
);


notificationWorker.on('failed', (job, err) => {
    logger.warn({
        jobId: job?.id,
        email: job?.data.email,
        attempt: job?.attemptsMade,
        error: err.message
    }, 'Email Job failed');
});

logger.info('Notification Worker is online and listening for jobs...');
