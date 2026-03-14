import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess } from '../utils/response';

// ─── GET /api/badges ─────────────────────────────────────
export async function listBadges(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const badges = await prisma.badge.findMany({ orderBy: { name: 'asc' } });
    sendSuccess(res, badges);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/users/:id/badges ───────────────────────────
export async function getUserBadges(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.params.id },
      include: { badge: true },
      orderBy: { earnedDate: 'desc' },
    });
    sendSuccess(res, userBadges);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/leaderboards ───────────────────────────────
export async function getLeaderboards(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Badge count leaderboard
    const leaderboard = await prisma.userBadge.groupBy({
      by: ['userId'],
      _count: { badgeId: true },
      orderBy: { _count: { badgeId: 'desc' } },
      take: 50,
    });

    const userIds = leaderboard.map((l) => l.userId);
    const users = await prisma.user.findMany({
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

    sendSuccess(res, ranked);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/users/:id/streaks ──────────────────────────
export async function getUserStreaks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Derive login streak from LoginSession records
    const sessions = await prisma.loginSession.findMany({
      where: { userId: req.params.id },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueDays = new Set(
      sessions.map((s) => {
        const d = new Date(s.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }),
    );

    const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
    for (let i = 0; i < sortedDays.length; i++) {
      const expected = today.getTime() - i * 86400000;
      if (sortedDays[i] === expected) {
        currentStreak++;
      } else {
        break;
      }
    }

    sendSuccess(res, { currentStreak, totalActiveDays: uniqueDays.size });
  } catch (err) {
    next(err);
  }
}
