import { Request, Response, NextFunction } from 'express';
export declare function getProgram(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getProgramSessions(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function scheduleSession(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function rescheduleSession(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function cancelSession(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function submitNotes(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getNotes(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=sessionController.d.ts.map