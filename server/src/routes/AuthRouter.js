import { Router } from 'express';
import { register, login } from '../controllers/UserController.js';
import { validateCsrfToken } from '../middleware/csrf.js';

/**
 * Маршрутизатор для аутентификации.
 */
const router = Router();

router.post('/register', validateCsrfToken, register);
router.post('/login', login);

export default router;
