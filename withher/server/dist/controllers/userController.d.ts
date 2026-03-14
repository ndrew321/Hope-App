import { Request, Response, NextFunction } from 'express';
export declare function getUser(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateUser(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getFullProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function uploadProfilePhoto(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getPreferences(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function softDeleteUser(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=userController.d.ts.map