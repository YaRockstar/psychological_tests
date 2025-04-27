import { Router } from 'express';
import {
  getCurrentUser,
  getUserById,
  updateCurrentUser,
  updatePassword,
} from '../controllers/UserController.js';
import { authenticate } from '../middleware/auth.js';

/**
 * Маршрутизатор для работы с пользователями.
 */
const router = Router();

// Маршруты для текущего аутентифицированного пользователя
router.get('/current', authenticate, getCurrentUser);
router.patch('/current', authenticate, updateCurrentUser);
router.patch('/current/password', authenticate, updatePassword);

// Маршруты для конкретных пользователей по ID
router.get('/:id', getUserById);

export default router;
