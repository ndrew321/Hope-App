import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AgeRestrictionError } from '../utils/errors';

/**
 * Verify that an under-18 mentee has an approved parental consent record
 * before a match confirmation request is processed.
 *
 * Must run AFTER authMiddleware.
 *
 * If the user is 18+ this middleware is a no-op.
 * If the user is under 18 and no approved consent exists, the request is rejected.
 */
export async function parentalApprovalMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.isUnderAge) {
      // Not a minor — pass straight through
      return next();
    }

    const consent = await prisma.parentalConsent.findUnique({
      where: { childUserId: req.userId },
      select: { consentGiven: true, signedDate: true },
    });

    if (!consent?.consentGiven) {
      return next(
        new AgeRestrictionError(
          'A parent or guardian must approve this action before you can proceed.',
        ),
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
