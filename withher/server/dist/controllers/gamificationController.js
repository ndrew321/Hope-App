"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBadges = listBadges;
exports.getUserBadges = getUserBadges;
exports.getLeaderboards = getLeaderboards;
exports.getUserStreaks = getUserStreaks;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
// ─── GET /api/badges ─────────────────────────────────────
async function listBadges(_req, res, next) {
    try {
        const badges = await prisma_1.prisma.badge.findMany({ orderBy: { name: 'asc' } });
        (0, response_1.sendSuccess)(res, badges);
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/users/:id/badges ───────────────────────────
async function getUserBadges(req, res, next) {
    try {
        const userBadges = await prisma_1.prisma.userBadge.findMany({
            where: { userId: req.params.id },
            include: { badge: true },
            orderBy: { earnedDate: 'desc' },
        });
        (0, response_1.sendSuccess)(res, userBadges);
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/leaderboards ───────────────────────────────
async function getLeaderboards(_req, res, next) {
    try {
        // Badge count leaderboard
        const leaderboard = await prisma_1.prisma.userBadge.groupBy({
            by: ['userId'],
            _count: { badgeId: true },
            orderBy: { _count: { badgeId: 'desc' } },
            take: 50,
        });
        const userIds = leaderboard.map((l) => l.userId);
        const users = await prisma_1.prisma.user.findMany({
            where: { id: { in: userIds }, deletedAt: null },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
                profile: { select: { currentLevel: true } },
            },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        const ranked = leaderboard
            .map((l, idx) => ({
            rank: idx + 1,
            user: userMap.get(l.userId),
            badgeCount: l._count.badgeId,
        }))
            .filter((r) => r.user !== undefined);
        (0, response_1.sendSuccess)(res, ranked);
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/users/:id/streaks ──────────────────────────
async function getUserStreaks(req, res, next) {
    try {
        // Derive login streak from LoginSession records
        const sessions = await prisma_1.prisma.loginSession.findMany({
            where: { userId: req.params.id },
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const uniqueDays = new Set(sessions.map((s) => {
            const d = new Date(s.createdAt);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        }));
        const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
        for (let i = 0; i < sortedDays.length; i++) {
            const expected = today.getTime() - i * 86400000;
            if (sortedDays[i] === expected) {
                currentStreak++;
            }
            else {
                break;
            }
        }
        (0, response_1.sendSuccess)(res, { currentStreak, totalActiveDays: uniqueDays.size });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=gamificationController.js.map