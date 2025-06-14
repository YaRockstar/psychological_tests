import express from 'express';
import * as TestAttemptController from '../controllers/TestAttemptController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, TestAttemptController.getUserTestAttempts);

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

router.post('/:id/answer', authenticate, TestAttemptController.saveTestAnswer);
router.post('/:id/complete', authenticate, TestAttemptController.completeTestAttempt);
router.post('/:id/abandon', authenticate, TestAttemptController.abandonTestAttempt);

router.delete('/user/history', authenticate, TestAttemptController.clearUserTestHistory);

router.get(
  '/check-group/:testId/:groupId',
  authenticate,
  TestAttemptController.checkUserAttemptInGroup
);

export default router;
