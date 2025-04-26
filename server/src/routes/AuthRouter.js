import { Router } from 'express';
import * as AuthController from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.js';

/**
 * Маршрутизатор для аутентификации.
 */
const router = Router();

// Маршруты для аутентификации
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;
