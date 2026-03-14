import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ConflictError } from '../utils/errors';
import { SafetyService } from '../services/SafetyService';
import { BackgroundCheckService } from '../services/BackgroundCheckService';

// ─── POST /api/verification/identity ─────────────────────
export async function initiateIdentityVerification(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const verification = await prisma.verification.upsert({
      where: { userId_verificationType: { userId: req.userId, verificationType: 'IDENTITY' } },
      create: { userId: req.userId, verificationType: 'IDENTITY', status: 'PENDING' },
      update: { status: 'PENDING' },
    });
    sendSuccess(res, { verificationId: verification.id, status: verification.status }, 201);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/verification/background-check ─────────────
export async function initiateBackgroundCheck(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const result = await BackgroundCheckService.initiateCheck(req.userId);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/verification/status ────────────────────────
export async function getVerificationStatus(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const verifications = await prisma.verification.findMany({
      where: { userId: req.userId },
      select: { verificationType: true, status: true, verifiedDate: true, expirationDate: true },
    });
    sendSuccess(res, verifications);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/users/:id/report ──────────────────────────
export async function reportUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id === req.userId) throw new ConflictError('Cannot report yourself');

    const reported = await prisma.user.findUnique({ where: { id: req.params.id, deletedAt: null } });
    if (!reported) throw new NotFoundError('User');

    const { reportType, description, evidenceUrls, severityLevel } = req.body as {
      reportType: string; description: string; evidenceUrls: string[];
      severityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };

    await SafetyService.handleReport({
      reportedByUserId: req.userId,
      reportedUserId: req.params.id,
      reportType,
      description,
      evidenceUrls,
      severityLevel,
    });

    sendSuccess(res, { message: 'Report submitted. Our safety team will review it shortly.' }, 201);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/users/:id/block ───────────────────────────
export async function blockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id === req.userId) throw new ConflictError('Cannot block yourself');

    await prisma.block.upsert({
      where: { blockerUserId_blockedUserId: { blockerUserId: req.userId, blockedUserId: req.params.id } },
      create: { blockerUserId: req.userId, blockedUserId: req.params.id },
      update: {},
    });

    sendSuccess(res, { message: 'User blocked' });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/users/:id/block ─────────────────────────
export async function unblockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.block.deleteMany({
      where: { blockerUserId: req.userId, blockedUserId: req.params.id },
    });
    sendSuccess(res, { message: 'User unblocked' });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/users/blocked ──────────────────────────────
export async function getBlockedUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const blocks = await prisma.block.findMany({
      where: { blockerUserId: req.userId },
      include: {
        blocked: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
      },
      orderBy: { blockDate: 'desc' },
    });
    sendSuccess(res, blocks.map((b) => ({ ...b.blocked, blockedAt: b.blockDate })));
  } catch (err) {
    next(err);
  }
}
