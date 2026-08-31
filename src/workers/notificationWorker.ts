import { Worker } from 'bullmq';
import redisConnection from '../lib/redis.ts';
import nodemailer from 'nodemailer';
import { logger } from '../lib/logger.ts';
import { generateEmailHtml } from '../lib/generateEmailHtml.ts';


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
            const { email, animeTitle, episode } = job.data;

            const episodeNumber = job.data.episodeNumber ?? job.data.episode;
            const htmlContent = generateEmailHtml(
                animeTitle,
                episodeNumber
            );

            logger.info({ email, animeTitle, episode }, 'Preparing email alert');

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const dashboardUrl = `${frontendUrl}/dashboard`;

            const subject = `New Episode Alert: ${animeTitle} Episode ${episode}!`;

            const textBody = `Hey there!\n\nJust letting you know that Episode ${episode} of ${animeTitle} is now airing.\n\nEnjoy!\n- Tsuchi Notifications\n\n---\nTo manage your notifications or unsubscribe, log in to your dashboard at:\n${dashboardUrl}`;

            const info = await transporter.sendMail({
                from: '"Tsuchi Alerts" <noreply@gmail.com>',
                to: email,
                subject: subject,
                html: htmlContent,
                text: textBody,
            });

            logger.info({ email, messageId: info.messageId }, 'Email sent successfully');
        }
    },
    { connection: redisConnection, concurrency: 10 }
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
