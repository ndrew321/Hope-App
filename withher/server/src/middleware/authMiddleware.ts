import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { AuthenticationError } from '../utils/errors';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      userId: string;
      firebaseUid: string;
      userAge?: number;
      isUnderAge?: boolean;
    }
  }
}

/**
 * Verify the Firebase JWT sent in Authorization: Bearer <token>.
 * Attaches req.userId (internal DB id) and req.firebaseUid to the request.
 * Throws AuthenticationError if the token is missing, invalid, or revoked.
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or malformed Authorization header');
    }

    const token = authHeader.slice(7);
    const decoded = await admin.auth().verifyIdToken(token, /* checkRevoked= */ true);

    // Fetch the internal user record that maps to this Firebase UID
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, firebaseUid: true, dateOfBirth: true, deletedAt: true },
    });

    if (!user) {
      throw new AuthenticationError('User account not found');
    }

    if (user.deletedAt) {
      throw new AuthenticationError('Account has been deactivated');
    }

    req.userId = user.id;
    req.firebaseUid = user.firebaseUid;

    // Compute age for downstream middleware
    if (user.dateOfBirth) {
      const ageMs = Date.now() - user.dateOfBirth.getTime();
      const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25));
      req.userAge = age;
      req.isUnderAge = age < 18;
    }

    next();
  } catch (err) {
    if (err instanceof AuthenticationError) {
      next(err);
    } else {
      logger.warn({ err }, 'Firebase token verification failed');
      next(new AuthenticationError('Invalid or expired token'));
    }
  }
}
