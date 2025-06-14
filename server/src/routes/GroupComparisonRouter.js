import express from 'express';
import {
  compareGroups,
  getGroupComparisonResults,
  deleteComparisonResult,
  deleteAllComparisonResults,
} from '../controllers/GroupController.js';
import { authenticate, authorize } from '../middleware/auth.js';

/**
 * Маршрутизатор для сравнения групп.
 */
const router = express.Router();

// Маршруты для сравнения групп (требуют роль автора)
router.post('/compare', authenticate, authorize(['author']), compareGroups);
router.get(
  '/comparison-results',
  authenticate,
  authorize(['author']),
  getGroupComparisonResults
);

// Маршруты для удаления результатов сравнения
router.delete(
  '/comparison-results/:id',
  authenticate,
  authorize(['author']),
  deleteComparisonResult
);
router.delete(
  '/comparison-results',
  authenticate,
  authorize(['author']),
  deleteAllComparisonResults
);

export default router;
