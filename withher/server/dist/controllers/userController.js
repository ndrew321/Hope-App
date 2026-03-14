"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = getUser;
exports.updateUser = updateUser;
exports.getFullProfile = getFullProfile;
exports.uploadProfilePhoto = uploadProfilePhoto;
exports.getPreferences = getPreferences;
exports.updatePreferences = updatePreferences;
exports.updateProfile = updateProfile;
exports.softDeleteUser = softDeleteUser;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const sanitize_1 = require("../utils/sanitize");
const logger_1 = require("../utils/logger");
// ─── GET /api/users/:id ──────────────────────────────────
async function getUser(req, res, next) {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.params.id, deletedAt: null },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                location: true,
                profilePhotoUrl: true,
                bio: true,
                isVerified: true,
                createdAt: true,
                profile: {
                    select: {
                        currentLevel: true,
                        positions: true,
                        yearsExperience: true,
                        clubsTeams: true,
                        mentorshipRole: true,
                        profileCompletenessScore: true,
                    },
                },
            },
        });
        if (!user)
            throw new errors_1.NotFoundError('User');
        (0, response_1.sendSuccess)(res, user);
    }
    catch (err) {
        next(err);
    }
}
// ─── PUT /api/users/:id ──────────────────────────────────
async function updateUser(req, res, next) {
    try {
        if (req.params.id !== req.userId) {
            throw new errors_1.AuthorizationError('You can only update your own profile');
        }
        const sanitized = (0, sanitize_1.sanitizeObject)(req.body);
        const updated = await prisma_1.prisma.user.update({
            where: { id: req.userId },
            data: {
                firstName: sanitized.firstName,
                lastName: sanitized.lastName,
                phone: sanitized.phone,
                location: sanitized.location,
                bio: sanitized.bio,
                gender: sanitized.gender,
            },
            select: { id: true, firstName: true, lastName: true, email: true, location: true, bio: true, updatedAt: true },
        });
        (0, response_1.sendSuccess)(res, updated);
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/users/:id/full-profile ────────────────────
async function getFullProfile(req, res, next) {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.params.id, deletedAt: null },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                location: true,
                profilePhotoUrl: true,
                bio: true,
                isVerified: true,
                verificationStatus: true,
                createdAt: true,
                profile: true,
                preferences: {
                    select: {
                        availabilityHoursPerWeek: true,
                        timezone: true,
                        communicationPreference: true,
                        preferredMentorLevels: true,
                        preferredMenteeLevels: true,
                    },
                },
                userBadges: {
                    include: { badge: true },
                    orderBy: { earnedDate: 'desc' },
                    take: 10,
                },
            },
        });
        if (!user)
            throw new errors_1.NotFoundError('User');
        (0, response_1.sendSuccess)(res, user);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/users/:id/profile-photo ──────────────────
async function uploadProfilePhoto(req, res, next) {
    try {
        if (req.params.id !== req.userId) {
            throw new errors_1.AuthorizationError('You can only update your own profile photo');
        }
        if (!req.file) {
            throw new errors_1.NotFoundError('Photo file');
        }
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(req.file.mimetype)) {
            throw new Error('Only JPEG, PNG, and WebP images are accepted');
        }
        const bucket = firebase_admin_1.default.storage().bucket();
        const fileName = `profile-photos/${req.userId}/${Date.now()}.${req.file.mimetype.split('/')[1]}`;
        const file = bucket.file(fileName);
        await file.save(req.file.buffer, {
            metadata: { contentType: req.file.mimetype },
            public: false,
        });
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        });
        await prisma_1.prisma.user.update({
            where: { id: req.userId },
            data: { profilePhotoUrl: url },
        });
        (0, response_1.sendSuccess)(res, { profilePhotoUrl: url });
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/users/:id/preferences ─────────────────────
async function getPreferences(req, res, next) {
    try {
        if (req.params.id !== req.userId) {
            throw new errors_1.AuthorizationError('You can only view your own preferences');
        }
        const prefs = await prisma_1.prisma.userPreferences.findUnique({
            where: { userId: req.userId },
        });
        if (!prefs)
            throw new errors_1.NotFoundError('Preferences');
        (0, response_1.sendSuccess)(res, prefs);
    }
    catch (err) {
        next(err);
    }
}
// ─── PUT /api/users/:id/preferences ─────────────────────
async function updatePreferences(req, res, next) {
    try {
        if (req.params.id !== req.userId) {
            throw new errors_1.AuthorizationError('You can only update your own preferences');
        }
        const updated = await prisma_1.prisma.userPreferences.upsert({
            where: { userId: req.userId },
            create: { userId: req.userId, ...req.body },
            update: req.body,
        });
        (0, response_1.sendSuccess)(res, updated);
    }
    catch (err) {
        next(err);
    }
}
// ─── PUT /api/users/:id/profile ──────────────────────────
async function updateProfile(req, res, next) {
    try {
        if (req.params.id !== req.userId) {
            throw new errors_1.AuthorizationError('You can only update your own profile');
        }
        const data = req.body;
        // Sanitise text fields
        if (typeof data.mentorshipGoals === 'string') {
            data.mentorshipGoals = (0, sanitize_1.sanitizeText)(data.mentorshipGoals);
        }
        if (typeof data.careerGoals === 'string') {
            data.careerGoals = (0, sanitize_1.sanitizeText)(data.careerGoals);
        }
        const profile = await prisma_1.prisma.userProfile.upsert({
            where: { userId: req.userId },
            create: { userId: req.userId, ...data },
            update: data,
        });
        // Recalculate profile completeness
        const score = computeCompletenessScore(profile);
        const updated = await prisma_1.prisma.userProfile.update({
            where: { userId: req.userId },
            data: { profileCompletenessScore: score },
        });
        (0, response_1.sendSuccess)(res, updated);
    }
    catch (err) {
        next(err);
    }
}
// ─── DELETE /api/users/:id ───────────────────────────────
async function softDeleteUser(req, res, next) {
    try {
        if (req.params.id !== req.userId) {
            throw new errors_1.AuthorizationError('You can only delete your own account');
        }
        await prisma_1.prisma.user.update({
            where: { id: req.userId },
            data: { deletedAt: new Date() },
        });
        // Revoke Firebase tokens so the user cannot authenticate again
        await firebase_admin_1.default.auth().revokeRefreshTokens(req.firebaseUid);
        logger_1.logger.info({ userId: req.userId }, 'User account soft-deleted');
        (0, response_1.sendSuccess)(res, { message: 'Account deleted successfully' });
    }
    catch (err) {
        next(err);
    }
}
// ─── Helpers ──────────────────────────────────────────────
function computeCompletenessScore(profile) {
    const fields = [
        'currentLevel',
        'positions',
        'yearsExperience',
        'clubsTeams',
        'mentorshipRole',
        'mentorshipGoals',
        'careerGoals',
        'communicationStyle',
        'personalityTraits',
        'interestsOutsideSoccer',
    ];
    let filled = 0;
    for (const field of fields) {
        const val = profile[field];
        if (Array.isArray(val) ? val.length > 0 : Boolean(val)) {
            filled++;
        }
    }
    return Math.round((filled / fields.length) * 100);
}
//# sourceMappingURL=userController.js.map