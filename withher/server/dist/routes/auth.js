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
const rateLimitMiddleware_1 = require("../middleware/rateLimitMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const authMiddleware_1 = require("../middleware/authMiddleware");
const AuthController = __importStar(require("../controllers/authController"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// ─── Zod schemas ─────────────────────────────────────────
const RegisterSchema = zod_1.z.object({
    firebaseUid: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().min(1).max(100),
    lastName: zod_1.z.string().min(1).max(100),
    phone: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().datetime().optional(),
});
const LoginSchema = zod_1.z.object({
    firebaseUid: zod_1.z.string().min(1),
    idToken: zod_1.z.string().min(1),
});
const ForgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const ResetPasswordSchema = zod_1.z.object({
    oobCode: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8),
});
const VerifyEmailSchema = zod_1.z.object({
    oobCode: zod_1.z.string().min(1),
});
const VerifyPhoneSchema = zod_1.z.object({
    phone: zod_1.z.string().min(7),
    verificationCode: zod_1.z.string().length(6),
});
const RefreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
// ─── Routes ──────────────────────────────────────────────
// Public auth routes — stricter rate limit
router.post('/register', rateLimitMiddleware_1.authRateLimit, (0, validationMiddleware_1.validateBody)(RegisterSchema), AuthController.register);
router.post('/login', rateLimitMiddleware_1.authRateLimit, (0, validationMiddleware_1.validateBody)(LoginSchema), AuthController.login);
router.post('/forgot-password', rateLimitMiddleware_1.authRateLimit, (0, validationMiddleware_1.validateBody)(ForgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', rateLimitMiddleware_1.authRateLimit, (0, validationMiddleware_1.validateBody)(ResetPasswordSchema), AuthController.resetPassword);
router.post('/verify-email', rateLimitMiddleware_1.authRateLimit, (0, validationMiddleware_1.validateBody)(VerifyEmailSchema), AuthController.verifyEmail);
router.post('/verify-phone', rateLimitMiddleware_1.authRateLimit, (0, validationMiddleware_1.validateBody)(VerifyPhoneSchema), AuthController.verifyPhone);
router.post('/refresh-token', rateLimitMiddleware_1.authRateLimit, (0, validationMiddleware_1.validateBody)(RefreshTokenSchema), AuthController.refreshToken);
// Protected — requires valid Firebase JWT
router.post('/logout', authMiddleware_1.authMiddleware, AuthController.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map