"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateIdentityVerification = initiateIdentityVerification;
exports.initiateBackgroundCheck = initiateBackgroundCheck;
exports.getVerificationStatus = getVerificationStatus;
exports.reportUser = reportUser;
exports.blockUser = blockUser;
exports.unblockUser = unblockUser;
exports.getBlockedUsers = getBlockedUsers;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const SafetyService_1 = require("../services/SafetyService");
const BackgroundCheckService_1 = require("../services/BackgroundCheckService");
// ─── POST /api/verification/identity ─────────────────────
async function initiateIdentityVerification(req, res, next) {
    try {
        const verification = await prisma_1.prisma.verification.upsert({
            where: { userId_verificationType: { userId: req.userId, verificationType: 'IDENTITY' } },
            create: { userId: req.userId, verificationType: 'IDENTITY', status: 'PENDING' },
            update: { status: 'PENDING' },
        });
        (0, response_1.sendSuccess)(res, { verificationId: verification.id, status: verification.status }, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/verification/background-check ─────────────
async function initiateBackgroundCheck(req, res, next) {
    try {
        const result = await BackgroundCheckService_1.BackgroundCheckService.initiateCheck(req.userId);
        (0, response_1.sendSuccess)(res, result, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/verification/status ────────────────────────
async function getVerificationStatus(req, res, next) {
    try {
        const verifications = await prisma_1.prisma.verification.findMany({
            where: { userId: req.userId },
            select: { verificationType: true, status: true, verifiedDate: true, expirationDate: true },
        });
        (0, response_1.sendSuccess)(res, verifications);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/users/:id/report ──────────────────────────
async function reportUser(req, res, next) {
    try {
        if (req.params.id === req.userId)
            throw new errors_1.ConflictError('Cannot report yourself');
        const reported = await prisma_1.prisma.user.findUnique({ where: { id: req.params.id, deletedAt: null } });
        if (!reported)
            throw new errors_1.NotFoundError('User');
        const { reportType, description, evidenceUrls, severityLevel } = req.body;
        await SafetyService_1.SafetyService.handleReport({
            reportedByUserId: req.userId,
            reportedUserId: req.params.id,
            reportType,
            description,
            evidenceUrls,
            severityLevel,
        });
        (0, response_1.sendSuccess)(res, { message: 'Report submitted. Our safety team will review it shortly.' }, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/users/:id/block ───────────────────────────
async function blockUser(req, res, next) {
    try {
        if (req.params.id === req.userId)
            throw new errors_1.ConflictError('Cannot block yourself');
        await prisma_1.prisma.block.upsert({
            where: { blockerUserId_blockedUserId: { blockerUserId: req.userId, blockedUserId: req.params.id } },
            create: { blockerUserId: req.userId, blockedUserId: req.params.id },
            update: {},
        });
        (0, response_1.sendSuccess)(res, { message: 'User blocked' });
    }
    catch (err) {
        next(err);
    }
}
// ─── DELETE /api/users/:id/block ─────────────────────────
async function unblockUser(req, res, next) {
    try {
        await prisma_1.prisma.block.deleteMany({
            where: { blockerUserId: req.userId, blockedUserId: req.params.id },
        });
        (0, response_1.sendSuccess)(res, { message: 'User unblocked' });
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/users/blocked ──────────────────────────────
async function getBlockedUsers(req, res, next) {
    try {
        const blocks = await prisma_1.prisma.block.findMany({
            where: { blockerUserId: req.userId },
            include: {
                blocked: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
            },
            orderBy: { blockDate: 'desc' },
        });
        (0, response_1.sendSuccess)(res, blocks.map((b) => ({ ...b.blocked, blockedAt: b.blockDate })));
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=safetyController.js.map