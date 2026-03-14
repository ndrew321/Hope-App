import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { NotificationService } from '../services/NotificationService';
import { BadgeService } from '../services/BadgeService';
import { MentorshipService } from '../services/MentorshipService';
import { sanitizeText } from '../utils/sanitize';

// Helper: Verify user is participant in a program's match
async function assertProgramParticipant(programId: string, userId: string): Promise<void> {
  const program = await prisma.mentorshipProgram.findUnique({
    where: { id: programId },
    include: { match: { select: { mentorId: true, menteeId: true } } },
  });
  if (!program) throw new NotFoundError('MentorshipProgram');
  if (program.match.mentorId !== userId && program.match.menteeId !== userId) {
    throw new AuthorizationError('Not a participant in this program');
  }
}

// ─── GET /api/programs/:id ───────────────────────────────
export async function getProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await assertProgramParticipant(req.params.id, req.userId);
    const program = await prisma.mentorshipProgram.findUnique({
      where: { id: req.params.id },
      include: {
        match: {
          include: {
            mentor: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
            mentee: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
          },
        },
        sessions: { orderBy: { sessionNumber: 'asc' } },
      },
    });
    sendSuccess(res, program);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/programs/:id/sessions ─────────────────────
export async function getProgramSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await assertProgramParticipant(req.params.id, req.userId);
    const sessions = await prisma.session.findMany({
      where: { mentorshipProgramId: req.params.id },
      include: { notes: true },
      orderBy: { sessionNumber: 'asc' },
    });
    sendSuccess(res, sessions);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/sessions ──────────────────────────────────
export async function scheduleSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mentorshipProgramId, sessionNumber, scheduledDate, scheduledTime, sessionType } = req.body as {
      mentorshipProgramId: string;
      sessionNumber: number;
      scheduledDate: string;
      scheduledTime?: string;
      sessionType: 'SYNC_CALL' | 'ASYNC_MESSAGE' | 'GROUP' | 'EVENT';
    };

    await assertProgramParticipant(mentorshipProgramId, req.userId);

    const session = await prisma.session.create({
      data: {
        mentorshipProgramId,
        sessionNumber,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: scheduledTime ?? null,
        sessionType,
        status: 'SCHEDULED',
      },
    });

    // Schedule a 24h reminder notification
    await NotificationService.scheduleSessionReminder(session.id, new Date(scheduledDate));

    sendSuccess(res, session, 201);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/sessions/:id ───────────────────────────────
export async function rescheduleSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { scheduledDate, scheduledTime } = req.body as { scheduledDate: string; scheduledTime?: string };

    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { mentorshipProgram: { include: { match: true } } },
    });
    if (!session) throw new NotFoundError('Session');
    const { mentorId, menteeId } = session.mentorshipProgram.match;
    if (mentorId !== req.userId && menteeId !== req.userId) {
      throw new AuthorizationError('Not a participant in this session');
    }

    const updated = await prisma.session.update({
      where: { id: req.params.id },
      data: {
        scheduledDate: new Date(scheduledDate),
        scheduledTime: scheduledTime ?? null,
        status: 'RESCHEDULED',
      },
    });

    await NotificationService.scheduleSessionReminder(updated.id, new Date(scheduledDate));
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/sessions/:id ────────────────────────────
export async function cancelSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { mentorshipProgram: { include: { match: true } } },
    });
    if (!session) throw new NotFoundError('Session');
    const { mentorId, menteeId } = session.mentorshipProgram.match;
    if (mentorId !== req.userId && menteeId !== req.userId) {
      throw new AuthorizationError('Not a participant in this session');
    }

    await prisma.session.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    sendSuccess(res, { message: 'Session cancelled' });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/sessions/:id/notes ───────────────────────
export async function submitNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { mentorshipProgram: { include: { match: true } } },
    });
    if (!session) throw new NotFoundError('Session');
    const { mentorId, menteeId } = session.mentorshipProgram.match;
    if (mentorId !== req.userId && menteeId !== req.userId) {
      throw new AuthorizationError('Not a participant in this session');
    }

    const {
      mentorNotes, menteeReflection, topicsDiscussed,
      actionItemsForMentee, actionItemsForMentor, keyTakeaways,
      resourcesShared, nextSessionAgenda, menteeSelfRating,
    } = req.body as {
      mentorNotes?: string;
      menteeReflection?: string;
      topicsDiscussed: string[];
      actionItemsForMentee: string[];
      actionItemsForMentor: string[];
      keyTakeaways: string[];
      resourcesShared: string[];
      nextSessionAgenda?: string;
      menteeSelfRating?: number;
    };

    const notes = await prisma.sessionNotes.upsert({
      where: { sessionId: req.params.id },
      create: {
        sessionId: req.params.id,
        mentorNotes: mentorNotes ? sanitizeText(mentorNotes) : null,
        menteeReflection: menteeReflection ? sanitizeText(menteeReflection) : null,
        topicsDiscussed,
        actionItemsForMentee,
        actionItemsForMentor,
        keyTakeaways,
        resourcesShared,
        nextSessionAgenda: nextSessionAgenda ?? null,
        menteeSelfRating: menteeSelfRating ?? null,
      },
      update: {
        mentorNotes: mentorNotes ? sanitizeText(mentorNotes) : undefined,
        menteeReflection: menteeReflection ? sanitizeText(menteeReflection) : undefined,
        topicsDiscussed,
        actionItemsForMentee,
        actionItemsForMentor,
        keyTakeaways,
        resourcesShared,
        nextSessionAgenda: nextSessionAgenda ?? null,
        menteeSelfRating: menteeSelfRating ?? null,
      },
    });

    // Mark session as completed
    await prisma.session.update({ where: { id: req.params.id }, data: { status: 'COMPLETED', actualDate: new Date() } });

    // Recalculate program completion
    await MentorshipService.updateCompletionPercentage(session.mentorshipProgramId);

    // Trigger badge checks
    await BadgeService.checkAfterSessionCompleted(req.userId);

    // Notify the other participant
    const otherId = mentorId === req.userId ? menteeId : mentorId;
    const actor = await prisma.user.findUnique({ where: { id: req.userId }, select: { firstName: true } });
    await NotificationService.sendSessionNotesNotification(otherId, actor?.firstName ?? 'Your partner');

    sendSuccess(res, notes, 201);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/sessions/:id/notes ─────────────────────────
export async function getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { mentorshipProgram: { include: { match: true } }, notes: true },
    });
    if (!session) throw new NotFoundError('Session');
    const { mentorId, menteeId } = session.mentorshipProgram.match;
    if (mentorId !== req.userId && menteeId !== req.userId) {
      throw new AuthorizationError('Not a participant in this session');
    }
    sendSuccess(res, session.notes);
  } catch (err) {
    next(err);
  }
}
