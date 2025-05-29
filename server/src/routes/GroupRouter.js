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
} from '../controllers/GroupController.js';
import { authenticate, authorize } from '../middleware/auth.js';

/**
 * Маршрутизатор для работы с группами.
 */
const router = express.Router();

// Маршруты для авторов (требуют роль автора)
router.post('/', authenticate, authorize(['author']), createGroup);
router.get('/my', authenticate, authorize(['author']), getAuthorGroups);
router.put('/:id', authenticate, authorize(['author']), updateGroup);
router.post('/:id/invite', authenticate, authorize(['author']), regenerateInviteCode);
router.delete('/:id', authenticate, authorize(['author']), deleteGroup);
router.delete(
  '/:groupId/users/:userId',
  authenticate,
  authorize(['author']),
  removeUserFromGroup
);

// Маршруты для пользователей
router.get('/joined', authenticate, getUserGroups);
router.get('/:id', authenticate, getGroupById);
router.get('/invite/:inviteCode', authenticate, getGroupByInviteCode);
router.post('/join/:inviteCode', authenticate, joinGroup);

export default router;
