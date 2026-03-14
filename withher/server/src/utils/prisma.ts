import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// ─── Singleton Prisma client ─────────────────────────────
// Re-use a single PrismaClient instance across the application.
// In development, attach it to the global object to prevent
// exhausting database connections during hot-reloads.

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Log slow queries (> 200 ms) in development
if (process.env.NODE_ENV !== 'production') {
  (prisma as PrismaClient).$on('query' as never, (e: { duration: number; query: string }) => {
    if (e.duration > 200) {
      logger.warn({ duration: e.duration, query: e.query }, 'Slow Prisma query');
    }
  });
}

(prisma as PrismaClient).$on('error' as never, (e: { message: string }) => {
  logger.error({ message: e.message }, 'Prisma error');
});
