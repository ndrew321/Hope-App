import { Request, Response, NextFunction } from 'express';
export declare function register(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function login(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function logout(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function refreshToken(_req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function forgotPassword(req: Request, res: Response, _next: NextFunction): Promise<void>;
export declare function resetPassword(_req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function verifyPhone(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=authController.d.ts.map