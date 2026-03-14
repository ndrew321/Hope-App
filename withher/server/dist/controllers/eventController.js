"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEvents = listEvents;
exports.createEvent = createEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
exports.registerForEvent = registerForEvent;
exports.cancelRegistration = cancelRegistration;
exports.getAttendees = getAttendees;
exports.submitFeedback = submitFeedback;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const sanitize_1 = require("../utils/sanitize");
const BadgeService_1 = require("../services/BadgeService");
// ─── GET /api/events ─────────────────────────────────────
async function listEvents(req, res, next) {
    try {
        const { page, limit, skip } = (0, response_1.parsePagination)(req.query.page, req.query.limit);
        const { eventType, level } = req.query;
        const activeStatuses = ['PLANNING', 'ACTIVE'];
        const where = {
            status: { in: activeStatuses },
            startDatetime: { gte: new Date() },
            ...(eventType && { eventType: eventType }),
            ...(level && { levelTargeting: { has: level } }),
        };
        const [events, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.event.findMany({
                where,
                orderBy: { startDatetime: 'asc' },
                skip,
                take: limit,
                select: {
                    id: true, eventType: true, title: true, description: true,
                    startDatetime: true, endDatetime: true, locationOrLink: true,
                    maxAttendees: true, attendeeCount: true, levelTargeting: true,
                    registrationRequired: true, status: true,
                    organizer: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
                },
            }),
            prisma_1.prisma.event.count({ where }),
        ]);
        (0, response_1.sendSuccess)(res, events, 200, (0, response_1.buildPaginationMeta)(page, limit, total));
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/events ────────────────────────────────────
async function createEvent(req, res, next) {
    try {
        const data = req.body;
        const event = await prisma_1.prisma.event.create({
            data: {
                organizerId: req.userId,
                eventType: data.eventType,
                title: (0, sanitize_1.sanitizeText)(data.title),
                description: (0, sanitize_1.sanitizeText)(data.description),
                startDatetime: new Date(data.startDatetime),
                endDatetime: new Date(data.endDatetime),
                locationOrLink: data.locationOrLink ?? null,
                maxAttendees: data.maxAttendees ?? null,
                levelTargeting: data.levelTargeting,
                registrationRequired: data.registrationRequired,
                status: 'PLANNING',
            },
        });
        (0, response_1.sendSuccess)(res, event, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── PUT /api/events/:id ─────────────────────────────────
async function updateEvent(req, res, next) {
    try {
        const event = await prisma_1.prisma.event.findUnique({ where: { id: req.params.id } });
        if (!event)
            throw new errors_1.NotFoundError('Event');
        if (event.organizerId !== req.userId)
            throw new errors_1.AuthorizationError('Not the event organizer');
        const updated = await prisma_1.prisma.event.update({ where: { id: req.params.id }, data: req.body });
        (0, response_1.sendSuccess)(res, updated);
    }
    catch (err) {
        next(err);
    }
}
// ─── DELETE /api/events/:id ──────────────────────────────
async function deleteEvent(req, res, next) {
    try {
        const event = await prisma_1.prisma.event.findUnique({ where: { id: req.params.id } });
        if (!event)
            throw new errors_1.NotFoundError('Event');
        if (event.organizerId !== req.userId)
            throw new errors_1.AuthorizationError('Not the event organizer');
        await prisma_1.prisma.event.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
        (0, response_1.sendSuccess)(res, { message: 'Event cancelled' });
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/events/:id/register ──────────────────────
async function registerForEvent(req, res, next) {
    try {
        const event = await prisma_1.prisma.event.findUnique({ where: { id: req.params.id } });
        if (!event)
            throw new errors_1.NotFoundError('Event');
        if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
            throw new errors_1.ConflictError('Event is no longer accepting registrations');
        }
        if (event.maxAttendees && event.attendeeCount >= event.maxAttendees) {
            throw new errors_1.ConflictError('Event is full');
        }
        const reg = await prisma_1.prisma.$transaction(async (tx) => {
            const created = await tx.eventRegistration.create({
                data: { eventId: req.params.id, userId: req.userId, status: 'REGISTERED' },
            });
            await tx.event.update({ where: { id: req.params.id }, data: { attendeeCount: { increment: 1 } } });
            return created;
        });
        (0, response_1.sendSuccess)(res, reg, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── DELETE /api/events/:id/register ────────────────────
async function cancelRegistration(req, res, next) {
    try {
        const reg = await prisma_1.prisma.eventRegistration.findUnique({
            where: { eventId_userId: { eventId: req.params.id, userId: req.userId } },
        });
        if (!reg)
            throw new errors_1.NotFoundError('Registration');
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.eventRegistration.update({
                where: { eventId_userId: { eventId: req.params.id, userId: req.userId } },
                data: { status: 'CANCELLED' },
            });
            await tx.event.update({ where: { id: req.params.id }, data: { attendeeCount: { decrement: 1 } } });
        });
        (0, response_1.sendSuccess)(res, { message: 'Registration cancelled' });
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/events/:id/attendees ───────────────────────
async function getAttendees(req, res, next) {
    try {
        const event = await prisma_1.prisma.event.findUnique({ where: { id: req.params.id } });
        if (!event)
            throw new errors_1.NotFoundError('Event');
        const registrations = await prisma_1.prisma.eventRegistration.findMany({
            where: { eventId: req.params.id, status: { in: ['REGISTERED', 'ATTENDED'] } },
            select: {
                status: true,
                registeredAt: true,
                user: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true, profile: { select: { currentLevel: true } } } },
            },
        });
        (0, response_1.sendSuccess)(res, registrations);
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/events/:id/feedback ──────────────────────
async function submitFeedback(req, res, next) {
    try {
        const { feedbackRating, feedbackText } = req.body;
        const reg = await prisma_1.prisma.eventRegistration.update({
            where: { eventId_userId: { eventId: req.params.id, userId: req.userId } },
            data: {
                feedbackRating,
                feedbackText: feedbackText ? (0, sanitize_1.sanitizeText)(feedbackText) : null,
                status: 'ATTENDED',
                attendedAt: new Date(),
            },
        });
        await BadgeService_1.BadgeService.checkAfterEventAttended(req.userId);
        (0, response_1.sendSuccess)(res, reg);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=eventController.js.map