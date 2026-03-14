"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
exports.prisma = globalThis.__prisma ??
    new client_1.PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
        ],
    });
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = exports.prisma;
}
// Log slow queries (> 200 ms) in development
if (process.env.NODE_ENV !== 'production') {
    exports.prisma.$on('query', (e) => {
        if (e.duration > 200) {
            logger_1.logger.warn({ duration: e.duration, query: e.query }, 'Slow Prisma query');
        }
    });
}
exports.prisma.$on('error', (e) => {
    logger_1.logger.error({ message: e.message }, 'Prisma error');
});
//# sourceMappingURL=prisma.js.map