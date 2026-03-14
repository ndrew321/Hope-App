import { Request, Response, NextFunction } from 'express';
import { AgeRestrictionError } from '../utils/errors';

/**
 * Flag requests originating from under-18 users.
 * Must run AFTER authMiddleware (which computes req.isUnderAge).
 *
 * Usage: add this middleware to routes that need additional safeguards
 * for minors — the downstream controller or service reads req.isUnderAge
 * to apply stricter content filters.
 */
export function underage18Middleware(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // req.isUnderAge is set by authMiddleware when dateOfBirth is known
  // No additional action here — controllers check req.isUnderAge
  next();
}

/**
 * Hard-block: reject the request if the authenticated user is under 18.
 * Use this on any route that must never be accessible to minors
 * (e.g., mentor self-application without parental consent).
 */
export function requireAdult(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.isUnderAge === true) {
    return next(new AgeRestrictionError('This action requires you to be 18 or older'));
  }
  next();
}
