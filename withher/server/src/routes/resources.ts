import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validationMiddleware';
import * as ResourceController from '../controllers/resourceController';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const ResourceIdParam = z.object({ id: z.string().min(1) });

const CreateResourceSchema = z.object({
  type: z.enum(['ARTICLE', 'VIDEO', 'GUIDE', 'BOOK', 'COURSE', 'TOOL']),
  title: z.string().min(3).max(300),
  description: z.string().max(3000).optional(),
  authorOrCurator: z.string().max(200).optional(),
  urlOrFilePath: z.string().url(),
  category: z.array(z.string()).default([]),
  levelTargeting: z.array(z.enum(['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM'])).default([]),
  topicTags: z.array(z.string()).default([]),
});

router.get('/', ResourceController.listResources);
router.get('/saved', ResourceController.getSavedResources);
router.get('/:id', validateParams(ResourceIdParam), ResourceController.getResource);
router.post('/', validateBody(CreateResourceSchema), ResourceController.createResource);
router.post('/:id/save', validateParams(ResourceIdParam), ResourceController.saveResource);
router.post('/:id/view', validateParams(ResourceIdParam), ResourceController.trackView);

export default router;
