import { Router } from 'express';
import { getAnimeList } from '../controllers/animeController.ts';

const router = Router();

router.get('/', getAnimeList);

export default router;
