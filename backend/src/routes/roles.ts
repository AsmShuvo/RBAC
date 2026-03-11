import express from 'express';
import { listRoles, getRole } from '../controllers/roles.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, listRoles);
router.get('/:id', authMiddleware, getRole);

export default router;
