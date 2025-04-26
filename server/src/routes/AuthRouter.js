import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/UserController.js';
import { authenticate } from '../middleware/auth.js';

/**
 * Маршрутизатор для аутентификации пользователей.
 */
const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);

export default router;
