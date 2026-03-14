"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const prisma_1 = require("./utils/prisma");
const logger_1 = require("./utils/logger");
const PORT = Number(process.env.PORT ?? 3000);
async function bootstrap() {
    // Connect to database
    await prisma_1.prisma.$connect();
    logger_1.logger.info('Database connected');
    const server = app_1.default.listen(PORT, () => {
        logger_1.logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server listening');
    });
    // Graceful shutdown
    const shutdown = async (signal) => {
        logger_1.logger.info({ signal }, 'Shutdown signal received');
        server.close(async () => {
            await prisma_1.prisma.$disconnect();
            logger_1.logger.info('Server stopped, database disconnected');
            process.exit(0);
        });
        // Force exit if graceful shutdown takes too long
        setTimeout(() => {
            logger_1.logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10_000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error({ reason }, 'Unhandled promise rejection');
    });
    process.on('uncaughtException', (err) => {
        logger_1.logger.fatal({ err }, 'Uncaught exception — shutting down');
        process.exit(1);
    });
}
bootstrap().catch((err) => {
    logger_1.logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
});
//# sourceMappingURL=index.js.map