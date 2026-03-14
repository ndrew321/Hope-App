"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNotifications = listNotifications;
exports.markRead = markRead;
exports.registerPushToken = registerPushToken;
exports.updatePreferences = updatePreferences;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
// ─── GET /api/notifications ──────────────────────────────
// NOTE: Notifications are stored in Firebase Realtime DB.
// This endpoint returns preference settings + push token info.
async function listNotifications(req, res, next) {
    try {
        const prefs = await prisma_1.prisma.notificationPreference.findUnique({
            where: { userId: req.userId },
        });
        (0, response_1.sendSuccess)(res, { preferences: prefs });
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/notifications/:id/read ────────────────────
async function markRead(_req, res, next) {
    try {
        // Notification read state is managed client-side via Firebase.
        (0, response_1.sendSuccess)(res, { message: 'Marked as read' });
    }
    catch (err) {
        next(err);
    }
}
// ─── POST /api/push-tokens ───────────────────────────────
async function registerPushToken(req, res, next) {
    try {
        const { token, platform } = req.body;
        await prisma_1.prisma.pushToken.upsert({
            where: { token },
            create: { userId: req.userId, token, platform },
            update: { userId: req.userId, platform },
        });
        (0, response_1.sendSuccess)(res, { message: 'Push token registered' }, 201);
    }
    catch (err) {
        next(err);
    }
}
// ─── PUT /api/users/:id/notification-preferences ─────────
async function updatePreferences(req, res, next) {
    try {
        if (req.params.id !== req.userId) {
            throw new errors_1.AuthorizationError('Can only update your own notification preferences');
        }
        const updated = await prisma_1.prisma.notificationPreference.upsert({
            where: { userId: req.userId },
            create: { userId: req.userId, ...req.body },
            update: req.body,
        });
        (0, response_1.sendSuccess)(res, updated);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=notificationController.js.map