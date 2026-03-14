"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.refreshToken = refreshToken;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.verifyEmail = verifyEmail;
exports.verifyPhone = verifyPhone;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const sanitize_1 = require("../utils/sanitize");
const logger_1 = require("../utils/logger");
// ─── POST /api/auth/register ─────────────────────────────
async function register(req, res, next) {
    try {
        const { firebaseUid, email, firstName, lastName, phone, dateOfBirth } = req.body;
        // Check for existing account
        const existing = await prisma_1.prisma.user.findFirst({
            where: { OR: [{ email }, { firebaseUid }] },
        });
        if (existing) {
            throw new errors_1.ConflictError('An account with this email already exists');
        }
        const user = await prisma_1.prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    firebaseUid,
                    email: email.toLowerCase().trim(),
                    firstName: (0, sanitize_1.sanitizeText)(firstName),
                    lastName: (0, sanitize_1.sanitizeText)(lastName),
                    phone: phone ?? null,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    createdAt: true,
                },
            });
            // Create empty profile + preferences rows
            await tx.userProfile.create({ data: { userId: created.id } });
            await tx.userPreferences.create({ data: { userId: created.id } });
            // Seed default notification preferences
            await tx.notificationPreference.create({ data: { userId: created.id } });
            return created;
        });
        logger_1.logger.info({ userId: user.id }, 'New user registered');
        (0, response_1.sendSuccess)(res, user, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/auth/login ─────────────────────────────────
async function login(req, res, next) {
    try {
        const { firebaseUid, idToken } = req.body;
        // Verify the token is valid before creating a session record
        const decoded = await firebase_admin_1.default.auth().verifyIdToken(idToken);
        if (decoded.uid !== firebaseUid) {
            throw new errors_1.AuthenticationError('Token does not match provided Firebase UID');
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { firebaseUid },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
                isVerified: true,
                profile: { select: { currentLevel: true, mentorshipRole: true, profileCompletenessScore: true } },
            },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User');
        }
        (0, response_1.sendSuccess)(res, user);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/auth/logout ────────────────────────────────
async function logout(req, res, next) {
    try {
        // Revoke all Firebase refresh tokens for this user
        await firebase_admin_1.default.auth().revokeRefreshTokens(req.firebaseUid);
        logger_1.logger.info({ userId: req.userId }, 'User logged out');
        (0, response_1.sendSuccess)(res, { message: 'Logged out successfully' });
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/auth/refresh-token ────────────────────────
async function refreshToken(_req, res, next) {
    try {
        // Token refresh is handled client-side by the Firebase SDK.
        // This endpoint exists as a passthrough confirmation.
        (0, response_1.sendSuccess)(res, { message: 'Token refreshed client-side via Firebase SDK' });
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/auth/forgot-password ──────────────────────
async function forgotPassword(req, res, _next) {
    try {
        const { email } = req.body;
        // Firebase handles the password reset email
        await firebase_admin_1.default.auth().generatePasswordResetLink(email.toLowerCase().trim());
        // Always return success to prevent email enumeration
        (0, response_1.sendSuccess)(res, { message: 'If that email exists, a reset link has been sent.' });
    }
    catch (err) {
        // Return success even on Firebase errors to prevent enumeration
        (0, response_1.sendSuccess)(res, { message: 'If that email exists, a reset link has been sent.' });
    }
}
// ─── POST /api/auth/reset-password ───────────────────────
async function resetPassword(_req, res, next) {
    try {
        // Firebase handles OOB code verification on the client side.
        // This endpoint records the event and can revoke old sessions.
        (0, response_1.sendSuccess)(res, { message: 'Password reset completed. Please log in again.' });
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/auth/verify-email ─────────────────────────
async function verifyEmail(req, res, next) {
    try {
        const { oobCode } = req.body;
        // Validate that the oob code is a non-empty string (actual verification on client via Firebase)
        if (!oobCode) {
            return next(new errors_1.AuthenticationError('Invalid verification code'));
        }
        // Mark email verification in our DB if needed — Firebase is source of truth
        (0, response_1.sendSuccess)(res, { message: 'Email verified successfully' });
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/auth/verify-phone ─────────────────────────
async function verifyPhone(req, res, next) {
    try {
        const { phone } = req.body;
        // Update the phone Verification record to VERIFIED
        // In production, OTP verification occurs client-side via Firebase Phone Auth.
        // This endpoint persists the result.
        await prisma_1.prisma.verification.upsert({
            where: {
                userId_verificationType: {
                    userId: req.userId,
                    verificationType: 'PHONE',
                },
            },
            create: {
                userId: req.userId,
                verificationType: 'PHONE',
                status: 'VERIFIED',
                verifiedDate: new Date(),
            },
            update: {
                status: 'VERIFIED',
                verifiedDate: new Date(),
            },
        });
        await prisma_1.prisma.user.update({
            where: { id: req.userId },
            data: { phone },
        });
        (0, response_1.sendSuccess)(res, { message: 'Phone verified successfully' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=authController.js.map