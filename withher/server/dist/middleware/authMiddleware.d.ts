import { Request, Response, NextFunction } from 'express';
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
export declare function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=authMiddleware.d.ts.map