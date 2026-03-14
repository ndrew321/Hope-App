"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgram = getProgram;
exports.getProgramSessions = getProgramSessions;
exports.scheduleSession = scheduleSession;
exports.rescheduleSession = rescheduleSession;
exports.cancelSession = cancelSession;
exports.submitNotes = submitNotes;
exports.getNotes = getNotes;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const NotificationService_1 = require("../services/NotificationService");
const BadgeService_1 = require("../services/BadgeService");
const MentorshipService_1 = require("../services/MentorshipService");
const sanitize_1 = require("../utils/sanitize");
// Helper: Verify user is participant in a program's match
async function assertProgramParticipant(programId, userId) {
    const program = await prisma_1.prisma.mentorshipProgram.findUnique({
        where: { id: programId },
        include: { match: { select: { mentorId: true, menteeId: true } } },
    });
    if (!program)
        throw new errors_1.NotFoundError('MentorshipProgram');
    if (program.match.mentorId !== userId && program.match.menteeId !== userId) {
        throw new errors_1.AuthorizationError('Not a participant in this program');
    }
}
// ─── GET /api/programs/:id ───────────────────────────────
async function getProgram(req, res, next) {
    try {
        await assertProgramParticipant(req.params.id, req.userId);
        const program = await prisma_1.prisma.mentorshipProgram.findUnique({
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
        (0, response_1.sendSuccess)(res, program);
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/programs/:id/sessions ─────────────────────
async function getProgramSessions(req, res, next) {
    try {
        await assertProgramParticipant(req.params.id, req.userId);
        const sessions = await prisma_1.prisma.session.findMany({
            where: { mentorshipProgramId: req.params.id },
            include: { notes: true },
            orderBy: { sessionNumber: 'asc' },
        });
        (0, response_1.sendSuccess)(res, sessions);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/sessions ──────────────────────────────────
async function scheduleSession(req, res, next) {
    try {
        const { mentorshipProgramId, sessionNumber, scheduledDate, scheduledTime, sessionType } = req.body;
        await assertProgramParticipant(mentorshipProgramId, req.userId);
        const session = await prisma_1.prisma.session.create({
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
        await NotificationService_1.NotificationService.scheduleSessionReminder(session.id, new Date(scheduledDate));
        (0, response_1.sendSuccess)(res, session, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── PUT /api/sessions/:id ───────────────────────────────
async function rescheduleSession(req, res, next) {
    try {
        const { scheduledDate, scheduledTime } = req.body;
        const session = await prisma_1.prisma.session.findUnique({
            where: { id: req.params.id },
            include: { mentorshipProgram: { include: { match: true } } },
        });
        if (!session)
            throw new errors_1.NotFoundError('Session');
        const { mentorId, menteeId } = session.mentorshipProgram.match;
        if (mentorId !== req.userId && menteeId !== req.userId) {
            throw new errors_1.AuthorizationError('Not a participant in this session');
        }
        const updated = await prisma_1.prisma.session.update({
            where: { id: req.params.id },
            data: {
                scheduledDate: new Date(scheduledDate),
                scheduledTime: scheduledTime ?? null,
                status: 'RESCHEDULED',
            },
        });
        await NotificationService_1.NotificationService.scheduleSessionReminder(updated.id, new Date(scheduledDate));
        (0, response_1.sendSuccess)(res, updated);
    }
    catch (err) {
        next(err);
    }
}
// ─── DELETE /api/sessions/:id ────────────────────────────
async function cancelSession(req, res, next) {
    try {
        const session = await prisma_1.prisma.session.findUnique({
            where: { id: req.params.id },
            include: { mentorshipProgram: { include: { match: true } } },
        });
        if (!session)
            throw new errors_1.NotFoundError('Session');
        const { mentorId, menteeId } = session.mentorshipProgram.match;
        if (mentorId !== req.userId && menteeId !== req.userId) {
            throw new errors_1.AuthorizationError('Not a participant in this session');
        }
        await prisma_1.prisma.session.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
        (0, response_1.sendSuccess)(res, { message: 'Session cancelled' });
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/sessions/:id/notes ───────────────────────
async function submitNotes(req, res, next) {
    try {
        const session = await prisma_1.prisma.session.findUnique({
            where: { id: req.params.id },
            include: { mentorshipProgram: { include: { match: true } } },
        });
        if (!session)
            throw new errors_1.NotFoundError('Session');
        const { mentorId, menteeId } = session.mentorshipProgram.match;
        if (mentorId !== req.userId && menteeId !== req.userId) {
            throw new errors_1.AuthorizationError('Not a participant in this session');
        }
        const { mentorNotes, menteeReflection, topicsDiscussed, actionItemsForMentee, actionItemsForMentor, keyTakeaways, resourcesShared, nextSessionAgenda, menteeSelfRating, } = req.body;
        const notes = await prisma_1.prisma.sessionNotes.upsert({
            where: { sessionId: req.params.id },
            create: {
                sessionId: req.params.id,
                mentorNotes: mentorNotes ? (0, sanitize_1.sanitizeText)(mentorNotes) : null,
                menteeReflection: menteeReflection ? (0, sanitize_1.sanitizeText)(menteeReflection) : null,
                topicsDiscussed,
                actionItemsForMentee,
                actionItemsForMentor,
                keyTakeaways,
                resourcesShared,
                nextSessionAgenda: nextSessionAgenda ?? null,
                menteeSelfRating: menteeSelfRating ?? null,
            },
            update: {
                mentorNotes: mentorNotes ? (0, sanitize_1.sanitizeText)(mentorNotes) : undefined,
                menteeReflection: menteeReflection ? (0, sanitize_1.sanitizeText)(menteeReflection) : undefined,
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
        await prisma_1.prisma.session.update({ where: { id: req.params.id }, data: { status: 'COMPLETED', actualDate: new Date() } });
        // Recalculate program completion
        await MentorshipService_1.MentorshipService.updateCompletionPercentage(session.mentorshipProgramId);
        // Trigger badge checks
        await BadgeService_1.BadgeService.checkAfterSessionCompleted(req.userId);
        // Notify the other participant
        const otherId = mentorId === req.userId ? menteeId : mentorId;
        const actor = await prisma_1.prisma.user.findUnique({ where: { id: req.userId }, select: { firstName: true } });
        await NotificationService_1.NotificationService.sendSessionNotesNotification(otherId, actor?.firstName ?? 'Your partner');
        (0, response_1.sendSuccess)(res, notes, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/sessions/:id/notes ─────────────────────────
async function getNotes(req, res, next) {
    try {
        const session = await prisma_1.prisma.session.findUnique({
            where: { id: req.params.id },
            include: { mentorshipProgram: { include: { match: true } }, notes: true },
        });
        if (!session)
            throw new errors_1.NotFoundError('Session');
        const { mentorId, menteeId } = session.mentorshipProgram.match;
        if (mentorId !== req.userId && menteeId !== req.userId) {
            throw new errors_1.AuthorizationError('Not a participant in this session');
        }
        (0, response_1.sendSuccess)(res, session.notes);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=sessionController.js.map