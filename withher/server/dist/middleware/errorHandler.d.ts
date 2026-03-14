import { Request, Response, NextFunction } from 'express';
/**
 * Global error handler — must be registered as the LAST middleware in app.ts.
 * Maps AppError subclasses to structured JSON responses.
 * Unexpected errors are logged in full but return a generic 500 to the client.
 */
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map