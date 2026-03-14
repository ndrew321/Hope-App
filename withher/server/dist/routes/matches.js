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
const parentalApprovalMiddleware_1 = require("../middleware/parentalApprovalMiddleware");
const MatchController = __importStar(require("../controllers/matchController"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
const SwipeSchema = zod_1.z.object({
    targetUserId: zod_1.z.string().min(1),
    direction: zod_1.z.enum(['left', 'right']),
});
const StartProgramSchema = zod_1.z.object({
    menteeInitialGoal: zod_1.z.string().min(10).max(3000),
});
router.get('/discover', MatchController.discover);
router.post('/swipe', rateLimitMiddleware_1.swipeRateLimit, (0, validationMiddleware_1.validateBody)(SwipeSchema), MatchController.swipe);
router.get('/liked-me', MatchController.likedMe);
router.get('/active', MatchController.getActiveMatches);
router.post('/:id/confirm', parentalApprovalMiddleware_1.parentalApprovalMiddleware, MatchController.confirmMatch);
router.post('/:id/start-program', (0, validationMiddleware_1.validateBody)(StartProgramSchema), MatchController.startProgram);
exports.default = router;
//# sourceMappingURL=matches.js.map