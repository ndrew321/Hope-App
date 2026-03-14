import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validationMiddleware';
import * as SafetyController from '../controllers/safetyController';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const UserIdParam = z.object({ id: z.string().min(1) });

const ReportSchema = z.object({
  reportType: z.string().min(1).max(100),
  description: z.string().min(10).max(3000),
  evidenceUrls: z.array(z.string().url()).default([]),
  severityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
});

// ─── Verification routes ──────────────────────────────────
router.post('/verification/identity', SafetyController.initiateIdentityVerification);
router.post('/verification/background-check', SafetyController.initiateBackgroundCheck);
router.get('/verification/status', SafetyController.getVerificationStatus);

// ─── Moderation routes ────────────────────────────────────
router.post('/users/:id/report', validateParams(UserIdParam), validateBody(ReportSchema), SafetyController.reportUser);
router.post('/users/:id/block', validateParams(UserIdParam), SafetyController.blockUser);
router.delete('/users/:id/block', validateParams(UserIdParam), SafetyController.unblockUser);
router.get('/users/blocked', SafetyController.getBlockedUsers);

export default router;
