"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const bull_1 = __importDefault(require("bull"));
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
const expo = new expo_server_sdk_1.Expo();
// Bull queue backed by Redis for async notification jobs
const notificationQueue = new bull_1.default('notifications', {
    redis: process.env.REDIS_URL ?? 'redis://localhost:6379',
});
// Process notification jobs
notificationQueue.process(async (job) => {
    const { userIds, title, body, data } = job.data;
    await _sendPushToUsers(userIds, title, body, data);
});
// ─── Public API ──────────────────────────────────────────
exports.NotificationService = {
    /**
     * "You have a new match!" — sent to both mentor and mentee.
     */
    async sendNewMatchNotification(mentorId, menteeId) {
        const [mentor, mentee] = await Promise.all([
            prisma_1.prisma.user.findUnique({ where: { id: mentorId }, select: { firstName: true } }),
            prisma_1.prisma.user.findUnique({ where: { id: menteeId }, select: { firstName: true } }),
        ]);
        await notificationQueue.add({
            userIds: [mentorId],
            title: "It's a Match! 🎉",
            body: `You matched with ${mentee?.firstName ?? 'someone'}! Start your mentorship conversation.`,
            data: { screen: 'MatchDetail', menteeId },
        });
        await notificationQueue.add({
            userIds: [menteeId],
            title: "It's a Match! 🎉",
            body: `You matched with ${mentor?.firstName ?? 'someone'}! Start your mentorship journey.`,
            data: { screen: 'MatchDetail', mentorId },
        });
    },
    /**
     * "New message from [name]" — real-time message received.
     */
    async sendNewMessageNotification(senderId, recipientId) {
        const prefs = await prisma_1.prisma.notificationPreference.findUnique({
            where: { userId: recipientId },
            select: { newMessage: true },
        });
        if (!prefs?.newMessage)
            return;
        const sender = await prisma_1.prisma.user.findUnique({
            where: { id: senderId },
            select: { firstName: true },
        });
        await notificationQueue.add({
            userIds: [recipientId],
            title: 'New Message',
            body: `${sender?.firstName ?? 'Someone'} sent you a message.`,
            data: { screen: 'Messages' },
        });
    },
    /**
     * Schedule 24h and 1h reminders before a session.
     */
    async scheduleSessionReminder(sessionId, sessionDate) {
        const session = await prisma_1.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                mentorshipProgram: {
                    include: { match: true },
                },
            },
        });
        if (!session)
            return;
        const { mentorId, menteeId } = session.mentorshipProgram.match;
        const now = Date.now();
        // 24h reminder
        const delay24h = sessionDate.getTime() - 24 * 60 * 60 * 1000 - now;
        if (delay24h > 0) {
            await notificationQueue.add({
                userIds: [mentorId, menteeId],
                title: 'Session Tomorrow',
                body: `You have a mentorship session tomorrow. Don't forget!`,
                data: { screen: 'SessionScheduler', sessionId },
            }, { delay: delay24h });
        }
        // 1h reminder
        const delay1h = sessionDate.getTime() - 60 * 60 * 1000 - now;
        if (delay1h > 0) {
            await notificationQueue.add({
                userIds: [mentorId, menteeId],
                title: 'Session in 1 Hour',
                body: `Your mentorship session starts in 1 hour.`,
                data: { screen: 'SessionScheduler', sessionId },
            }, { delay: delay1h });
        }
    },
    /**
     * "[Name] sent session notes" — after a session is logged.
     */
    async sendSessionNotesNotification(recipientId, senderName) {
        const prefs = await prisma_1.prisma.notificationPreference.findUnique({
            where: { userId: recipientId },
            select: { sessionNotes: true },
        });
        if (!prefs?.sessionNotes)
            return;
        await notificationQueue.add({
            userIds: [recipientId],
            title: 'Session Notes Submitted',
            body: `${senderName} submitted notes from your recent session.`,
            data: { screen: 'SessionHistory' },
        });
    },
    /**
     * "You earned a badge: [badge name]!" — after badge is awarded.
     */
    async sendBadgeEarnedNotification(userId, badgeName) {
        const prefs = await prisma_1.prisma.notificationPreference.findUnique({
            where: { userId },
            select: { badgeEarned: true },
        });
        if (!prefs?.badgeEarned)
            return;
        await notificationQueue.add({
            userIds: [userId],
            title: 'Badge Earned! 🏅',
            body: `Congratulations! You earned the "${badgeName}" badge.`,
            data: { screen: 'Badges' },
        });
    },
    /**
     * "Your mentorship program ends in N days"
     */
    async sendProgramEndingNotification(userId, daysLeft) {
        const prefs = await prisma_1.prisma.notificationPreference.findUnique({
            where: { userId },
            select: { programEndingReminder: true },
        });
        if (!prefs?.programEndingReminder)
            return;
        await notificationQueue.add({
            userIds: [userId],
            title: 'Program Ending Soon',
            body: `Your mentorship program ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Make the most of it!`,
            data: { screen: 'MentorshipProgram' },
        });
    },
};
// ─── Internal helpers ─────────────────────────────────────
async function _sendPushToUsers(userIds, title, body, data) {
    const tokens = await prisma_1.prisma.pushToken.findMany({
        where: { userId: { in: userIds } },
        select: { token: true },
    });
    const messages = tokens
        .filter((t) => expo_server_sdk_1.Expo.isExpoPushToken(t.token))
        .map((t) => ({
        to: t.token,
        sound: 'default',
        title,
        body,
        data: data ?? {},
    }));
    if (messages.length === 0)
        return;
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
        try {
            await expo.sendPushNotificationsAsync(chunk);
        }
        catch (err) {
            logger_1.logger.error({ err }, 'Failed to send push notification chunk');
        }
    }
}
//# sourceMappingURL=NotificationService.js.map