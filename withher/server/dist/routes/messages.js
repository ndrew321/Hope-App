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
const rateLimitMiddleware_1 = require("../middleware/rateLimitMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const MessageController = __importStar(require("../controllers/messageController"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
const MatchIdParam = zod_1.z.object({ matchId: zod_1.z.string().min(1) });
const MsgIdParam = zod_1.z.object({ id: zod_1.z.string().min(1) });
const SendMessageSchema = zod_1.z.object({
    messageType: zod_1.z.enum(['TEXT', 'VOICE', 'IMAGE', 'FILE', 'SYSTEM']).default('TEXT'),
    content: zod_1.z.string().max(5000).optional(),
    mediaUrl: zod_1.z.string().url().optional(),
}).refine((d) => d.content || d.mediaUrl, { message: 'Either content or mediaUrl is required' });
router.get('/conversations', MessageController.getConversations);
router.get('/:matchId', (0, validationMiddleware_1.validateParams)(MatchIdParam), MessageController.getMessages);
router.post('/:matchId', rateLimitMiddleware_1.messageRateLimit, (0, validationMiddleware_1.validateParams)(MatchIdParam), (0, validationMiddleware_1.validateBody)(SendMessageSchema), MessageController.sendMessage);
router.delete('/:id', (0, validationMiddleware_1.validateParams)(MsgIdParam), MessageController.deleteMessage);
exports.default = router;
//# sourceMappingURL=messages.js.map