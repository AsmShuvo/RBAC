import { Router } from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  suspendUser,
  banUser,
} from '../controllers/users.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

router.get('/', listUsers);
router.post('/', permissionMiddleware('create_user'), createUser);
router.get('/:id', getUser);
router.patch('/:id', permissionMiddleware('edit_user'), updateUser);
router.post('/:id/suspend', permissionMiddleware('suspend_user'), suspendUser);
router.post('/:id/ban', permissionMiddleware('ban_user'), banUser);

export default router;
