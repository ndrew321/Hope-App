import { Request, Response, NextFunction } from 'express';
export declare function listEvents(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createEvent(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateEvent(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function registerForEvent(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function cancelRegistration(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getAttendees(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=eventController.d.ts.map