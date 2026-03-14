import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Returns an Express middleware that validates req.body against a Zod schema.
 * Sends a 400 response with field-level error details on failure.
 */
export declare function validateBody<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Returns an Express middleware that validates req.query against a Zod schema.
 */
export declare function validateQuery<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Returns an Express middleware that validates req.params against a Zod schema.
 */
export declare function validateParams<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validationMiddleware.d.ts.map