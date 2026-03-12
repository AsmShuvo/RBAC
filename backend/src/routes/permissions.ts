import { Router } from 'express';
import {
  listPermissions,
  getUserPermissions,
  grantPermission,
  revokePermission,
  bulkUpdateUserPermissions,
} from '../controllers/permissions.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = Router();

// All permission routes require authentication
router.use(authMiddleware);

router.get('/', listPermissions);
router.get('/users/:userId', getUserPermissions);
router.put(
  '/users/:userId',
  permissionMiddleware('manage_permissions'),
  bulkUpdateUserPermissions
);
router.post(
  '/users/:userId/:permissionId',
  permissionMiddleware('manage_permissions'),
  grantPermission
);
router.delete(
  '/users/:userId/:permissionId',
  permissionMiddleware('manage_permissions'),
  revokePermission
);

export default router;
