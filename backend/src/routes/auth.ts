import { Router, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { login, logout, refresh, register, getCurrentUser } from '../controllers/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(cookieParser());

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
