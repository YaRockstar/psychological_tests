import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  getUserById,
} from '../controllers/UserController.js';
import { authenticate } from '../middleware/auth.js';

/**
 * Маршрутизатор для работы с пользователями.
 */
const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.get('/users/:id', getUserById);

export default router;
