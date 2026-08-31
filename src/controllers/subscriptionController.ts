import type { Response } from 'express';
import { prisma } from '../lib/prisma.ts';
import { logger } from '../lib/logger.ts';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.ts';

const subscribeSchema = z.object({
    externalAnimeId: z.number().int().positive(),
});

const unsubscribeSchema = z.object({
    externalAnimeId: z.number().int().positive(),
});

export const getUserSubscriptions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;

        const subscriptions = await prisma.subscription.findMany({
            where: {
                userId: userId,
                anime: {
                    status: 'Airing'
                }
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
};

export const subscribe = async (req: AuthRequest, res: Response) => {
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
};

export const unsubscribe = async (req: AuthRequest, res: Response) => {
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
};
