import { Router } from 'express';
import { requireAuth } from '../middleware/auth.ts';
import { getUserSubscriptions, subscribe, unsubscribe } from '../controllers/subscriptionController.ts';
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10
});

const router = Router();

router.get('/user/subscriptions', requireAuth, getUserSubscriptions);
router.post('/subscribe', limiter, requireAuth, subscribe);
router.delete('/unsubscribe', limiter, requireAuth, unsubscribe);

export default router;
