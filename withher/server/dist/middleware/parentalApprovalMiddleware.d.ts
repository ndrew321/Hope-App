import { Request, Response, NextFunction } from 'express';
/**
 * Verify that an under-18 mentee has an approved parental consent record
 * before a match confirmation request is processed.
 *
 * Must run AFTER authMiddleware.
 *
 * If the user is 18+ this middleware is a no-op.
 * If the user is under 18 and no approved consent exists, the request is rejected.
 */
export declare function parentalApprovalMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=parentalApprovalMiddleware.d.ts.map