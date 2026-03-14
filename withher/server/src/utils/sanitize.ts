/**
 * Input sanitisation helpers.
 * Applied to all user-submitted text at the controller layer.
 */

// Strip HTML tags to prevent stored XSS
const HTML_TAG_RE = /<[^>]*>/g;
// Normalise multiple consecutive whitespace characters
const MULTI_WS_RE = /\s{2,}/g;

/**
 * Remove HTML tags and normalise whitespace from a string.
 */
export function sanitizeText(input: string): string {
  return input.replace(HTML_TAG_RE, '').replace(MULTI_WS_RE, ' ').trim();
}

/**
 * Sanitise every string property in a plain object (one level deep).
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (typeof val === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeText(val);
    }
  }
  return result;
}

/**
 * Parse an integer from query params with a fallback.
 */
export function parseIntParam(value: unknown, fallback: number): number {
  const parsed = parseInt(String(value ?? ''), 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safely parse a boolean from a query parameter string.
 * "true" / "1" → true; everything else → false.
 */
export function parseBoolParam(value: unknown): boolean {
  return value === 'true' || value === '1';
}
