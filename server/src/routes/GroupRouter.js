import express from 'express';
import {
  createGroup,
  getAuthorGroups,
  getGroupById,
  getGroupByInviteCode,
  updateGroup,
  joinGroup,
  removeUserFromGroup,
  regenerateInviteCode,
  deleteGroup,
  getUserGroups,
  leaveGroup,
} from '../controllers/GroupController.js';
import { authenticate, authorize } from '../middleware/auth.js';

/**
 * Маршрутизатор для работы с группами.
 */
const router = express.Router();

router.post('/', authenticate, authorize(['author']), createGroup);
router.get('/my', authenticate, authorize(['author']), getAuthorGroups);
router.put('/:id', authenticate, authorize(['author']), updateGroup);
router.post(
  '/:id/invite-code',
  authenticate,
  authorize(['author']),
  regenerateInviteCode
);
router.delete('/:id', authenticate, authorize(['author']), deleteGroup);
router.delete(
  '/:groupId/users/:userId',
  authenticate,
  authorize(['author']),
  removeUserFromGroup
);

router.get('/joined', authenticate, getUserGroups);
router.get('/:id', authenticate, getGroupById);
router.get('/by-code/:inviteCode', authenticate, getGroupByInviteCode);
router.post('/join', authenticate, joinGroup);
router.post('/:id/leave', authenticate, leaveGroup);

export default router;
