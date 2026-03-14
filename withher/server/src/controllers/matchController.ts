import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { prisma } from '../utils/prisma';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../utils/response';
import { NotFoundError, AuthorizationError, ConflictError } from '../utils/errors';
import { NotificationService } from '../services/NotificationService';
import { MentorshipService } from '../services/MentorshipService';
import { SafetyService } from '../services/SafetyService';
import { logger } from '../utils/logger';

// ─── GET /api/matches/discover ───────────────────────────
export async function discover(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 15);

    // Call Python matching microservice
    const matchingUrl = process.env.MATCHING_SERVICE_URL ?? 'http://localhost:8000';
    let rankedUserIds: string[] = [];

    try {
      const { data } = await axios.post<{ matches: Array<{ userId: string; score: number }> }>(
        `${matchingUrl}/match`,
        { userId: req.userId },
        { timeout: 5000 },
      );
      rankedUserIds = data.matches.map((m) => m.userId);
    } catch (matchErr) {
      logger.warn({ matchErr }, 'Matching service unavailable, falling back to random pool');
    }

    // If matching service is unavailable, fall back to simple query
    let candidateIds = rankedUserIds.slice(skip, skip + limit);

    if (candidateIds.length === 0) {
      const blocked = await prisma.block.findMany({
        where: { OR: [{ blockerUserId: req.userId }, { blockedUserId: req.userId }] },
        select: { blockerUserId: true, blockedUserId: true },
      });
      const blockedIds = blocked.flatMap((b) => [b.blockerUserId, b.blockedUserId]).filter((id) => id !== req.userId);

      const alreadySwiped = await prisma.swipe.findMany({
        where: { swiperId: req.userId },
        select: { targetId: true },
      });
      const swipedIds = alreadySwiped.map((s) => s.targetId);

      const candidates = await prisma.user.findMany({
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

    const users = await prisma.user.findMany({
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
    sendSuccess(res, users, 200, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/matches/swipe ─────────────────────────────
export async function swipe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { targetUserId, direction } = req.body as { targetUserId: string; direction: 'left' | 'right' };

    const target = await prisma.user.findUnique({
      where: { id: targetUserId, deletedAt: null },
      select: { id: true },
    });
    if (!target) throw new NotFoundError('User');

    // Record the swipe (upsert prevents duplicates)
    await prisma.swipe.upsert({
      where: { swiperId_targetId: { swiperId: req.userId, targetId: targetUserId } },
      create: { swiperId: req.userId, targetId: targetUserId, direction },
      update: { direction },
    });

    if (direction !== 'right') {
      sendSuccess(res, { matched: false });
      return;
    }

    // Check for mutual right swipe
    const reciprocalSwipe = await prisma.swipe.findUnique({
      where: { swiperId_targetId: { swiperId: targetUserId, targetId: req.userId } },
    });

    if (!reciprocalSwipe || reciprocalSwipe.direction !== 'right') {
      sendSuccess(res, { matched: false });
      return;
    }

    // Determine mentor/mentee roles from profiles
    const [myProfile, theirProfile] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId: req.userId }, select: { mentorshipRole: true, currentLevel: true } }),
      prisma.userProfile.findUnique({ where: { userId: targetUserId }, select: { mentorshipRole: true, currentLevel: true } }),
    ]);

    const levelOrder = ['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM'];
    const myLevelIdx = levelOrder.indexOf(myProfile?.currentLevel ?? 'YOUTH');
    const theirLevelIdx = levelOrder.indexOf(theirProfile?.currentLevel ?? 'YOUTH');

    const mentorId = myLevelIdx >= theirLevelIdx ? req.userId : targetUserId;
    const menteeId = mentorId === req.userId ? targetUserId : req.userId;

    // Create match record (idempotent)
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { mentorId, menteeId },
          { mentorId: menteeId, menteeId: mentorId },
        ],
      },
    });

    let match;
    if (!existingMatch) {
      match = await prisma.match.create({
        data: { mentorId, menteeId, status: 'PENDING', matchScore: 0.8 },
      });
    } else {
      match = existingMatch;
    }

    // Update swipe records to point to match
    await prisma.swipe.updateMany({
      where: {
        OR: [
          { swiperId: req.userId, targetId: targetUserId },
          { swiperId: targetUserId, targetId: req.userId },
        ],
      },
      data: { matchId: match.id },
    });

    // Send match notification to both users
    await NotificationService.sendNewMatchNotification(mentorId, menteeId);

    sendSuccess(res, { matched: true, matchId: match.id });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/matches/liked-me ───────────────────────────
export async function likedMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);

    const alreadySwiped = await prisma.swipe.findMany({
      where: { swiperId: req.userId },
      select: { targetId: true },
    });
    const alreadySwipedIds = alreadySwiped.map((s) => s.targetId);

    // Users who swiped right on me, but I haven't swiped on yet
    const swipes = await prisma.swipe.findMany({
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
    const users = await prisma.user.findMany({
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
      .filter((u): u is NonNullable<typeof u> => Boolean(u));

    const total = await prisma.swipe.count({
      where: {
        targetId: req.userId,
        direction: 'right',
        swiperId: { notIn: [req.userId, ...alreadySwipedIds] },
      },
    });
    sendSuccess(res, orderedUsers, 200, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/matches/active ─────────────────────────────
export async function getActiveMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const matches = await prisma.match.findMany({
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

    sendSuccess(res, matches);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/matches/:id/confirm ───────────────────────
export async function confirmMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const match = await prisma.match.findUnique({ where: { id: req.params.id } });
    if (!match) throw new NotFoundError('Match');
    if (match.mentorId !== req.userId && match.menteeId !== req.userId) {
      throw new AuthorizationError('Not a participant in this match');
    }

    // Check mentor has completed background check
    const bgCheck = await SafetyService.getMentorVerificationStatus(match.mentorId);
    if (!bgCheck) {
      throw new ConflictError('Background check must be completed before match activation');
    }

    const updated = await prisma.match.update({
      where: { id: match.id },
      data: { status: 'ACTIVE' },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/matches/:id/start-program ─────────────────
export async function startProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { menteeInitialGoal } = req.body as { menteeInitialGoal: string };
    const match = await prisma.match.findUnique({ where: { id: req.params.id } });
    if (!match) throw new NotFoundError('Match');
    if (match.mentorId !== req.userId && match.menteeId !== req.userId) {
      throw new AuthorizationError('Not a participant in this match');
    }

    const program = await MentorshipService.startProgram(match.id, menteeInitialGoal);
    sendSuccess(res, program, 201);
  } catch (err) {
    next(err);
  }
}
