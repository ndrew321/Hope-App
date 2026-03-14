import pino from 'pino';
/**
 * Structured logger using pino.
 * - In development: pretty-printed output with timestamps
 * - In production: JSON output for log aggregation (Datadog, CloudWatch, etc.)
 */
export declare const logger: pino.Logger<never, boolean>;
export type Logger = typeof logger;
//# sourceMappingURL=logger.d.ts.map