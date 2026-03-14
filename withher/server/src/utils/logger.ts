import pino from 'pino';

/**
 * Structured logger using pino.
 * - In development: pretty-printed output with timestamps
 * - In production: JSON output for log aggregation (Datadog, CloudWatch, etc.)
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  base: {
    service: 'withher-server',
    env: process.env.NODE_ENV,
  },
});

export type Logger = typeof logger;
