import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { swipeRateLimit } from '../middleware/rateLimitMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { parentalApprovalMiddleware } from '../middleware/parentalApprovalMiddleware';
import * as MatchController from '../controllers/matchController';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const SwipeSchema = z.object({
  targetUserId: z.string().min(1),
  direction: z.enum(['left', 'right']),
});

const StartProgramSchema = z.object({
  menteeInitialGoal: z.string().min(10).max(3000),
});

router.get('/discover', MatchController.discover);
router.post('/swipe', swipeRateLimit, validateBody(SwipeSchema), MatchController.swipe);
router.get('/liked-me', MatchController.likedMe);
router.get('/active', MatchController.getActiveMatches);
router.post('/:id/confirm', parentalApprovalMiddleware, MatchController.confirmMatch);
router.post('/:id/start-program', validateBody(StartProgramSchema), MatchController.startProgram);

export default router;
