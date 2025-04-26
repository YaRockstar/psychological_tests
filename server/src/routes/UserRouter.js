import { Router } from 'express';
import * as UserController from '../controllers/UserController.js';

const router = Router();

// Инициализация маршрутов
router.post('/users', UserController.createUser);
router.get('/users/:id', UserController.getUserById);

export default router;
