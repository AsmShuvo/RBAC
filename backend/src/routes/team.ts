import { Router } from 'express';
import {
  listTeamMembers,
  createTeamMember,
  updateTeamMember,
  suspendTeamMember,
  banTeamMember,
  manageTeamMemberFeatures,
} from '../controllers/team.js';
import { authMiddleware, permissionMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// List team members (require manage_team permission)
router.get('/', permissionMiddleware('manage_team'), listTeamMembers);

// Create team member (require create_team_member permission)
router.post('/', permissionMiddleware('create_team_member'), createTeamMember);

// Update team member (require edit_team_member permission)
router.patch('/:id', permissionMiddleware('edit_team_member'), updateTeamMember);

// Suspend team member (require suspend_team_member permission)
router.put('/:id/suspend', permissionMiddleware('suspend_team_member'), suspendTeamMember);

// Ban team member (require ban_team_member permission)
router.put('/:id/ban', permissionMiddleware('ban_team_member'), banTeamMember);

// Manage team member features (require manage_team_features permission)
router.post('/:id/features', permissionMiddleware('manage_team_features'), manageTeamMemberFeatures);

export default router;
