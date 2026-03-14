"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
/**
 * Global error handler — must be registered as the LAST middleware in app.ts.
 * Maps AppError subclasses to structured JSON responses.
 * Unexpected errors are logged in full but return a generic 500 to the client.
 */
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    if (err instanceof errors_1.AppError && err.isOperational) {
        // Operational errors: safe to expose message to client
        (0, response_1.sendError)(res, err.message, err.code, err.statusCode);
        return;
    }
    // Unexpected / programming errors: log full stack, return generic message
    logger_1.logger.error({
        err: { message: err.message, stack: err.stack },
        path: req.path,
        method: req.method,
        userId: req.userId,
    }, 'Unhandled error');
    (0, response_1.sendError)(res, 'An unexpected error occurred. Please try again later.', 'INTERNAL_ERROR', 500);
}
//# sourceMappingURL=errorHandler.js.map