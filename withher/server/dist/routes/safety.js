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
const SafetyController = __importStar(require("../controllers/safetyController"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
const UserIdParam = zod_1.z.object({ id: zod_1.z.string().min(1) });
const ReportSchema = zod_1.z.object({
    reportType: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(10).max(3000),
    evidenceUrls: zod_1.z.array(zod_1.z.string().url()).default([]),
    severityLevel: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
});
// ─── Verification routes ──────────────────────────────────
router.post('/verification/identity', SafetyController.initiateIdentityVerification);
router.post('/verification/background-check', SafetyController.initiateBackgroundCheck);
router.get('/verification/status', SafetyController.getVerificationStatus);
// ─── Moderation routes ────────────────────────────────────
router.post('/users/:id/report', (0, validationMiddleware_1.validateParams)(UserIdParam), (0, validationMiddleware_1.validateBody)(ReportSchema), SafetyController.reportUser);
router.post('/users/:id/block', (0, validationMiddleware_1.validateParams)(UserIdParam), SafetyController.blockUser);
router.delete('/users/:id/block', (0, validationMiddleware_1.validateParams)(UserIdParam), SafetyController.unblockUser);
router.get('/users/blocked', SafetyController.getBlockedUsers);
exports.default = router;
//# sourceMappingURL=safety.js.map