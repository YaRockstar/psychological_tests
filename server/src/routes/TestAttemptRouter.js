import express from 'express';
import * as TestAttemptController from '../controllers/TestAttemptController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Маршруты для получения списка попыток
router.get('/', authenticate, TestAttemptController.getUserTestAttempts);

// Маршруты для получения, обновления и удаления попытки
router.get('/:id', authenticate, TestAttemptController.getTestAttemptById);
router.get(
  '/:id/details',
  authenticate,
  TestAttemptController.getTestAttemptDetailsForAuthor
);
router.delete('/:id', authenticate, TestAttemptController.deleteTestAttempt);
router.delete(
  '/:id/with-answers',
  authenticate,
  TestAttemptController.deleteTestAttemptWithAnswers
);

// Маршруты для управления статусом прохождения
router.post('/:id/answer', authenticate, TestAttemptController.saveTestAnswer);
router.post('/:id/complete', authenticate, TestAttemptController.completeTestAttempt);
router.post('/:id/abandon', authenticate, TestAttemptController.abandonTestAttempt);

// Маршрут для очистки истории тестов пользователя
router.delete('/user/history', authenticate, TestAttemptController.clearUserTestHistory);

// Маршрут для проверки попытки пользователя в конкретной группе
router.get(
  '/check-group/:testId/:groupId',
  authenticate,
  TestAttemptController.checkUserAttemptInGroup
);

export default router;
