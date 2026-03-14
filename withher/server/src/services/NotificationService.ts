import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import Bull from 'bull';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const expo = new Expo();

// Bull queue backed by Redis for async notification jobs
const notificationQueue = new Bull('notifications', {
  redis: process.env.REDIS_URL ?? 'redis://localhost:6379',
});

// Process notification jobs
notificationQueue.process(async (job) => {
  const { userIds, title, body, data } = job.data as {
    userIds: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
  };
  await _sendPushToUsers(userIds, title, body, data);
});

// ─── Public API ──────────────────────────────────────────

export const NotificationService = {
  /**
   * "You have a new match!" — sent to both mentor and mentee.
   */
  async sendNewMatchNotification(mentorId: string, menteeId: string): Promise<void> {
    const [mentor, mentee] = await Promise.all([
      prisma.user.findUnique({ where: { id: mentorId }, select: { firstName: true } }),
      prisma.user.findUnique({ where: { id: menteeId }, select: { firstName: true } }),
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
  async sendNewMessageNotification(senderId: string, recipientId: string): Promise<void> {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: recipientId },
      select: { newMessage: true },
    });
    if (!prefs?.newMessage) return;

    const sender = await prisma.user.findUnique({
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
  async scheduleSessionReminder(sessionId: string, sessionDate: Date): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        mentorshipProgram: {
          include: { match: true },
        },
      },
    });
    if (!session) return;

    const { mentorId, menteeId } = session.mentorshipProgram.match;
    const now = Date.now();

    // 24h reminder
    const delay24h = sessionDate.getTime() - 24 * 60 * 60 * 1000 - now;
    if (delay24h > 0) {
      await notificationQueue.add(
        {
          userIds: [mentorId, menteeId],
          title: 'Session Tomorrow',
          body: `You have a mentorship session tomorrow. Don't forget!`,
          data: { screen: 'SessionScheduler', sessionId },
        },
        { delay: delay24h },
      );
    }

    // 1h reminder
    const delay1h = sessionDate.getTime() - 60 * 60 * 1000 - now;
    if (delay1h > 0) {
      await notificationQueue.add(
        {
          userIds: [mentorId, menteeId],
          title: 'Session in 1 Hour',
          body: `Your mentorship session starts in 1 hour.`,
          data: { screen: 'SessionScheduler', sessionId },
        },
        { delay: delay1h },
      );
    }
  },

  /**
   * "[Name] sent session notes" — after a session is logged.
   */
  async sendSessionNotesNotification(recipientId: string, senderName: string): Promise<void> {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: recipientId },
      select: { sessionNotes: true },
    });
    if (!prefs?.sessionNotes) return;

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
  async sendBadgeEarnedNotification(userId: string, badgeName: string): Promise<void> {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
      select: { badgeEarned: true },
    });
    if (!prefs?.badgeEarned) return;

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
  async sendProgramEndingNotification(userId: string, daysLeft: number): Promise<void> {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
      select: { programEndingReminder: true },
    });
    if (!prefs?.programEndingReminder) return;

    await notificationQueue.add({
      userIds: [userId],
      title: 'Program Ending Soon',
      body: `Your mentorship program ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Make the most of it!`,
      data: { screen: 'MentorshipProgram' },
    });
  },
};

// ─── Internal helpers ─────────────────────────────────────

async function _sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  });

  const messages: ExpoPushMessage[] = tokens
    .filter((t) => Expo.isExpoPushToken(t.token))
    .map((t) => ({
      to: t.token,
      sound: 'default' as const,
      title,
      body,
      data: data ?? {},
    }));

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      logger.error({ err }, 'Failed to send push notification chunk');
    }
  }
}
