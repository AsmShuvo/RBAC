import { Router } from 'express';
import { getAuditLogs, getAuditLog } from '../controllers/audit.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = Router();

// All audit routes require authentication and permission
router.use(authMiddleware);
router.use(permissionMiddleware('view_audit_log'));

router.get('/', getAuditLogs);
router.get('/:id', getAuditLog);

export default router;
