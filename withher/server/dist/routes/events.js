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
const EventController = __importStar(require("../controllers/eventController"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
const EventIdParam = zod_1.z.object({ id: zod_1.z.string().min(1) });
const CreateEventSchema = zod_1.z.object({
    eventType: zod_1.z.enum(['WORKSHOP', 'NETWORKING', 'SUMMIT', 'LOCAL_MEETUP', 'CLINIC']),
    title: zod_1.z.string().min(3).max(200),
    description: zod_1.z.string().min(10).max(10000),
    startDatetime: zod_1.z.string().datetime(),
    endDatetime: zod_1.z.string().datetime(),
    locationOrLink: zod_1.z.string().max(500).optional(),
    maxAttendees: zod_1.z.number().int().min(1).optional(),
    levelTargeting: zod_1.z.array(zod_1.z.enum(['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM'])).default([]),
    registrationRequired: zod_1.z.boolean().default(false),
});
const FeedbackSchema = zod_1.z.object({
    feedbackRating: zod_1.z.number().int().min(1).max(5),
    feedbackText: zod_1.z.string().max(2000).optional(),
});
router.get('/', EventController.listEvents);
router.post('/', (0, validationMiddleware_1.validateBody)(CreateEventSchema), EventController.createEvent);
router.put('/:id', (0, validationMiddleware_1.validateParams)(EventIdParam), (0, validationMiddleware_1.validateBody)(CreateEventSchema.partial()), EventController.updateEvent);
router.delete('/:id', (0, validationMiddleware_1.validateParams)(EventIdParam), EventController.deleteEvent);
router.post('/:id/register', (0, validationMiddleware_1.validateParams)(EventIdParam), EventController.registerForEvent);
router.delete('/:id/register', (0, validationMiddleware_1.validateParams)(EventIdParam), EventController.cancelRegistration);
router.get('/:id/attendees', (0, validationMiddleware_1.validateParams)(EventIdParam), EventController.getAttendees);
router.post('/:id/feedback', (0, validationMiddleware_1.validateParams)(EventIdParam), (0, validationMiddleware_1.validateBody)(FeedbackSchema), EventController.submitFeedback);
exports.default = router;
//# sourceMappingURL=events.js.map