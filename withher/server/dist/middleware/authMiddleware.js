"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const errors_1 = require("../utils/errors");
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
/**
 * Verify the Firebase JWT sent in Authorization: Bearer <token>.
 * Attaches req.userId (internal DB id) and req.firebaseUid to the request.
 * Throws AuthenticationError if the token is missing, invalid, or revoked.
 */
async function authMiddleware(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new errors_1.AuthenticationError('Missing or malformed Authorization header');
        }
        const token = authHeader.slice(7);
        const decoded = await firebase_admin_1.default.auth().verifyIdToken(token, /* checkRevoked= */ true);
        // Fetch the internal user record that maps to this Firebase UID
        const user = await prisma_1.prisma.user.findUnique({
            where: { firebaseUid: decoded.uid },
            select: { id: true, firebaseUid: true, dateOfBirth: true, deletedAt: true },
        });
        if (!user) {
            throw new errors_1.AuthenticationError('User account not found');
        }
        if (user.deletedAt) {
            throw new errors_1.AuthenticationError('Account has been deactivated');
        }
        req.userId = user.id;
        req.firebaseUid = user.firebaseUid;
        // Compute age for downstream middleware
        if (user.dateOfBirth) {
            const ageMs = Date.now() - user.dateOfBirth.getTime();
            const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25));
            req.userAge = age;
            req.isUnderAge = age < 18;
        }
        next();
    }
    catch (err) {
        if (err instanceof errors_1.AuthenticationError) {
            next(err);
        }
        else {
            logger_1.logger.warn({ err }, 'Firebase token verification failed');
            next(new errors_1.AuthenticationError('Invalid or expired token'));
        }
    }
}
//# sourceMappingURL=authMiddleware.js.map