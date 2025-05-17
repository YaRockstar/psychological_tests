import express from 'express';
import * as TestAttemptController from '../controllers/TestAttemptController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Маршруты для получения списка попыток
router.get('/', authenticate, TestAttemptController.getUserTestAttempts);

// Маршруты для получения, обновления и удаления попытки
router.get('/:id', authenticate, TestAttemptController.getTestAttemptById);
router.delete('/:id', authenticate, TestAttemptController.deleteTestAttempt);

// Маршруты для управления статусом прохождения
router.post('/:id/answer', authenticate, TestAttemptController.saveTestAnswer);
router.post('/:id/complete', authenticate, TestAttemptController.completeTestAttempt);
router.post('/:id/abandon', authenticate, TestAttemptController.abandonTestAttempt);

export default router;
