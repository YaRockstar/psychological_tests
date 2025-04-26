import { Router } from 'express';
import * as UserController from '../controllers/UserController.js';

/**
 * Маршрутизатор для работы с пользователями.
 */
const router = Router();

router.post('/users', UserController.createUser);
router.get('/users/:id', UserController.getUserById);

export default router;
