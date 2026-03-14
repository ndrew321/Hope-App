import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validationMiddleware';
import * as EventController from '../controllers/eventController';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const EventIdParam = z.object({ id: z.string().min(1) });

const CreateEventSchema = z.object({
  eventType: z.enum(['WORKSHOP', 'NETWORKING', 'SUMMIT', 'LOCAL_MEETUP', 'CLINIC']),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  startDatetime: z.string().datetime(),
  endDatetime: z.string().datetime(),
  locationOrLink: z.string().max(500).optional(),
  maxAttendees: z.number().int().min(1).optional(),
  levelTargeting: z.array(z.enum(['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM'])).default([]),
  registrationRequired: z.boolean().default(false),
});

const FeedbackSchema = z.object({
  feedbackRating: z.number().int().min(1).max(5),
  feedbackText: z.string().max(2000).optional(),
});

router.get('/', EventController.listEvents);
router.post('/', validateBody(CreateEventSchema), EventController.createEvent);
router.put('/:id', validateParams(EventIdParam), validateBody(CreateEventSchema.partial()), EventController.updateEvent);
router.delete('/:id', validateParams(EventIdParam), EventController.deleteEvent);
router.post('/:id/register', validateParams(EventIdParam), EventController.registerForEvent);
router.delete('/:id/register', validateParams(EventIdParam), EventController.cancelRegistration);
router.get('/:id/attendees', validateParams(EventIdParam), EventController.getAttendees);
router.post('/:id/feedback', validateParams(EventIdParam), validateBody(FeedbackSchema), EventController.submitFeedback);

export default router;
