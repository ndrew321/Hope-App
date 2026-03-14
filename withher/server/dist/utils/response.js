"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
exports.buildPaginationMeta = buildPaginationMeta;
exports.parsePagination = parsePagination;
// ─── Helper functions ────────────────────────────────────
/**
 * Send a standardised JSON success response.
 */
function sendSuccess(res, data, statusCode = 200, meta) {
    const body = { success: true, data };
    if (meta)
        body.meta = meta;
    return res.status(statusCode).json(body);
}
/**
 * Send a standardised JSON error response.
 */
function sendError(res, message, code, statusCode = 500) {
    return res.status(statusCode).json({ success: false, error: message, code });
}
/**
 * Build pagination meta from query params + total count.
 */
function buildPaginationMeta(page, limit, total) {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
}
/**
 * Parse and clamp pagination query params.
 */
function parsePagination(rawPage, rawLimit, maxLimit = 100) {
    const page = Math.max(1, parseInt(String(rawPage ?? '1'), 10) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(String(rawLimit ?? '20'), 10) || 20));
    return { page, limit, skip: (page - 1) * limit };
}
//# sourceMappingURL=response.js.map