import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validationMiddleware';
import { underage18Middleware } from '../middleware/underage18Middleware';
import * as UserController from '../controllers/userController';
import { z } from 'zod';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Zod Schemas ──────────────────────────────────────────

const IdParamSchema = z.object({ id: z.string().min(1) });

const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  location: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  gender: z.string().max(50).optional(),
});

const UpdateProfileSchema = z.object({
  currentLevel: z.enum(['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM']).optional(),
  positions: z.array(z.string()).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  clubsTeams: z.array(z.string()).optional(),
  specializedPrograms: z.array(z.string()).optional(),
  mentorshipRole: z.enum(['MENTOR', 'MENTEE', 'BOTH']).optional(),
  mentorshipGoals: z.string().max(3000).optional(),
  careerGoals: z.string().max(3000).optional(),
  communicationStyle: z.string().max(200).optional(),
  personalityTraits: z.array(z.string()).optional(),
  bipocIdentification: z.boolean().optional(),
  lgbtqIdentification: z.boolean().optional(),
  interestsOutsideSoccer: z.array(z.string()).optional(),
});

const UpdatePreferencesSchema = z.object({
  preferredMentorLevels: z.array(z.enum(['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM'])).optional(),
  preferredMenteeLevels: z.array(z.enum(['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM'])).optional(),
  geographicPreference: z.string().max(200).optional(),
  maxDistanceKm: z.number().int().min(0).max(20000).optional(),
  availabilityHoursPerWeek: z.number().int().min(0).max(40).optional(),
  timezone: z.string().max(60).optional(),
  communicationPreference: z.enum(['SYNC', 'ASYNC', 'BOTH']).optional(),
});

// ─── All user routes require auth ─────────────────────────

router.use(authMiddleware);
router.use(underage18Middleware);

router.get('/:id', validateParams(IdParamSchema), UserController.getUser);
router.put('/:id', validateParams(IdParamSchema), validateBody(UpdateUserSchema), UserController.updateUser);
router.get('/:id/full-profile', validateParams(IdParamSchema), UserController.getFullProfile);
router.post('/:id/profile-photo', validateParams(IdParamSchema), upload.single('photo'), UserController.uploadProfilePhoto);
router.get('/:id/preferences', validateParams(IdParamSchema), UserController.getPreferences);
router.put('/:id/preferences', validateParams(IdParamSchema), validateBody(UpdatePreferencesSchema), UserController.updatePreferences);
router.put('/:id/profile', validateParams(IdParamSchema), validateBody(UpdateProfileSchema), UserController.updateProfile);
router.delete('/:id', validateParams(IdParamSchema), UserController.softDeleteUser);

export default router;
