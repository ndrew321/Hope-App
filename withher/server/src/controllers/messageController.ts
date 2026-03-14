import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../utils/response';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { SafetyService } from '../services/SafetyService';
import { NotificationService } from '../services/NotificationService';

// ─── GET /api/conversations ──────────────────────────────
export async function getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ mentorId: req.userId }, { menteeId: req.userId }],
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      select: {
        id: true,
        status: true,
        mentor: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        mentee: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, messageType: true, createdAt: true, senderId: true, isRead: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Shape each match as a conversation summary
    const conversations = matches.map((m) => {
      const other = m.mentor.id === req.userId ? m.mentee : m.mentor;
      const lastMessage = m.messages[0] ?? null;
      return { matchId: m.id, status: m.status, otherUser: other, lastMessage };
    });

    sendSuccess(res, conversations);
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/messages/:matchId ──────────────────────────
export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 50);

    const match = await prisma.match.findUnique({
      where: { id: req.params.matchId },
      select: { mentorId: true, menteeId: true },
    });
    if (!match) throw new NotFoundError('Match');
    if (match.mentorId !== req.userId && match.menteeId !== req.userId) {
      throw new AuthorizationError('Not a participant in this conversation');
    }

    const [messages, total] = await prisma.$transaction([
      prisma.message.findMany({
        where: { matchId: req.params.matchId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          senderId: true,
          messageType: true,
          content: true,
          mediaUrl: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.message.count({ where: { matchId: req.params.matchId, deletedAt: null } }),
    ]);

    // Mark unread messages from the other user as read
    await prisma.message.updateMany({
      where: {
        matchId: req.params.matchId,
        recipientId: req.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    sendSuccess(res, messages, 200, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/messages/:matchId ─────────────────────────
export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { messageType, content, mediaUrl } = req.body as {
      messageType: 'TEXT' | 'VOICE' | 'IMAGE' | 'FILE' | 'SYSTEM';
      content?: string;
      mediaUrl?: string;
    };

    const match = await prisma.match.findUnique({
      where: { id: req.params.matchId },
      select: { mentorId: true, menteeId: true, status: true },
    });
    if (!match) throw new NotFoundError('Match');
    if (match.mentorId !== req.userId && match.menteeId !== req.userId) {
      throw new AuthorizationError('Not a participant in this conversation');
    }
    if (match.status === 'REJECTED' || match.status === 'EXPIRED') {
      throw new AuthorizationError('Cannot message in an inactive match');
    }

    const recipientId = match.mentorId === req.userId ? match.menteeId : match.mentorId;

    // Run safety scan on text content
    if (content) {
      await SafetyService.scanMessage(content, req.userId, recipientId);
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.userId,
        recipientId,
        matchId: req.params.matchId,
        messageType,
        content: content ?? null,
        mediaUrl: mediaUrl ?? null,
      },
      select: { id: true, senderId: true, messageType: true, content: true, mediaUrl: true, createdAt: true },
    });

    // Push notification for new message
    await NotificationService.sendNewMessageNotification(req.userId, recipientId);

    sendSuccess(res, message, 201);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/messages/:id ────────────────────────────
export async function deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const message = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!message) throw new NotFoundError('Message');
    if (message.senderId !== req.userId) {
      throw new AuthorizationError('You can only delete your own messages');
    }

    await prisma.message.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), content: null, mediaUrl: null },
    });

    sendSuccess(res, { message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
}
