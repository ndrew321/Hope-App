"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeService = void 0;
const prisma_1 = require("../utils/prisma");
const NotificationService_1 = require("./NotificationService");
const logger_1 = require("../utils/logger");
// ─── Badge type constants ─────────────────────────────────
const BADGE_TYPES = {
    MENTOR_STARTER: 'MENTOR_STARTER',
    CONSISTENT_MENTOR: 'CONSISTENT_MENTOR',
    COMMUNITY_VOICE: 'COMMUNITY_VOICE',
    PROFILE_MASTER: 'PROFILE_MASTER',
    EVENT_REGULAR: 'EVENT_REGULAR',
    GOAL_CRUSHER: 'GOAL_CRUSHER',
    FIRST_SESSION: 'FIRST_SESSION',
    STREAK_7: 'LOGIN_STREAK_7',
    STREAK_30: 'LOGIN_STREAK_30',
};
exports.BadgeService = {
    /**
     * Check badge eligibility after a session is completed.
     * Triggers: MENTOR_STARTER, FIRST_SESSION, CONSISTENT_MENTOR
     */
    async checkAfterSessionCompleted(userId) {
        const completedSessionCount = await prisma_1.prisma.session.count({
            where: {
                status: 'COMPLETED',
                mentorshipProgram: {
                    match: { OR: [{ mentorId: userId }, { menteeId: userId }] },
                },
            },
        });
        if (completedSessionCount >= 1) {
            await _awardBadge(userId, BADGE_TYPES.FIRST_SESSION);
        }
        if (completedSessionCount >= 4) {
            await _awardBadge(userId, BADGE_TYPES.MENTOR_STARTER);
        }
        if (completedSessionCount >= 12) {
            await _awardBadge(userId, BADGE_TYPES.CONSISTENT_MENTOR);
        }
    },
    /**
     * Check badge eligibility after a forum post is created.
     * Triggers: COMMUNITY_VOICE
     */
    async checkAfterPostCreated(userId) {
        const postCount = await prisma_1.prisma.forumPost.count({
            where: { authorId: userId, status: 'PUBLISHED', deletedAt: null },
        });
        if (postCount >= 3) {
            await _awardBadge(userId, BADGE_TYPES.COMMUNITY_VOICE);
        }
    },
    /**
     * Check badge eligibility after profile is updated.
     * Triggers: PROFILE_MASTER
     */
    async checkAfterProfileUpdated(userId) {
        const profile = await prisma_1.prisma.userProfile.findUnique({
            where: { userId },
            select: { profileCompletenessScore: true },
        });
        if ((profile?.profileCompletenessScore ?? 0) >= 100) {
            await _awardBadge(userId, BADGE_TYPES.PROFILE_MASTER);
        }
    },
    /**
     * Check badge eligibility after attending an event.
     * Triggers: EVENT_REGULAR
     */
    async checkAfterEventAttended(userId) {
        const attendedCount = await prisma_1.prisma.eventRegistration.count({
            where: { userId, status: 'ATTENDED' },
        });
        if (attendedCount >= 3) {
            await _awardBadge(userId, BADGE_TYPES.EVENT_REGULAR);
        }
    },
    /**
     * Check login streak badges.
     */
    async checkAfterLogin(userId) {
        // Use the controller logic to compute streak (inline here)
        const sessions = await prisma_1.prisma.loginSession.findMany({
            where: { userId },
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const uniqueDays = new Set(sessions.map((s) => {
            const d = new Date(s.createdAt);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        }));
        const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
        let streak = 0;
        for (let i = 0; i < sortedDays.length; i++) {
            if (sortedDays[i] === today.getTime() - i * 86400000)
                streak++;
            else
                break;
        }
        if (streak >= 7)
            await _awardBadge(userId, BADGE_TYPES.STREAK_7);
        if (streak >= 30)
            await _awardBadge(userId, BADGE_TYPES.STREAK_30);
    },
};
// ─── Internal helpers ─────────────────────────────────────
/**
 * Award a badge to a user idempotently.
 * If already awarded, does nothing. Otherwise creates UserBadge record and sends notification.
 */
async function _awardBadge(userId, badgeType) {
    const badge = await prisma_1.prisma.badge.findUnique({ where: { badgeType } });
    if (!badge) {
        logger_1.logger.warn({ badgeType }, 'Badge type not found in database');
        return;
    }
    // Idempotent check
    const existing = await prisma_1.prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
    });
    if (existing)
        return;
    await prisma_1.prisma.userBadge.create({
        data: { userId, badgeId: badge.id, earnedDate: new Date() },
    });
    await NotificationService_1.NotificationService.sendBadgeEarnedNotification(userId, badge.name);
    logger_1.logger.info({ userId, badgeType }, 'Badge awarded');
}
//# sourceMappingURL=BadgeService.js.map