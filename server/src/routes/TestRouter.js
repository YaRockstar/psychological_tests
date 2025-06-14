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
  getGroupTestResults,
} from '../controllers/TestController.js';
import { authenticate, authorize } from '../middleware/auth.js';

/**
 * Маршрутизатор для работы с тестами.
 */
const router = express.Router();

router.get('/public', getPublicTests);

router.post('/', authenticate, authorize(['author']), createTest);
router.get('/author', authenticate, authorize(['author']), getAuthorTests);
router.get('/:id/questions', getTestQuestions);
router.get('/:id', getTestById);
router.put('/:id', authenticate, authorize(['author']), updateTest);
router.post('/:id/publish', authenticate, authorize(['author']), publishTest);
router.post('/:id/unpublish', authenticate, authorize(['author']), unpublishTest);
router.delete('/:id', authenticate, authorize(['author']), deleteTest);
router.get(
  '/group/:groupId/results',
  authenticate,
  authorize(['author']),
  getGroupTestResults
);

router.get('/', authenticate, authorize(['admin']), getAllTests);

router.get('/:id/details', getTestWithQuestions);

router.post('/:id/attempt', authenticate, startTestAttempt);

export default router;
