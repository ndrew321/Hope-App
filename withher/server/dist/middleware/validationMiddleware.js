"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
const response_1 = require("../utils/response");
/**
 * Returns an Express middleware that validates req.body against a Zod schema.
 * Sends a 400 response with field-level error details on failure.
 */
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const formatted = formatZodError(result.error);
            (0, response_1.sendError)(res, formatted, 'VALIDATION_ERROR', 400);
            return;
        }
        // Replace req.body with the coerced + stripped Zod output
        req.body = result.data;
        next();
    };
}
/**
 * Returns an Express middleware that validates req.query against a Zod schema.
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const formatted = formatZodError(result.error);
            (0, response_1.sendError)(res, formatted, 'VALIDATION_ERROR', 400);
            return;
        }
        req.query = result.data;
        next();
    };
}
/**
 * Returns an Express middleware that validates req.params against a Zod schema.
 */
function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            const formatted = formatZodError(result.error);
            (0, response_1.sendError)(res, formatted, 'VALIDATION_ERROR', 400);
            return;
        }
        req.params = result.data;
        next();
    };
}
// ─── Helpers ─────────────────────────────────────────────
function formatZodError(error) {
    return error.errors
        .map((e) => {
        const field = e.path.join('.');
        return field ? `${field}: ${e.message}` : e.message;
    })
        .join('; ');
}
//# sourceMappingURL=validationMiddleware.js.map