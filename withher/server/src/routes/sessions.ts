import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validationMiddleware';
import * as SessionController from '../controllers/sessionController';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const ProgramIdParam = z.object({ id: z.string().min(1) });
const SessionIdParam = z.object({ id: z.string().min(1) });

const ScheduleSessionSchema = z.object({
  mentorshipProgramId: z.string().min(1),
  sessionNumber: z.number().int().min(1).max(4),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().optional(),
  sessionType: z.enum(['SYNC_CALL', 'ASYNC_MESSAGE', 'GROUP', 'EVENT']).default('SYNC_CALL'),
});

const RescheduleSchema = z.object({
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().optional(),
});

const SessionNotesSchema = z.object({
  mentorNotes: z.string().max(5000).optional(),
  menteeReflection: z.string().max(5000).optional(),
  topicsDiscussed: z.array(z.string()).default([]),
  actionItemsForMentee: z.array(z.string()).default([]),
  actionItemsForMentor: z.array(z.string()).default([]),
  keyTakeaways: z.array(z.string()).default([]),
  resourcesShared: z.array(z.string()).default([]),
  nextSessionAgenda: z.string().max(3000).optional(),
  menteeSelfRating: z.number().int().min(1).max(5).optional(),
});

router.get('/programs/:id', validateParams(ProgramIdParam), SessionController.getProgram);
router.get('/programs/:id/sessions', validateParams(ProgramIdParam), SessionController.getProgramSessions);
router.post('/sessions', validateBody(ScheduleSessionSchema), SessionController.scheduleSession);
router.put('/sessions/:id', validateParams(SessionIdParam), validateBody(RescheduleSchema), SessionController.rescheduleSession);
router.delete('/sessions/:id', validateParams(SessionIdParam), SessionController.cancelSession);
router.post('/sessions/:id/notes', validateParams(SessionIdParam), validateBody(SessionNotesSchema), SessionController.submitNotes);
router.get('/sessions/:id/notes', validateParams(SessionIdParam), SessionController.getNotes);

export default router;
