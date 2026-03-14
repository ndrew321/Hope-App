import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { prisma } from '../utils/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { sanitizeText, sanitizeObject } from '../utils/sanitize';
import { logger } from '../utils/logger';

// ─── GET /api/users/:id ──────────────────────────────────
export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        location: true,
        profilePhotoUrl: true,
        bio: true,
        isVerified: true,
        createdAt: true,
        profile: {
          select: {
            currentLevel: true,
            positions: true,
            yearsExperience: true,
            clubsTeams: true,
            mentorshipRole: true,
            profileCompletenessScore: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundError('User');
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/users/:id ──────────────────────────────────
export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id !== req.userId) {
      throw new AuthorizationError('You can only update your own profile');
    }

    const sanitized = sanitizeObject(req.body as Record<string, unknown>);

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        firstName: sanitized.firstName as string | undefined,
        lastName: sanitized.lastName as string | undefined,
        phone: sanitized.phone as string | undefined,
        location: sanitized.location as string | undefined,
        bio: sanitized.bio as string | undefined,
        gender: sanitized.gender as string | undefined,
      },
      select: { id: true, firstName: true, lastName: true, email: true, location: true, bio: true, updatedAt: true },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/users/:id/full-profile ────────────────────
export async function getFullProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        location: true,
        profilePhotoUrl: true,
        bio: true,
        isVerified: true,
        verificationStatus: true,
        createdAt: true,
        profile: true,
        preferences: {
          select: {
            availabilityHoursPerWeek: true,
            timezone: true,
            communicationPreference: true,
            preferredMentorLevels: true,
            preferredMenteeLevels: true,
          },
        },
        userBadges: {
          include: { badge: true },
          orderBy: { earnedDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) throw new NotFoundError('User');
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/users/:id/profile-photo ──────────────────
export async function uploadProfilePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id !== req.userId) {
      throw new AuthorizationError('You can only update your own profile photo');
    }

    if (!req.file) {
      throw new NotFoundError('Photo file');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(req.file.mimetype)) {
      throw new Error('Only JPEG, PNG, and WebP images are accepted');
    }

    const bucket = admin.storage().bucket();
    const fileName = `profile-photos/${req.userId}/${Date.now()}.${req.file.mimetype.split('/')[1]}`;
    const file = bucket.file(fileName);

    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
      public: false,
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    });

    await prisma.user.update({
      where: { id: req.userId },
      data: { profilePhotoUrl: url },
    });

    sendSuccess(res, { profilePhotoUrl: url });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/users/:id/preferences ─────────────────────
export async function getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id !== req.userId) {
      throw new AuthorizationError('You can only view your own preferences');
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });

    if (!prefs) throw new NotFoundError('Preferences');
    sendSuccess(res, prefs);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/users/:id/preferences ─────────────────────
export async function updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id !== req.userId) {
      throw new AuthorizationError('You can only update your own preferences');
    }

    const updated = await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, ...req.body },
      update: req.body,
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/users/:id/profile ──────────────────────────
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id !== req.userId) {
      throw new AuthorizationError('You can only update your own profile');
    }

    const data = req.body as Record<string, unknown>;

    // Sanitise text fields
    if (typeof data.mentorshipGoals === 'string') {
      data.mentorshipGoals = sanitizeText(data.mentorshipGoals);
    }
    if (typeof data.careerGoals === 'string') {
      data.careerGoals = sanitizeText(data.careerGoals);
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, ...data },
      update: data,
    });

    // Recalculate profile completeness
    const score = computeCompletenessScore(profile as Record<string, unknown>);
    const updated = await prisma.userProfile.update({
      where: { userId: req.userId },
      data: { profileCompletenessScore: score },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/users/:id ───────────────────────────────
export async function softDeleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id !== req.userId) {
      throw new AuthorizationError('You can only delete your own account');
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: { deletedAt: new Date() },
    });

    // Revoke Firebase tokens so the user cannot authenticate again
    await admin.auth().revokeRefreshTokens(req.firebaseUid);

    logger.info({ userId: req.userId }, 'User account soft-deleted');
    sendSuccess(res, { message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── Helpers ──────────────────────────────────────────────

function computeCompletenessScore(profile: Record<string, unknown>): number {
  const fields = [
    'currentLevel',
    'positions',
    'yearsExperience',
    'clubsTeams',
    'mentorshipRole',
    'mentorshipGoals',
    'careerGoals',
    'communicationStyle',
    'personalityTraits',
    'interestsOutsideSoccer',
  ];

  let filled = 0;
  for (const field of fields) {
    const val = profile[field];
    if (Array.isArray(val) ? val.length > 0 : Boolean(val)) {
      filled++;
    }
  }
  return Math.round((filled / fields.length) * 100);
}
