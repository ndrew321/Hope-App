import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateParams } from '../middleware/validationMiddleware';
import * as GamificationController from '../controllers/gamificationController';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const UserIdParam = z.object({ id: z.string().min(1) });

router.get('/badges', GamificationController.listBadges);
router.get('/users/:id/badges', validateParams(UserIdParam), GamificationController.getUserBadges);
router.get('/leaderboards', GamificationController.getLeaderboards);
router.get('/users/:id/streaks', validateParams(UserIdParam), GamificationController.getUserStreaks);

export default router;
