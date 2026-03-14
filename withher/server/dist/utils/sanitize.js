"use strict";
/**
 * Input sanitisation helpers.
 * Applied to all user-submitted text at the controller layer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeText = sanitizeText;
exports.sanitizeObject = sanitizeObject;
exports.parseIntParam = parseIntParam;
exports.parseBoolParam = parseBoolParam;
// Strip HTML tags to prevent stored XSS
const HTML_TAG_RE = /<[^>]*>/g;
// Normalise multiple consecutive whitespace characters
const MULTI_WS_RE = /\s{2,}/g;
/**
 * Remove HTML tags and normalise whitespace from a string.
 */
function sanitizeText(input) {
    return input.replace(HTML_TAG_RE, '').replace(MULTI_WS_RE, ' ').trim();
}
/**
 * Sanitise every string property in a plain object (one level deep).
 */
function sanitizeObject(obj) {
    const result = { ...obj };
    for (const key of Object.keys(result)) {
        const val = result[key];
        if (typeof val === 'string') {
            result[key] = sanitizeText(val);
        }
    }
    return result;
}
/**
 * Parse an integer from query params with a fallback.
 */
function parseIntParam(value, fallback) {
    const parsed = parseInt(String(value ?? ''), 10);
    return isNaN(parsed) ? fallback : parsed;
}
/**
 * Safely parse a boolean from a query parameter string.
 * "true" / "1" → true; everything else → false.
 */
function parseBoolParam(value) {
    return value === 'true' || value === '1';
}
//# sourceMappingURL=sanitize.js.map