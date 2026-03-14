"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const FirebaseService_1 = require("./services/FirebaseService");
const rateLimitMiddleware_1 = require("./middleware/rateLimitMiddleware");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const matches_1 = __importDefault(require("./routes/matches"));
const messages_1 = __importDefault(require("./routes/messages"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const community_1 = __importDefault(require("./routes/community"));
const events_1 = __importDefault(require("./routes/events"));
const resources_1 = __importDefault(require("./routes/resources"));
const safety_1 = __importDefault(require("./routes/safety"));
const gamification_1 = __importDefault(require("./routes/gamification"));
const notifications_1 = __importDefault(require("./routes/notifications"));
// Initialize Firebase Admin once
(0, FirebaseService_1.initializeFirebase)();
const app = (0, express_1.default)();
// Security headers
app.use((0, helmet_1.default)());
// CORS — restrict to known origins in production.
// Support both ALLOWED_ORIGINS and legacy CORS_ORIGIN for backward compatibility.
const allowedOrigins = process.env.ALLOWED_ORIGINS ?? process.env.CORS_ORIGIN ?? 'http://localhost:8081';
const parsedAllowedOrigins = allowedOrigins
    .split(',')
    .map((o) => o.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (native mobile apps, curl)
        if (!origin || parsedAllowedOrigins.includes(origin))
            return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
// Gzip compression
app.use((0, compression_1.default)());
// Body parsing
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
// Request logger
app.use((req, _res, next) => {
    logger_1.logger.debug({ method: req.method, url: req.url }, 'Incoming request');
    next();
});
// Global rate limit
app.use(rateLimitMiddleware_1.generalRateLimit);
// Health check (unauthenticated)
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/matches', matches_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/sessions', sessions_1.default);
app.use('/api/community', community_1.default);
app.use('/api/events', events_1.default);
app.use('/api/resources', resources_1.default);
app.use('/api/safety', safety_1.default);
app.use('/api/gamification', gamification_1.default);
app.use('/api/notifications', notifications_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});
// Global error handler (must be last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map