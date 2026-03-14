import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validationMiddleware';
import * as NotificationController from '../controllers/notificationController';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const NotifIdParam = z.object({ id: z.string().min(1) });
const UserIdParam = z.object({ id: z.string().min(1) });

const RegisterTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});

const UpdatePrefsSchema = z.object({
  newMatch: z.boolean().optional(),
  newMessage: z.boolean().optional(),
  sessionReminder: z.boolean().optional(),
  sessionNotes: z.boolean().optional(),
  communityPost: z.boolean().optional(),
  badgeEarned: z.boolean().optional(),
  programEndingReminder: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
});

router.get('/notifications', NotificationController.listNotifications);
router.post('/notifications/:id/read', validateParams(NotifIdParam), NotificationController.markRead);
router.post('/push-tokens', validateBody(RegisterTokenSchema), NotificationController.registerPushToken);
router.put('/users/:id/notification-preferences', validateParams(UserIdParam), validateBody(UpdatePrefsSchema), NotificationController.updatePreferences);

export default router;
