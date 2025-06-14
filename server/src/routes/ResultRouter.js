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

router.get('/test/:testId', getResultsByTestId);
router.get('/:id', getResultById);

router.post('/', authenticate, authorize(['author']), createResult);
router.put('/:id', authenticate, authorize(['author']), updateResult);
router.delete('/:id', authenticate, authorize(['author']), deleteResult);

export default router;
