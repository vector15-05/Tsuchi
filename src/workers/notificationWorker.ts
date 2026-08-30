import { Worker } from 'bullmq';
import redisConnection from '../lib/redis.ts';
import nodemailer from 'nodemailer';
import { logger } from '../lib/logger.ts';


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
});

export const notificationWorker = new Worker(
    'tsuchi-notifications',
    async (job) => {
        if (job.name === 'send-email') {
            const { email, animeTitle, episode, externalAnimeId } = job.data;

            logger.info(`[Email Worker] Preparing alert for ${email} -> ${animeTitle} (Ep ${episode})`);

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const unsubscribeUrl = `${frontendUrl}/unsubscribe?email=${encodeURIComponent(email)}&animeId=${externalAnimeId}`;

            const subject = `New Episode Alert: ${animeTitle} Episode ${episode}!`;
            const textBody = `Hey there!\n\nJust letting you know that Episode ${episode} of ${animeTitle} is now airing.\n\nEnjoy!\n- Tsuchi Notifications`;


            const info = await transporter.sendMail({
                from: '"Tsuchi Alerts" <noreply@gmail.com>',
                to: email,
                subject: subject,
                text: textBody,
            });

            logger.info(`[Email Worker] Sent to ${email} (Message ID: ${info.messageId})`);
        }
    },
    {
        connection: redisConnection,
        concurrency: 10
    }
);

notificationWorker.on('failed', (job, err) => {
    logger.warn({
        jobId: job?.id,
        email: job?.data.email,
        attempt: job?.attemptsMade,
        error: err.message
    }, 'Email Job failed');
});