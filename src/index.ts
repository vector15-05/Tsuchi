import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from './lib/prisma.ts';
import { scheduleAnimeSync } from './queues/syncQueue.ts';
import { logger } from './lib/logger.ts';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import {syncWorker} from './workers/syncWorker.ts';
import { notificationWorker } from './workers/notificationWorker.ts';
import { auth } from './lib/auth.ts';
import { toNodeHandler } from 'better-auth/node';
import { requireAuth, type AuthRequest } from './middleware/auth.ts';
import helmet from 'helmet';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
    contentSecurityPolicy: false,
}));

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use("/api/auth", toNodeHandler(auth));

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10
});
app.use(limiter);


app.get('/api/anime', async (req, res) => {
    try {
        const animeList = await prisma.anime.findMany({
            orderBy: {
                title: 'asc'
            },
            select: {
                externalId: true,
                title: true,
                latestEpisode: true,
                status: true,
                imageUrl: true,
            }
        });

        res.status(200).json(animeList);
    } catch (error) {
        logger.error(error, 'Failed to fetch anime list');
        res.status(500).json({ error: 'Failed to fetch anime list' });
    }
});

app.get('/api/user/subscriptions', requireAuth, async (req: AuthRequest, res) => {
    try {
        const userId = req.user.id;

        const subscriptions = await prisma.subscription.findMany({
            where: {
                userId: userId
            },
            include: {
                anime: {
                    select: {
                        externalId: true,
                        title: true,
                        latestEpisode: true,
                        status: true,
                        imageUrl: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });


        const subscribedAnime = subscriptions.map(sub => sub.anime);

        res.status(200).json(subscribedAnime);

    } catch (error) {
        logger.error(error, 'Failed to fetch user subscriptions');
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});


const subscribeSchema = z.object({
    externalAnimeId: z.number().int().positive(),
});

app.post('/api/subscribe', limiter, requireAuth, async (req: AuthRequest, res) => {
    try {
        const { externalAnimeId } = subscribeSchema.parse(req.body);

        const userId = req.user.id;
        const email = req.user.email;

        const anime = await prisma.anime.findUnique({
            where: { externalId: externalAnimeId }
        });

        if (!anime) {
            res.status(404).json({ error: 'Anime not found in our database yet.' });
            return;
        }

        await prisma.subscription.create({
            data: {
                userId: userId,
                animeId: anime.id
            }
        });

        logger.info({ userId, email, animeTitle: anime.title }, 'User subscribed to anime');
        res.status(201).json({ message: `Successfully subscribed to ${anime.title}!` });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const message = error.issues?.[0]?.message ?? 'Invalid request';
            res.status(400).json({ error: message });
            return;
        }

        if (error.code === 'P2002') {
            res.status(409).json({ error: 'You are already subscribed to this anime.' });
            return;
        }

        logger.error(error, 'Subscription failed');
        res.status(500).json({ error: 'Internal server error' });
    }
});

const unsubscribeSchema = z.object({
    externalAnimeId: z.number().int().positive(),
});

app.delete('/api/unsubscribe', limiter, requireAuth, async (req: AuthRequest, res) => {
    try {
        const { externalAnimeId } = unsubscribeSchema.parse(req.body);
        const userId = req.user.id;
        const email = req.user.email;

        const anime = await prisma.anime.findUnique({
            where: { externalId: externalAnimeId }
        });

        if (!anime) {
            res.status(404).json({ error: 'Record not found.' });
            return;
        }

        await prisma.subscription.delete({
            where: {
                userId_animeId: {
                    userId: userId,
                    animeId: anime.id
                }
            }
        });

        logger.info({ userId, email, animeTitle: anime.title }, 'User unsubscribed');
        res.status(200).json({ message: `Successfully unsubscribed from ${anime.title}.` });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const message = error.issues?.[0]?.message ?? 'Invalid request';
            res.status(400).json({ error: message });
            return;
        }

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'You are not subscribed to this anime.' });
            return;
        }

        logger.error(error, 'Unsubscribe failed');
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
    logger.info(`Tsuchi API is running on port ${PORT}`);
    logger.info(`Bull-Board available at http://localhost:${PORT}/admin/queues`);

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