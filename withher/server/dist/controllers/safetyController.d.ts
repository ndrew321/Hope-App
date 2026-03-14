import { Request, Response, NextFunction } from 'express';
export declare function initiateIdentityVerification(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function initiateBackgroundCheck(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getVerificationStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function reportUser(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function blockUser(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function unblockUser(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getBlockedUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=safetyController.d.ts.map