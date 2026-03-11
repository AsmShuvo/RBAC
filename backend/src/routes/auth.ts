import { Router, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { login, logout, refresh, register } from '../controllers/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(cookieParser());

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);

export default router;
