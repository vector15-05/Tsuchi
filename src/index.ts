import express from 'express';
import { prisma } from './lib/prisma.ts';
import { scheduleAnimeSync } from './queues/syncQueue.ts';
import { logger } from './lib/logger.ts';
import cors from 'cors';
import helmet from 'helmet';
import { auth } from './lib/auth.ts';
import { toNodeHandler } from 'better-auth/node';
import { syncWorker } from './workers/syncWorker.ts';
import { notificationWorker } from './workers/notificationWorker.ts';
import animeRoutes from './routes/animeRoutes.ts';
import subscriptionRoutes from './routes/subscriptionRoutes.ts';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({ contentSecurityPolicy: false }));
import { isAllowedOrigin } from './lib/corsOptions.ts';

app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS error: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/auth', toNodeHandler(auth));
app.use('/api/anime', animeRoutes);
app.use('/api', subscriptionRoutes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(Number(PORT), '0.0.0.0', async () => {
    logger.info(`Tsuchi API is running on port ${PORT}`);

    await scheduleAnimeSync();
    logger.info('Cron jobs scheduled');
});

async function gracefulShutdown(signal: string) {
    logger.info(`\nReceived ${signal}. Starting graceful shutdown...`);

    server.close(() => {
        logger.info('HTTP server closed.');
    });

    try {
        logger.info('Waiting for active jobs to finish and closing workers...');
        await Promise.all([
            syncWorker.close(),
            notificationWorker.close()
        ]);
        logger.info('Workers closed.');

        logger.info('Disconnecting from Redis...');
        const _global: any = global as any;
        if (_global.redisConnection && typeof _global.redisConnection.quit === 'function') {
            await _global.redisConnection.quit();
        } else {
            logger.info('No redis connection found to close.');
        }

        logger.info('Disconnecting from PostgreSQL...');
        await prisma.$disconnect();

        logger.info('Graceful shutdown complete. Exiting.');
        process.exit(0);
    } catch (error) {
        logger.error(error, 'Error during graceful shutdown');
        process.exit(1);
    }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));