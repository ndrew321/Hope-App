import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Global error handler — must be registered as the LAST middleware in app.ts.
 * Maps AppError subclasses to structured JSON responses.
 * Unexpected errors are logged in full but return a generic 500 to the client.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError && err.isOperational) {
    // Operational errors: safe to expose message to client
    sendError(res, err.message, err.code, err.statusCode);
    return;
  }

  // Unexpected / programming errors: log full stack, return generic message
  logger.error(
    {
      err: { message: err.message, stack: err.stack },
      path: req.path,
      method: req.method,
      userId: req.userId,
    },
    'Unhandled error',
  );

  sendError(res, 'An unexpected error occurred. Please try again later.', 'INTERNAL_ERROR', 500);
}
