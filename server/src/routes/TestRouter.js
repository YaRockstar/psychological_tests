import express from 'express';
import {
  createTest,
  getAllTests,
  getPublicTests,
  getAuthorTests,
  getTestById,
  updateTest,
  publishTest,
  unpublishTest,
  deleteTest,
  getTestQuestions,
  getTestWithQuestions,
  startTestAttempt,
} from '../controllers/TestController.js';
import { authenticate, authorize } from '../middleware/auth.js';

/**
 * Маршрутизатор для работы с тестами.
 */
const router = express.Router();

// Публичные маршруты (без аутентификации)
router.get('/public', getPublicTests);

// Маршруты для авторов тестов
router.post('/', authenticate, authorize(['author']), createTest);
router.get('/author', authenticate, authorize(['author']), getAuthorTests);
router.get('/:id/questions', getTestQuestions);
router.get('/:id', getTestById);
router.put('/:id', authenticate, authorize(['author']), updateTest);
router.post('/:id/publish', authenticate, authorize(['author']), publishTest);
router.post('/:id/unpublish', authenticate, authorize(['author']), unpublishTest);
router.delete('/:id', authenticate, authorize(['author']), deleteTest);

// Маршрут для администраторов
router.get('/', authenticate, authorize(['admin']), getAllTests);

// Маршруты для деталей теста
router.get('/:id/details', getTestWithQuestions);

// Маршруты для прохождения теста
router.post('/:id/attempt', authenticate, startTestAttempt);

export default router;
