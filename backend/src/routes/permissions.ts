import { Router } from 'express';
import {
  listPermissions,
  getUserPermissions,
  grantPermission,
  revokePermission,
  bulkUpdateUserPermissions,
  listRolesWithPermissions,
  grantPermissionToRole,
  revokePermissionFromRole,
} from '../controllers/permissions.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listPermissions);

router.get('/roles/list', listRolesWithPermissions);
router.post(
  '/roles/:roleId/:permissionId',
  permissionMiddleware('manage_role_permissions'),
  grantPermissionToRole
);
router.delete(
  '/roles/:roleId/:permissionId',
  permissionMiddleware('manage_role_permissions'),
  revokePermissionFromRole
);

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
