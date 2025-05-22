import express from 'express';
import {
  getResultsByTestId,
  getResultById,
  createResult,
  updateResult,
  deleteResult,
} from '../controllers/ResultController.js';
import { authenticate, authorize } from '../middleware/auth.js';

/**
 * Маршрутизатор для работы с результатами тестов.
 */
const router = express.Router();

// Маршрут для получения результатов теста по ID теста
router.get('/test/:testId', getResultsByTestId);

// Маршрут для получения результата по ID
router.get('/:id', getResultById);

// Маршруты для авторов
router.post('/', authenticate, authorize(['author']), createResult);
router.put('/:id', authenticate, authorize(['author']), updateResult);
router.delete('/:id', authenticate, authorize(['author']), deleteResult);

export default router;
