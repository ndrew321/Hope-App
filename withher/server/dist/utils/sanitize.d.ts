/**
 * Input sanitisation helpers.
 * Applied to all user-submitted text at the controller layer.
 */
/**
 * Remove HTML tags and normalise whitespace from a string.
 */
export declare function sanitizeText(input: string): string;
/**
 * Sanitise every string property in a plain object (one level deep).
 */
export declare function sanitizeObject<T extends Record<string, unknown>>(obj: T): T;
/**
 * Parse an integer from query params with a fallback.
 */
export declare function parseIntParam(value: unknown, fallback: number): number;
/**
 * Safely parse a boolean from a query parameter string.
 * "true" / "1" → true; everything else → false.
 */
export declare function parseBoolParam(value: unknown): boolean;
//# sourceMappingURL=sanitize.d.ts.map