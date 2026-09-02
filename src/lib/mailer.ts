import { BrevoClient } from '@getbrevo/brevo';
import { logger } from './logger.ts';
import { generateEmailHtml, generateSyncCompleteEmailHtml, generateWelcomeEmailHtml } from './generateEmailHtml.ts';

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY || '' });

export const getFromAddress = (name = 'Tsuchi'): { name: string; email: string } => ({
    name: process.env.BREVO_FROM_NAME || name,
    email: process.env.BREVO_FROM_EMAIL || '',
});

export const getMasterEmail = (): string =>
    (process.env.MASTER_EMAIL || process.env.ADMIN_EMAIL || '').trim();

export const verifyTransporter = async (): Promise<boolean> => {
    if (!process.env.BREVO_API_KEY) {
        logger.warn('BREVO_API_KEY is missing. Emails cannot be sent until configured.');
        return false;
    }
    if (!process.env.BREVO_FROM_EMAIL) {
        logger.warn('BREVO_FROM_EMAIL is missing. Emails cannot be sent until configured.');
        return false;
    }
    logger.info('Brevo API key present. Email sending is ready.');
    return true;
};

async function sendEmail(opts: {
    from: { name: string; email: string };
    to: string;
    subject: string;
    html: string;
    text: string;
}): Promise<void> {
    await brevo.transactionalEmails.sendTransacEmail({
        sender: opts.from,
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
        textContent: opts.text,
    });
}

export const sendWelcomeEmail = async (
    userEmail: string,
    userName?: string
): Promise<void> => {
    const htmlContent = generateWelcomeEmailHtml(userName);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardUrl = `${frontendUrl}/dashboard`;
    const subject = `Welcome to Tsuchi Anime Notifications!`;
    const text = `Welcome to Tsuchi!\n\nYour account has been successfully created. Subscribe to your favorite airing anime and get instant email alerts when new episodes drop.\n\nDashboard: ${dashboardUrl}\n\n- Tsuchi Notifications`;

    await sendEmail({ from: getFromAddress(), to: userEmail, subject, html: htmlContent, text });
    logger.info({ email: userEmail }, 'Welcome email sent');

    const masterEmail = getMasterEmail();
    if (masterEmail && masterEmail.toLowerCase() !== userEmail.toLowerCase()) {
        try {
            await sendEmail({
                from: getFromAddress('Tsuchi System'),
                to: masterEmail,
                subject: `[Master Copy] New User Registered: ${userEmail}`,
                html: htmlContent,
                text: `[Copy sent to: ${userEmail}]\n\n${text}`,
            });
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
    const text = `Episode ${episodeNumber} of ${animeTitle} is now airing!\n\nManage notifications: ${dashboardUrl}\n\n- Tsuchi Notifications`;

    await sendEmail({ from: getFromAddress('Tsuchi Alerts'), to: userEmail, subject, html: htmlContent, text });
    logger.info({ email: userEmail }, 'Episode notification email sent');

    const masterEmail = getMasterEmail();
    if (masterEmail && masterEmail.toLowerCase() !== userEmail.toLowerCase()) {
        try {
            await sendEmail({
                from: getFromAddress('Tsuchi Alerts'),
                to: masterEmail,
                subject: `[Master Copy] ${subject}`,
                html: htmlContent,
                text: `[Copy sent to: ${userEmail}]\n\n${text}`,
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
    const text = `Tsuchi Sync Complete\n\nStatus: SUCCESS\nAiring Series Checked: ${stats.totalAnime}\nSeries with New Episodes: ${stats.updatedAnime}\nNotification Jobs Queued: ${stats.queuedJobs}\nCompleted At: ${timestamp} UTC`;

    try {
        await sendEmail({ from: getFromAddress('Tsuchi System'), to: masterEmail, subject, html: htmlContent, text });
        logger.info({ masterEmail }, 'Sync complete email sent');
    } catch (err) {
        logger.error(err, 'Failed to send sync complete email to master email');
    }
};
