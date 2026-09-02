import { Resend } from 'resend';
import { logger } from './logger.ts';
import { generateEmailHtml, generateSyncCompleteEmailHtml, generateWelcomeEmailHtml } from './generateEmailHtml.ts';

const resend = new Resend(process.env.RESEND_API_KEY);

export const getFromAddress = (displayName = 'Tsuchi'): string => {
    if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
    // Use a verified domain from Resend, or fall back to the onboarding address
    return process.env.RESEND_FROM || `${displayName} <onboarding@resend.dev>`;
};

export const getMasterEmail = (): string => {
    return (process.env.MASTER_EMAIL || process.env.ADMIN_EMAIL || '').trim();
};

export const verifyTransporter = async (): Promise<boolean> => {
    if (!process.env.RESEND_API_KEY) {
        logger.warn('RESEND_API_KEY is missing. Emails cannot be sent until configured.');
        return false;
    }
    logger.info('Resend API key is present. Email sending is ready.');
    return true;
};

export const sendWelcomeEmail = async (
    userEmail: string,
    userName?: string
): Promise<void> => {
    const htmlContent = generateWelcomeEmailHtml(userName);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardUrl = `${frontendUrl}/dashboard`;
    const subject = `Welcome to Tsuchi Anime Notifications!`;
    const textBody = `Welcome to Tsuchi!\n\nYour account has been successfully created. You can now subscribe to your favorite currently airing anime series and receive instant email alerts whenever new episodes release.\n\nVisit your dashboard to get started:\n${dashboardUrl}\n\n- Tsuchi Notifications`;
    const from = getFromAddress('Tsuchi');

    const { error } = await resend.emails.send({
        from,
        to: userEmail,
        subject,
        html: htmlContent,
        text: textBody,
    });

    if (error) throw new Error(error.message);
    logger.info({ email: userEmail }, 'Welcome email sent');

    const masterEmail = getMasterEmail();
    if (masterEmail && masterEmail.toLowerCase() !== userEmail.toLowerCase()) {
        try {
            const { error: masterErr } = await resend.emails.send({
                from: getFromAddress('Tsuchi System'),
                to: masterEmail,
                subject: `[Master Copy] New User Registered: ${userEmail}`,
                html: htmlContent,
                text: `[Copy sent to new user: ${userEmail}]\n\n${textBody}`,
            });
            if (masterErr) throw new Error(masterErr.message);
            logger.info({ masterEmail, newUserEmail: userEmail }, 'Master copy welcome email sent');
        } catch (err) {
            logger.error(err, 'Failed to send master copy welcome email');
        }
    }
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
    const from = getFromAddress('Tsuchi Alerts');

    const { error } = await resend.emails.send({
        from,
        to: userEmail,
        subject,
        html: htmlContent,
        text: textBody,
    });

    if (error) throw new Error(error.message);
    logger.info({ email: userEmail }, 'User notification email sent');

    const masterEmail = getMasterEmail();
    if (masterEmail && masterEmail.toLowerCase() !== userEmail.toLowerCase()) {
        try {
            const { error: masterErr } = await resend.emails.send({
                from: getFromAddress('Tsuchi Alerts'),
                to: masterEmail,
                subject: `[Master Copy] ${subject}`,
                html: htmlContent,
                text: `[Copy sent to subscriber: ${userEmail}]\n\n${textBody}`,
            });
            if (masterErr) throw new Error(masterErr.message);
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
        const { error } = await resend.emails.send({
            from: getFromAddress('Tsuchi System'),
            to: masterEmail,
            subject,
            html: htmlContent,
            text: textBody,
        });
        if (error) throw new Error(error.message);
        logger.info({ masterEmail }, 'Sync complete notification email sent to master email');
    } catch (err) {
        logger.error(err, 'Failed to send sync complete email to master email');
    }
};
