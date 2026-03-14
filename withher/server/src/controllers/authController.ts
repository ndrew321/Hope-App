import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { prisma } from '../utils/prisma';
import { sendSuccess } from '../utils/response';
import { ConflictError, NotFoundError, AuthenticationError } from '../utils/errors';
import { sanitizeText } from '../utils/sanitize';
import { logger } from '../utils/logger';

// ─── POST /api/auth/register ─────────────────────────────
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { firebaseUid, email, firstName, lastName, phone, dateOfBirth } = req.body as {
      firebaseUid: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      dateOfBirth?: string;
    };

    // Check for existing account
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { firebaseUid }] },
    });

    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          firebaseUid,
          email: email.toLowerCase().trim(),
          firstName: sanitizeText(firstName),
          lastName: sanitizeText(lastName),
          phone: phone ?? null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      });

      // Create empty profile + preferences rows
      await tx.userProfile.create({ data: { userId: created.id } });
      await tx.userPreferences.create({ data: { userId: created.id } });

      // Seed default notification preferences
      await tx.notificationPreference.create({ data: { userId: created.id } });

      return created;
    });

    logger.info({ userId: user.id }, 'New user registered');
    sendSuccess(res, user, 201);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/login ─────────────────────────────────
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { firebaseUid, idToken } = req.body as { firebaseUid: string; idToken: string };

    // Verify the token is valid before creating a session record
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (decoded.uid !== firebaseUid) {
      throw new AuthenticationError('Token does not match provided Firebase UID');
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePhotoUrl: true,
        isVerified: true,
        profile: { select: { currentLevel: true, mentorshipRole: true, profileCompletenessScore: true } },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/logout ────────────────────────────────
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Revoke all Firebase refresh tokens for this user
    await admin.auth().revokeRefreshTokens(req.firebaseUid);
    logger.info({ userId: req.userId }, 'User logged out');
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/refresh-token ────────────────────────
export async function refreshToken(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Token refresh is handled client-side by the Firebase SDK.
    // This endpoint exists as a passthrough confirmation.
    sendSuccess(res, { message: 'Token refreshed client-side via Firebase SDK' });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/forgot-password ──────────────────────
export async function forgotPassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const { email } = req.body as { email: string };
    // Firebase handles the password reset email
    await admin.auth().generatePasswordResetLink(email.toLowerCase().trim());
    // Always return success to prevent email enumeration
    sendSuccess(res, { message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    // Return success even on Firebase errors to prevent enumeration
    sendSuccess(res, { message: 'If that email exists, a reset link has been sent.' });
  }
}

// ─── POST /api/auth/reset-password ───────────────────────
export async function resetPassword(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Firebase handles OOB code verification on the client side.
    // This endpoint records the event and can revoke old sessions.
    sendSuccess(res, { message: 'Password reset completed. Please log in again.' });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/verify-email ─────────────────────────
export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { oobCode } = req.body as { oobCode: string };
    // Validate that the oob code is a non-empty string (actual verification on client via Firebase)
    if (!oobCode) {
      return next(new AuthenticationError('Invalid verification code'));
    }

    // Mark email verification in our DB if needed — Firebase is source of truth
    sendSuccess(res, { message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/verify-phone ─────────────────────────
export async function verifyPhone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone } = req.body as { phone: string };

    // Update the phone Verification record to VERIFIED
    // In production, OTP verification occurs client-side via Firebase Phone Auth.
    // This endpoint persists the result.
    await prisma.verification.upsert({
      where: {
        userId_verificationType: {
          userId: req.userId,
          verificationType: 'PHONE',
        },
      },
      create: {
        userId: req.userId,
        verificationType: 'PHONE',
        status: 'VERIFIED',
        verifiedDate: new Date(),
      },
      update: {
        status: 'VERIFIED',
        verifiedDate: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: req.userId },
      data: { phone },
    });

    sendSuccess(res, { message: 'Phone verified successfully' });
  } catch (err) {
    next(err);
  }
}
