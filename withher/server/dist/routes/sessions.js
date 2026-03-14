"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const SessionController = __importStar(require("../controllers/sessionController"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
const ProgramIdParam = zod_1.z.object({ id: zod_1.z.string().min(1) });
const SessionIdParam = zod_1.z.object({ id: zod_1.z.string().min(1) });
const ScheduleSessionSchema = zod_1.z.object({
    mentorshipProgramId: zod_1.z.string().min(1),
    sessionNumber: zod_1.z.number().int().min(1).max(4),
    scheduledDate: zod_1.z.string().datetime(),
    scheduledTime: zod_1.z.string().optional(),
    sessionType: zod_1.z.enum(['SYNC_CALL', 'ASYNC_MESSAGE', 'GROUP', 'EVENT']).default('SYNC_CALL'),
});
const RescheduleSchema = zod_1.z.object({
    scheduledDate: zod_1.z.string().datetime(),
    scheduledTime: zod_1.z.string().optional(),
});
const SessionNotesSchema = zod_1.z.object({
    mentorNotes: zod_1.z.string().max(5000).optional(),
    menteeReflection: zod_1.z.string().max(5000).optional(),
    topicsDiscussed: zod_1.z.array(zod_1.z.string()).default([]),
    actionItemsForMentee: zod_1.z.array(zod_1.z.string()).default([]),
    actionItemsForMentor: zod_1.z.array(zod_1.z.string()).default([]),
    keyTakeaways: zod_1.z.array(zod_1.z.string()).default([]),
    resourcesShared: zod_1.z.array(zod_1.z.string()).default([]),
    nextSessionAgenda: zod_1.z.string().max(3000).optional(),
    menteeSelfRating: zod_1.z.number().int().min(1).max(5).optional(),
});
router.get('/programs/:id', (0, validationMiddleware_1.validateParams)(ProgramIdParam), SessionController.getProgram);
router.get('/programs/:id/sessions', (0, validationMiddleware_1.validateParams)(ProgramIdParam), SessionController.getProgramSessions);
router.post('/sessions', (0, validationMiddleware_1.validateBody)(ScheduleSessionSchema), SessionController.scheduleSession);
router.put('/sessions/:id', (0, validationMiddleware_1.validateParams)(SessionIdParam), (0, validationMiddleware_1.validateBody)(RescheduleSchema), SessionController.rescheduleSession);
router.delete('/sessions/:id', (0, validationMiddleware_1.validateParams)(SessionIdParam), SessionController.cancelSession);
router.post('/sessions/:id/notes', (0, validationMiddleware_1.validateParams)(SessionIdParam), (0, validationMiddleware_1.validateBody)(SessionNotesSchema), SessionController.submitNotes);
router.get('/sessions/:id/notes', (0, validationMiddleware_1.validateParams)(SessionIdParam), SessionController.getNotes);
exports.default = router;
//# sourceMappingURL=sessions.js.map