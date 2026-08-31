import nodemailer from 'nodemailer';
import { logger } from './logger.ts';
import { generateEmailHtml, generateSyncCompleteEmailHtml } from './generateEmailHtml.ts';

export const transporter = nodemailer.createTransport({
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

export const getMasterEmail = (): string => {
    return (process.env.MASTER_EMAIL || process.env.ADMIN_EMAIL || process.env.SMTP_USER || '').trim();
};

export const sendEpisodeNotification = async (
    userEmail: string,
    animeTitle: string,
    episodeNumber: number
): Promise<void> => {
    const htmlContent = generateEmailHtml(animeTitle, episodeNumber);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardUrl = `${frontendUrl}/dashboard`;
    const subject = `New Episode Alert: ${animeTitle} Episode ${episodeNumber}!`;
    const textBody = `Hey there!\n\nJust letting you know that Episode ${episodeNumber} of ${animeTitle} is now airing.\n\nEnjoy!\n- Tsuchi Notifications\n\n---\nTo manage your notifications, log in to your dashboard at:\n${dashboardUrl}`;

    const info = await transporter.sendMail({
        from: '"Tsuchi Alerts" <noreply@gmail.com>',
        to: userEmail,
        subject,
        html: htmlContent,
        text: textBody,
    });

    logger.info({ email: userEmail, messageId: info.messageId }, 'User notification email sent');

    const masterEmail = getMasterEmail();
    if (masterEmail && masterEmail.toLowerCase() !== userEmail.toLowerCase()) {
        try {
            await transporter.sendMail({
                from: '"Tsuchi Alerts" <noreply@gmail.com>',
                to: masterEmail,
                subject: `[Master Copy] ${subject}`,
                html: htmlContent,
                text: `[Copy sent to subscriber: ${userEmail}]\n\n${textBody}`,
            });
            logger.info({ masterEmail, subscriberEmail: userEmail }, 'Master copy notification email sent');
        } catch (err) {
            logger.error(err, 'Failed to send master copy notification email');
        }
    }
};

export const sendSyncCompleteEmail = async (stats: {
    totalAnime: number;
    updatedAnime: number;
    queuedJobs: number;
}): Promise<void> => {
    const masterEmail = getMasterEmail();
    if (!masterEmail) {
        logger.warn('No MASTER_EMAIL or ADMIN_EMAIL configured for sync completion notification.');
        return;
    }

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
    const subject = `[Tsuchi System] Anime Sync Complete - ${timestamp} UTC`;

    const htmlContent = generateSyncCompleteEmailHtml(stats);
    const textBody = `Tsuchi Sync Complete\n\nStatus: SUCCESS\nTotal Airing Series Checked: ${stats.totalAnime}\nSeries with New Episodes: ${stats.updatedAnime}\nNotification Email Jobs Queued: ${stats.queuedJobs}\nCompleted At: ${timestamp} UTC`;

    try {
        await transporter.sendMail({
            from: '"Tsuchi System" <noreply@gmail.com>',
            to: masterEmail,
            subject,
            html: htmlContent,
            text: textBody,
        });
        logger.info({ masterEmail }, 'Sync complete notification email sent to master email');
    } catch (err) {
        logger.error(err, 'Failed to send sync complete email to master email');
    }
};
