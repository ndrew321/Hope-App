"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversations = getConversations;
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.deleteMessage = deleteMessage;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const SafetyService_1 = require("../services/SafetyService");
const NotificationService_1 = require("../services/NotificationService");
// ─── GET /api/conversations ──────────────────────────────
async function getConversations(req, res, next) {
    try {
        const matches = await prisma_1.prisma.match.findMany({
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
        (0, response_1.sendSuccess)(res, conversations);
    }
    catch (err) {
        next(err);
    }
}
// ─── GET /api/messages/:matchId ──────────────────────────
async function getMessages(req, res, next) {
    try {
        const { page, limit, skip } = (0, response_1.parsePagination)(req.query.page, req.query.limit, 50);
        const match = await prisma_1.prisma.match.findUnique({
            where: { id: req.params.matchId },
            select: { mentorId: true, menteeId: true },
        });
        if (!match)
            throw new errors_1.NotFoundError('Match');
        if (match.mentorId !== req.userId && match.menteeId !== req.userId) {
            throw new errors_1.AuthorizationError('Not a participant in this conversation');
        }
        const [messages, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.message.findMany({
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
            prisma_1.prisma.message.count({ where: { matchId: req.params.matchId, deletedAt: null } }),
        ]);
        // Mark unread messages from the other user as read
        await prisma_1.prisma.message.updateMany({
            where: {
                matchId: req.params.matchId,
                recipientId: req.userId,
                isRead: false,
            },
            data: { isRead: true },
        });
        (0, response_1.sendSuccess)(res, messages, 200, (0, response_1.buildPaginationMeta)(page, limit, total));
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/messages/:matchId ─────────────────────────
async function sendMessage(req, res, next) {
    try {
        const { messageType, content, mediaUrl } = req.body;
        const match = await prisma_1.prisma.match.findUnique({
            where: { id: req.params.matchId },
            select: { mentorId: true, menteeId: true, status: true },
        });
        if (!match)
            throw new errors_1.NotFoundError('Match');
        if (match.mentorId !== req.userId && match.menteeId !== req.userId) {
            throw new errors_1.AuthorizationError('Not a participant in this conversation');
        }
        if (match.status === 'REJECTED' || match.status === 'EXPIRED') {
            throw new errors_1.AuthorizationError('Cannot message in an inactive match');
        }
        const recipientId = match.mentorId === req.userId ? match.menteeId : match.mentorId;
        // Run safety scan on text content
        if (content) {
            await SafetyService_1.SafetyService.scanMessage(content, req.userId, recipientId);
        }
        const message = await prisma_1.prisma.message.create({
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
        await NotificationService_1.NotificationService.sendNewMessageNotification(req.userId, recipientId);
        (0, response_1.sendSuccess)(res, message, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── DELETE /api/messages/:id ────────────────────────────
async function deleteMessage(req, res, next) {
    try {
        const message = await prisma_1.prisma.message.findUnique({ where: { id: req.params.id } });
        if (!message)
            throw new errors_1.NotFoundError('Message');
        if (message.senderId !== req.userId) {
            throw new errors_1.AuthorizationError('You can only delete your own messages');
        }
        await prisma_1.prisma.message.update({
            where: { id: req.params.id },
            data: { deletedAt: new Date(), content: null, mediaUrl: null },
        });
        (0, response_1.sendSuccess)(res, { message: 'Message deleted' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=messageController.js.map