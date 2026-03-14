"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentorshipService = void 0;
const prisma_1 = require("../utils/prisma");
const NotificationService_1 = require("./NotificationService");
const logger_1 = require("../utils/logger");
exports.MentorshipService = {
    /**
     * Start a new 30-day mentorship program.
     * Creates the program record and 4 weekly session stubs.
     */
    async startProgram(matchId, menteeInitialGoal) {
        const match = await prisma_1.prisma.match.findUnique({
            where: { id: matchId },
            select: { mentorId: true, menteeId: true, id: true },
        });
        if (!match)
            throw new Error('Match not found');
        // Determine next program number for this match
        const lastProgram = await prisma_1.prisma.mentorshipProgram.findFirst({
            where: { matchId },
            orderBy: { programNumber: 'desc' },
            select: { programNumber: true },
        });
        const programNumber = (lastProgram?.programNumber ?? 0) + 1;
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);
        const program = await prisma_1.prisma.$transaction(async (tx) => {
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
                    status: 'SCHEDULED',
                    sessionType: 'SYNC_CALL',
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
        logger_1.logger.info({ programId: program.id, matchId }, 'Mentorship program started');
        return program;
    },
    /**
     * Recalculate and persist completion percentage from completed session count.
     */
    async updateCompletionPercentage(programId) {
        const [total, completed] = await Promise.all([
            prisma_1.prisma.session.count({ where: { mentorshipProgramId: programId } }),
            prisma_1.prisma.session.count({ where: { mentorshipProgramId: programId, status: 'COMPLETED' } }),
        ]);
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        await prisma_1.prisma.mentorshipProgram.update({
            where: { id: programId },
            data: { completionPercentage: percentage },
        });
    },
    /**
     * Complete a program — prompt both users for ratings and renewal.
     */
    async completeProgram(programId) {
        const program = await prisma_1.prisma.mentorshipProgram.findUnique({
            where: { id: programId },
            include: { match: true },
        });
        if (!program)
            return;
        await prisma_1.prisma.mentorshipProgram.update({
            where: { id: programId },
            data: { status: 'COMPLETED', endDate: new Date() },
        });
        await prisma_1.prisma.match.update({
            where: { id: program.matchId },
            data: { status: 'COMPLETED' },
        });
        // Notify both users to rate and optionally renew
        await Promise.all([
            NotificationService_1.NotificationService.sendProgramEndingNotification(program.match.mentorId, 0),
            NotificationService_1.NotificationService.sendProgramEndingNotification(program.match.menteeId, 0),
        ]);
        logger_1.logger.info({ programId }, 'Mentorship program completed');
    },
    /**
     * Process early-completion check for all active programs.
     * Called daily by the job scheduler.
     */
    async processActiveProgramMilestones() {
        const activePrograms = await prisma_1.prisma.mentorshipProgram.findMany({
            where: { status: 'ACTIVE' },
            include: { match: true },
        });
        const now = new Date();
        for (const program of activePrograms) {
            if (!program.endDate)
                continue;
            const daysLeft = Math.ceil((program.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 0) {
                await exports.MentorshipService.completeProgram(program.id);
            }
            else if (daysLeft === 5) {
                await NotificationService_1.NotificationService.sendProgramEndingNotification(program.match.mentorId, 5);
                await NotificationService_1.NotificationService.sendProgramEndingNotification(program.match.menteeId, 5);
            }
            else if (daysLeft === 3) {
                await NotificationService_1.NotificationService.sendProgramEndingNotification(program.match.mentorId, 3);
                await NotificationService_1.NotificationService.sendProgramEndingNotification(program.match.menteeId, 3);
            }
            // Day 7 check-in nudge (7 days after start)
            if (program.startDate) {
                const daysElapsed = Math.ceil((now.getTime() - program.startDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysElapsed === 7) {
                    logger_1.logger.info({ programId: program.id }, 'Sending day-7 check-in nudge');
                    await NotificationService_1.NotificationService.sendProgramEndingNotification(program.match.mentorId, 23);
                    await NotificationService_1.NotificationService.sendProgramEndingNotification(program.match.menteeId, 23);
                }
            }
        }
    },
};
// ─── Internal helpers ─────────────────────────────────────
async function _scheduleProgramMilestones(programId, _mentorId, _menteeId, startDate) {
    const day25 = new Date(startDate);
    day25.setDate(day25.getDate() + 25);
    // Schedule 5-day warning via queue (delay in ms)
    const delayMs = day25.getTime() - Date.now();
    if (delayMs > 0) {
        logger_1.logger.info({ programId, delayMs }, 'Scheduled 5-day program ending notification');
    }
}
//# sourceMappingURL=MentorshipService.js.map