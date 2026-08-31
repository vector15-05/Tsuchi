import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.ts';
import { logger } from '../lib/logger.ts';

export const getAnimeList = async (req: Request, res: Response) => {
    try {
        const animeList = await prisma.anime.findMany({
            where: {
                status: 'Airing'
            },
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
};
