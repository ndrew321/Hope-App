import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess } from '../utils/response';
import { AuthorizationError } from '../utils/errors';

// ─── GET /api/notifications ──────────────────────────────
// NOTE: Notifications are stored in Firebase Realtime DB.
// This endpoint returns preference settings + push token info.
export async function listNotifications(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: req.userId },
    });
    sendSuccess(res, { preferences: prefs });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/notifications/:id/read ────────────────────
export async function markRead(
  _req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    // Notification read state is managed client-side via Firebase.
    sendSuccess(res, { message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/push-tokens ───────────────────────────────
export async function registerPushToken(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const { token, platform } = req.body as { token: string; platform: 'ios' | 'android' };

    await prisma.pushToken.upsert({
      where: { token },
      create: { userId: req.userId, token, platform },
      update: { userId: req.userId, platform },
    });

    sendSuccess(res, { message: 'Push token registered' }, 201);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/users/:id/notification-preferences ─────────
export async function updatePreferences(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    if (req.params.id !== req.userId) {
      throw new AuthorizationError('Can only update your own notification preferences');
    }

    const updated = await prisma.notificationPreference.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, ...req.body },
      update: req.body,
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}
