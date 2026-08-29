import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from './lib/prisma.ts';
import { scheduleAnimeSync } from './queues/syncQueue.ts';
import { logger } from './lib/logger.ts'; 

import './workers/syncWorker.ts';
import './workers/notificationWorker.ts';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/subscribe', async (req, res) => {
    const { email, externalAnimeId } = req.body;

    if (!email || !externalAnimeId) {
        res.status(400).json({ error: 'Email and externalAnimeId are required.' });
        return;
    }

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email },
    });

    const anime = await prisma.anime.findUnique({
        where: { externalId: externalAnimeId }
    });

    if (!anime) {
        res.status(404).json({ error: 'Anime not found in our database yet. It may not be airing this season.' });
        return;
    }

    try {
        await prisma.subscription.create({
            data: {
                userId: user.id,
                animeId: anime.id
            }
        });

        res.status(201).json({ message: `Successfully subscribed to ${anime.title}!` });
    } catch (error) {
        res.status(409).json({ error: 'You are already subscribed to this anime.' });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Tsuchi is running on port ${PORT}`);
    logger.info(`Tsuchi API is running on port ${PORT}`); 

    await scheduleAnimeSync();
    logger.info('Cron jobs scheduled');
});