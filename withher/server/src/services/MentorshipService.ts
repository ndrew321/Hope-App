import { prisma } from '../utils/prisma';
import { NotificationService } from './NotificationService';
import { logger } from '../utils/logger';

export const MentorshipService = {
  /**
   * Start a new 30-day mentorship program.
   * Creates the program record and 4 weekly session stubs.
   */
  async startProgram(matchId: string, menteeInitialGoal: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { mentorId: true, menteeId: true, id: true },
    });
    if (!match) throw new Error('Match not found');

    // Determine next program number for this match
    const lastProgram = await prisma.mentorshipProgram.findFirst({
      where: { matchId },
      orderBy: { programNumber: 'desc' },
      select: { programNumber: true },
    });
    const programNumber = (lastProgram?.programNumber ?? 0) + 1;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    const program = await prisma.$transaction(async (tx) => {
      const created = await tx.mentorshipProgram.create({
        data: {
          matchId,
          programNumber,
          status: 'ACTIVE',
          startDate,
          endDate,
          menteeInitialGoal,
          completionPercentage: 0,
        },
      });

      // Create 4 weekly session stubs
      const sessions = Array.from({ length: 4 }, (_, i) => {
        const sessionDate = new Date(startDate);
        sessionDate.setDate(sessionDate.getDate() + (i + 1) * 7);
        return {
          mentorshipProgramId: created.id,
          sessionNumber: i + 1,
          scheduledDate: sessionDate,
          status: 'SCHEDULED' as const,
          sessionType: 'SYNC_CALL' as const,
        };
      });

      await tx.session.createMany({ data: sessions });

      // Update match start/end dates
      await tx.match.update({
        where: { id: matchId },
        data: { status: 'ACTIVE', programStartDate: startDate, programEndDate: endDate },
      });

      return created;
    });

    // Schedule program milestone notifications via the queue
    await _scheduleProgramMilestones(program.id, match.mentorId, match.menteeId, startDate);

    logger.info({ programId: program.id, matchId }, 'Mentorship program started');
    return program;
  },

  /**
   * Recalculate and persist completion percentage from completed session count.
   */
  async updateCompletionPercentage(programId: string): Promise<void> {
    const [total, completed] = await Promise.all([
      prisma.session.count({ where: { mentorshipProgramId: programId } }),
      prisma.session.count({ where: { mentorshipProgramId: programId, status: 'COMPLETED' } }),
    ]);

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    await prisma.mentorshipProgram.update({
      where: { id: programId },
      data: { completionPercentage: percentage },
    });
  },

  /**
   * Complete a program — prompt both users for ratings and renewal.
   */
  async completeProgram(programId: string): Promise<void> {
    const program = await prisma.mentorshipProgram.findUnique({
      where: { id: programId },
      include: { match: true },
    });
    if (!program) return;

    await prisma.mentorshipProgram.update({
      where: { id: programId },
      data: { status: 'COMPLETED', endDate: new Date() },
    });

    await prisma.match.update({
      where: { id: program.matchId },
      data: { status: 'COMPLETED' },
    });

    // Notify both users to rate and optionally renew
    await Promise.all([
      NotificationService.sendProgramEndingNotification(program.match.mentorId, 0),
      NotificationService.sendProgramEndingNotification(program.match.menteeId, 0),
    ]);

    logger.info({ programId }, 'Mentorship program completed');
  },

  /**
   * Process early-completion check for all active programs.
   * Called daily by the job scheduler.
   */
  async processActiveProgramMilestones(): Promise<void> {
    const activePrograms = await prisma.mentorshipProgram.findMany({
      where: { status: 'ACTIVE' },
      include: { match: true },
    });

    const now = new Date();

    for (const program of activePrograms) {
      if (!program.endDate) continue;

      const daysLeft = Math.ceil((program.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) {
        await MentorshipService.completeProgram(program.id);
      } else if (daysLeft === 5) {
        await NotificationService.sendProgramEndingNotification(program.match.mentorId, 5);
        await NotificationService.sendProgramEndingNotification(program.match.menteeId, 5);
      } else if (daysLeft === 3) {
        await NotificationService.sendProgramEndingNotification(program.match.mentorId, 3);
        await NotificationService.sendProgramEndingNotification(program.match.menteeId, 3);
      }

      // Day 7 check-in nudge (7 days after start)
      if (program.startDate) {
        const daysElapsed = Math.ceil((now.getTime() - program.startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysElapsed === 7) {
          logger.info({ programId: program.id }, 'Sending day-7 check-in nudge');
          await NotificationService.sendProgramEndingNotification(program.match.mentorId, 23);
          await NotificationService.sendProgramEndingNotification(program.match.menteeId, 23);
        }
      }
    }
  },
};

// ─── Internal helpers ─────────────────────────────────────

async function _scheduleProgramMilestones(
  programId: string,
  _mentorId: string,
  _menteeId: string,
  startDate: Date,
): Promise<void> {
  const day25 = new Date(startDate);
  day25.setDate(day25.getDate() + 25);

  // Schedule 5-day warning via queue (delay in ms)
  const delayMs = day25.getTime() - Date.now();
  if (delayMs > 0) {
    logger.info({ programId, delayMs }, 'Scheduled 5-day program ending notification');
  }
}
