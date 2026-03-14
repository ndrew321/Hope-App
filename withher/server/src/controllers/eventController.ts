import { Request, Response, NextFunction } from 'express';
import { EventStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../utils/response';
import { NotFoundError, AuthorizationError, ConflictError } from '../utils/errors';
import { sanitizeText } from '../utils/sanitize';
import { BadgeService } from '../services/BadgeService';

// ─── GET /api/events ─────────────────────────────────────
export async function listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const { eventType, level } = req.query as { eventType?: string; level?: string };
    const activeStatuses: EventStatus[] = ['PLANNING', 'ACTIVE'];

    const where = {
      status: { in: activeStatuses },
      startDatetime: { gte: new Date() },
      ...(eventType && { eventType: eventType as never }),
      ...(level && { levelTargeting: { has: level as never } }),
    };

    const [events, total] = await prisma.$transaction([
      prisma.event.findMany({
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
      prisma.event.count({ where }),
    ]);

    sendSuccess(res, events, 200, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/events ────────────────────────────────────
export async function createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as {
      eventType: 'WORKSHOP' | 'NETWORKING' | 'SUMMIT' | 'LOCAL_MEETUP' | 'CLINIC';
      title: string;
      description: string;
      startDatetime: string;
      endDatetime: string;
      locationOrLink?: string;
      maxAttendees?: number;
      levelTargeting: string[];
      registrationRequired: boolean;
    };

    const event = await prisma.event.create({
      data: {
        organizerId: req.userId,
        eventType: data.eventType,
        title: sanitizeText(data.title),
        description: sanitizeText(data.description),
        startDatetime: new Date(data.startDatetime),
        endDatetime: new Date(data.endDatetime),
        locationOrLink: data.locationOrLink ?? null,
        maxAttendees: data.maxAttendees ?? null,
        levelTargeting: data.levelTargeting as never,
        registrationRequired: data.registrationRequired,
        status: 'PLANNING',
      },
    });

    sendSuccess(res, event, 201);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/events/:id ─────────────────────────────────
export async function updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new NotFoundError('Event');
    if (event.organizerId !== req.userId) throw new AuthorizationError('Not the event organizer');

    const updated = await prisma.event.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/events/:id ──────────────────────────────
export async function deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new NotFoundError('Event');
    if (event.organizerId !== req.userId) throw new AuthorizationError('Not the event organizer');

    await prisma.event.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    sendSuccess(res, { message: 'Event cancelled' });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/events/:id/register ──────────────────────
export async function registerForEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new NotFoundError('Event');
    if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
      throw new ConflictError('Event is no longer accepting registrations');
    }
    if (event.maxAttendees && event.attendeeCount >= event.maxAttendees) {
      throw new ConflictError('Event is full');
    }

    const reg = await prisma.$transaction(async (tx) => {
      const created = await tx.eventRegistration.create({
        data: { eventId: req.params.id, userId: req.userId, status: 'REGISTERED' },
      });
      await tx.event.update({ where: { id: req.params.id }, data: { attendeeCount: { increment: 1 } } });
      return created;
    });

    sendSuccess(res, reg, 201);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/events/:id/register ────────────────────
export async function cancelRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reg = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: req.params.id, userId: req.userId } },
    });
    if (!reg) throw new NotFoundError('Registration');

    await prisma.$transaction(async (tx) => {
      await tx.eventRegistration.update({
        where: { eventId_userId: { eventId: req.params.id, userId: req.userId } },
        data: { status: 'CANCELLED' },
      });
      await tx.event.update({ where: { id: req.params.id }, data: { attendeeCount: { decrement: 1 } } });
    });

    sendSuccess(res, { message: 'Registration cancelled' });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/events/:id/attendees ───────────────────────
export async function getAttendees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) throw new NotFoundError('Event');

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: req.params.id, status: { in: ['REGISTERED', 'ATTENDED'] } },
      select: {
        status: true,
        registeredAt: true,
        user: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true, profile: { select: { currentLevel: true } } } },
      },
    });

    sendSuccess(res, registrations);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/events/:id/feedback ──────────────────────
export async function submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { feedbackRating, feedbackText } = req.body as { feedbackRating: number; feedbackText?: string };

    const reg = await prisma.eventRegistration.update({
      where: { eventId_userId: { eventId: req.params.id, userId: req.userId } },
      data: {
        feedbackRating,
        feedbackText: feedbackText ? sanitizeText(feedbackText) : null,
        status: 'ATTENDED',
        attendedAt: new Date(),
      },
    });

    await BadgeService.checkAfterEventAttended(req.userId);
    sendSuccess(res, reg);
  } catch (err) {
    next(err);
  }
}
