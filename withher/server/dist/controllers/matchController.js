"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discover = discover;
exports.swipe = swipe;
exports.likedMe = likedMe;
exports.getActiveMatches = getActiveMatches;
exports.confirmMatch = confirmMatch;
exports.startProgram = startProgram;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const NotificationService_1 = require("../services/NotificationService");
const MentorshipService_1 = require("../services/MentorshipService");
const SafetyService_1 = require("../services/SafetyService");
const logger_1 = require("../utils/logger");
// ─── GET /api/matches/discover ───────────────────────────
async function discover(req, res, next) {
    try {
        const { page, limit, skip } = (0, response_1.parsePagination)(req.query.page, req.query.limit, 15);
        // Call Python matching microservice
        const matchingUrl = process.env.MATCHING_SERVICE_URL ?? 'http://localhost:8000';
        let rankedUserIds = [];
        try {
            const { data } = await axios_1.default.post(`${matchingUrl}/match`, { userId: req.userId }, { timeout: 5000 });
            rankedUserIds = data.matches.map((m) => m.userId);
        }
        catch (matchErr) {
            logger_1.logger.warn({ matchErr }, 'Matching service unavailable, falling back to random pool');
        }
        // If matching service is unavailable, fall back to simple query
        let candidateIds = rankedUserIds.slice(skip, skip + limit);
        if (candidateIds.length === 0) {
            const blocked = await prisma_1.prisma.block.findMany({
                where: { OR: [{ blockerUserId: req.userId }, { blockedUserId: req.userId }] },
                select: { blockerUserId: true, blockedUserId: true },
            });
            const blockedIds = blocked.flatMap((b) => [b.blockerUserId, b.blockedUserId]).filter((id) => id !== req.userId);
            const alreadySwiped = await prisma_1.prisma.swipe.findMany({
                where: { swiperId: req.userId },
                select: { targetId: true },
            });
            const swipedIds = alreadySwiped.map((s) => s.targetId);
            const candidates = await prisma_1.prisma.user.findMany({
                where: {
                    id: { notIn: [req.userId, ...blockedIds, ...swipedIds] },
                    deletedAt: null,
                    isVerified: true,
                    profile: { mentorshipRole: { not: undefined } },
                },
                select: { id: true },
                take: limit,
                skip,
            });
            candidateIds = candidates.map((c) => c.id);
        }
        const users = await prisma_1.prisma.user.findMany({
            where: { id: { in: candidateIds }, deletedAt: null },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                location: true,
                profilePhotoUrl: true,
                bio: true,
                isVerified: true,
                profile: {
                    select: {
                        currentLevel: true,
                        positions: true,
                        yearsExperience: true,
                        mentorshipRole: true,
                        mentorshipGoals: true,
                        careerGoals: true,
                    },
                },
            },
        });
        const total = rankedUserIds.length || users.length;
        (0, response_1.sendSuccess)(res, users, 200, (0, response_1.buildPaginationMeta)(page, limit, total));
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/matches/swipe ─────────────────────────────
async function swipe(req, res, next) {
    try {
        const { targetUserId, direction } = req.body;
        const target = await prisma_1.prisma.user.findUnique({
            where: { id: targetUserId, deletedAt: null },
            select: { id: true },
        });
        if (!target)
            throw new errors_1.NotFoundError('User');
        // Record the swipe (upsert prevents duplicates)
        await prisma_1.prisma.swipe.upsert({
            where: { swiperId_targetId: { swiperId: req.userId, targetId: targetUserId } },
            create: { swiperId: req.userId, targetId: targetUserId, direction },
            update: { direction },
        });
        if (direction !== 'right') {
            (0, response_1.sendSuccess)(res, { matched: false });
            return;
        }
        // Check for mutual right swipe
        const reciprocalSwipe = await prisma_1.prisma.swipe.findUnique({
            where: { swiperId_targetId: { swiperId: targetUserId, targetId: req.userId } },
        });
        if (!reciprocalSwipe || reciprocalSwipe.direction !== 'right') {
            (0, response_1.sendSuccess)(res, { matched: false });
            return;
        }
        // Determine mentor/mentee roles from profiles
        const [myProfile, theirProfile] = await Promise.all([
            prisma_1.prisma.userProfile.findUnique({ where: { userId: req.userId }, select: { mentorshipRole: true, currentLevel: true } }),
            prisma_1.prisma.userProfile.findUnique({ where: { userId: targetUserId }, select: { mentorshipRole: true, currentLevel: true } }),
        ]);
        const levelOrder = ['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM'];
        const myLevelIdx = levelOrder.indexOf(myProfile?.currentLevel ?? 'YOUTH');
        const theirLevelIdx = levelOrder.indexOf(theirProfile?.currentLevel ?? 'YOUTH');
        const mentorId = myLevelIdx >= theirLevelIdx ? req.userId : targetUserId;
        const menteeId = mentorId === req.userId ? targetUserId : req.userId;
        // Create match record (idempotent)
        const existingMatch = await prisma_1.prisma.match.findFirst({
            where: {
                OR: [
                    { mentorId, menteeId },
                    { mentorId: menteeId, menteeId: mentorId },
                ],
            },
        });
        let match;
        if (!existingMatch) {
            match = await prisma_1.prisma.match.create({
                data: { mentorId, menteeId, status: 'PENDING', matchScore: 0.8 },
            });
        }
        else {
            match = existingMatch;
        }
        // Update swipe records to point to match
        await prisma_1.prisma.swipe.updateMany({
            where: {
                OR: [
                    { swiperId: req.userId, targetId: targetUserId },
                    { swiperId: targetUserId, targetId: req.userId },
                ],
            },
            data: { matchId: match.id },
        });
        // Send match notification to both users
        await NotificationService_1.NotificationService.sendNewMatchNotification(mentorId, menteeId);
        (0, response_1.sendSuccess)(res, { matched: true, matchId: match.id });
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/matches/liked-me ───────────────────────────
async function likedMe(req, res, next) {
    try {
        const { page, limit, skip } = (0, response_1.parsePagination)(req.query.page, req.query.limit);
        const alreadySwiped = await prisma_1.prisma.swipe.findMany({
            where: { swiperId: req.userId },
            select: { targetId: true },
        });
        const alreadySwipedIds = alreadySwiped.map((s) => s.targetId);
        // Users who swiped right on me, but I haven't swiped on yet
        const swipes = await prisma_1.prisma.swipe.findMany({
            where: {
                targetId: req.userId,
                direction: 'right',
                swiperId: { notIn: [req.userId, ...alreadySwipedIds] },
            },
            select: {
                swiperId: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
        });
        const candidateIds = swipes.map((s) => s.swiperId);
        const users = await prisma_1.prisma.user.findMany({
            where: { id: { in: candidateIds }, deletedAt: null },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
                profile: { select: { currentLevel: true, positions: true, mentorshipRole: true } },
            },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        const orderedUsers = candidateIds
            .map((id) => userMap.get(id))
            .filter((u) => Boolean(u));
        const total = await prisma_1.prisma.swipe.count({
            where: {
                targetId: req.userId,
                direction: 'right',
                swiperId: { notIn: [req.userId, ...alreadySwipedIds] },
            },
        });
        (0, response_1.sendSuccess)(res, orderedUsers, 200, (0, response_1.buildPaginationMeta)(page, limit, total));
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/matches/active ─────────────────────────────
async function getActiveMatches(req, res, next) {
    try {
        const matches = await prisma_1.prisma.match.findMany({
            where: {
                status: { in: ['ACTIVE', 'PENDING'] },
                OR: [{ mentorId: req.userId }, { menteeId: req.userId }],
            },
            include: {
                mentor: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true, profile: { select: { currentLevel: true } } } },
                mentee: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true, profile: { select: { currentLevel: true } } } },
                mentorshipPrograms: {
                    where: { status: 'ACTIVE' },
                    select: { id: true, programNumber: true, completionPercentage: true, startDate: true, endDate: true },
                    take: 1,
                    orderBy: { programNumber: 'desc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        (0, response_1.sendSuccess)(res, matches);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/matches/:id/confirm ───────────────────────
async function confirmMatch(req, res, next) {
    try {
        const match = await prisma_1.prisma.match.findUnique({ where: { id: req.params.id } });
        if (!match)
            throw new errors_1.NotFoundError('Match');
        if (match.mentorId !== req.userId && match.menteeId !== req.userId) {
            throw new errors_1.AuthorizationError('Not a participant in this match');
        }
        // Check mentor has completed background check
        const bgCheck = await SafetyService_1.SafetyService.getMentorVerificationStatus(match.mentorId);
        if (!bgCheck) {
            throw new errors_1.ConflictError('Background check must be completed before match activation');
        }
        const updated = await prisma_1.prisma.match.update({
            where: { id: match.id },
            data: { status: 'ACTIVE' },
        });
        (0, response_1.sendSuccess)(res, updated);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/matches/:id/start-program ─────────────────
async function startProgram(req, res, next) {
    try {
        const { menteeInitialGoal } = req.body;
        const match = await prisma_1.prisma.match.findUnique({ where: { id: req.params.id } });
        if (!match)
            throw new errors_1.NotFoundError('Match');
        if (match.mentorId !== req.userId && match.menteeId !== req.userId) {
            throw new errors_1.AuthorizationError('Not a participant in this match');
        }
        const program = await MentorshipService_1.MentorshipService.startProgram(match.id, menteeInitialGoal);
        (0, response_1.sendSuccess)(res, program, 201);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=matchController.js.map