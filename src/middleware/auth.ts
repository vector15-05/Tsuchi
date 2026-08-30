import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth.ts';
import type{ Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
    user?: any;
    session?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if (!session) {
            res.status(401).json({ error: 'Unauthorized. Please log in.' });
            return;
        }

        req.user = session.user;
        req.session = session.session;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};