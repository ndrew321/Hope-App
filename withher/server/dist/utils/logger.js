"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
/**
 * Structured logger using pino.
 * - In development: pretty-printed output with timestamps
 * - In production: JSON output for log aggregation (Datadog, CloudWatch, etc.)
 */
exports.logger = (0, pino_1.default)({
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
//# sourceMappingURL=logger.js.map