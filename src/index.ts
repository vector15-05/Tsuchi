import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from './lib/prisma.ts';
import { scheduleAnimeSync } from './queues/syncQueue.ts';
import { logger } from './lib/logger.ts';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import './workers/syncWorker.ts';
import './workers/notificationWorker.ts';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: 'http://localhost:5173'
}));

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10
});
app.use(limiter);

const subscribeSchema = z.object({
    email: z.string().email('Invalid email address'),
    externalAnimeId: z.number().int().positive(),
});

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
            }
        });

        res.status(200).json(animeList);
    } catch (error) {
        logger.error(error, 'Failed to fetch anime list');
        res.status(500).json({ error: 'Failed to fetch anime list' });
    }
});


app.post('/api/subscribe', limiter, async (req, res) => {
    try {
        const { email, externalAnimeId } = subscribeSchema.parse(req.body);

        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: { email },
        });

        const anime = await prisma.anime.findUnique({
            where: { externalId: externalAnimeId }
        });

        if (!anime) {
            res.status(404).json({ error: 'Anime not found in our database yet.' });
            return;
        }

        await prisma.subscription.create({
            data: { userId: user.id, animeId: anime.id }
        });

        logger.info({ email, animeTitle: anime.title }, 'New user subscribed');
        res.status(201).json({ message: `Successfully subscribed to ${anime.title}!` });

    } catch (error) {
        if (error instanceof z.ZodError) {
            const message = error.issues?.[0]?.message ?? 'Invalid request';
            res.status(400).json({ error: message });
            return;
        }

        const prismaError = error as { code?: string } | undefined;
        if (prismaError?.code === 'P2002') {
            res.status(409).json({ error: 'You are already subscribed to this anime.' });
            return;
        }

        logger.error(error as any, 'Subscription failed');
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Tsuchi is running on port ${PORT}`);
    logger.info(`Tsuchi API is running on port ${PORT}`);

    await scheduleAnimeSync();
    logger.info('Cron jobs scheduled');
});