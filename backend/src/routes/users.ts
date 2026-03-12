import { Router } from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  suspendUser,
  banUser,
  restoreUser,
  deleteUser,
} from '../controllers/users.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listUsers);
router.post('/', permissionMiddleware('create_user'), createUser);
router.get('/:id', getUser);
router.patch('/:id', permissionMiddleware('edit_user'), updateUser);
router.put('/:id/suspend', permissionMiddleware('suspend_user'), suspendUser);
router.put('/:id/ban', permissionMiddleware('ban_user'), banUser);
router.put('/:id/restore', permissionMiddleware('restore_user'), restoreUser);
router.delete('/:id', permissionMiddleware('delete_user'), deleteUser);

export default router;
