import { Worker } from 'bullmq';
import redisConnection from '../lib/redis.ts';
import nodemailer from 'nodemailer';


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
    'tsuchi-notification-queue',
    async (job) => {
        if (job.name === 'send-email') {
            const { email, animeTitle, episode } = job.data;

            console.log(`[Email Worker] Preparing alert for ${email} -> ${animeTitle} (Ep ${episode})`);

            const subject = `New Episode Alert: ${animeTitle} Episode ${episode}!`;
            const textBody = `Hey there!\n\nJust letting you know that Episode ${episode} of ${animeTitle} is now airing.\n\nEnjoy!\n- Tsuchi Notifications`;

            
            const info = await transporter.sendMail({
                from: '"Tsuchi Alerts" <noreply@gmail.com>',
                to: email,
                subject: subject,
                text: textBody,
            });

            console.log(`[Email Worker] Sent to ${email} (Message ID: ${info.messageId})`);
        }
    },
    {
        connection: redisConnection,
        concurrency: 10
    }
);

notificationWorker.on('failed', (job, err) => {
    console.warn(`[Email Worker] Job ${job?.id} failed to send to ${job?.data.email}. Attempt ${job?.attemptsMade}/3. Reason: ${err.message}`);
});