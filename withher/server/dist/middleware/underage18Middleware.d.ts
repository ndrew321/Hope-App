import { Request, Response, NextFunction } from 'express';
/**
 * Flag requests originating from under-18 users.
 * Must run AFTER authMiddleware (which computes req.isUnderAge).
 *
 * Usage: add this middleware to routes that need additional safeguards
 * for minors — the downstream controller or service reads req.isUnderAge
 * to apply stricter content filters.
 */
export declare function underage18Middleware(_req: Request, _res: Response, next: NextFunction): void;
/**
 * Hard-block: reject the request if the authenticated user is under 18.
 * Use this on any route that must never be accessible to minors
 * (e.g., mentor self-application without parental consent).
 */
export declare function requireAdult(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=underage18Middleware.d.ts.map