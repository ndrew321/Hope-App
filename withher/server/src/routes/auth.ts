import { Router } from 'express';
import { authRateLimit } from '../middleware/rateLimitMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import * as AuthController from '../controllers/authController';
import { z } from 'zod';

const router = Router();

// ─── Zod schemas ─────────────────────────────────────────

const RegisterSchema = z.object({
  firebaseUid: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
});

const LoginSchema = z.object({
  firebaseUid: z.string().min(1),
  idToken: z.string().min(1),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  oobCode: z.string().min(1),
  newPassword: z.string().min(8),
});

const VerifyEmailSchema = z.object({
  oobCode: z.string().min(1),
});

const VerifyPhoneSchema = z.object({
  phone: z.string().min(7),
  verificationCode: z.string().length(6),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ─── Routes ──────────────────────────────────────────────

// Public auth routes — stricter rate limit
router.post('/register', authRateLimit, validateBody(RegisterSchema), AuthController.register);
router.post('/login', authRateLimit, validateBody(LoginSchema), AuthController.login);
router.post('/forgot-password', authRateLimit, validateBody(ForgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authRateLimit, validateBody(ResetPasswordSchema), AuthController.resetPassword);
router.post('/verify-email', authRateLimit, validateBody(VerifyEmailSchema), AuthController.verifyEmail);
router.post('/verify-phone', authRateLimit, validateBody(VerifyPhoneSchema), AuthController.verifyPhone);
router.post('/refresh-token', authRateLimit, validateBody(RefreshTokenSchema), AuthController.refreshToken);

// Protected — requires valid Firebase JWT
router.post('/logout', authMiddleware, AuthController.logout);

export default router;
