import { Router } from 'express';
import {
  getCurrentUser,
  getUserById,
  updateCurrentUser,
  updatePassword,
  deleteCurrentUser,
} from '../controllers/UserController.js';
import { authenticate } from '../middleware/auth.js';

/**
 * Маршрутизатор для работы с пользователями.
 */
const router = Router();

router.get('/current', authenticate, getCurrentUser);
router.patch('/current', authenticate, updateCurrentUser);
router.patch('/current/password', authenticate, updatePassword);
router.delete('/current', authenticate, deleteCurrentUser);
router.get('/:id', getUserById);

export default router;
