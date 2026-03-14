import rateLimit from 'express-rate-limit';

/**
 * General API rate limit: 100 requests per 15 minutes per IP.
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Strict auth rate limit: 5 requests per 15 minutes per IP.
 * Applied to login, register, password reset, and OTP routes.
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again in 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Swipe rate limit: 200 swipes per hour.
 * Prevents automated scraping of the discover feed.
 */
export const swipeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Swipe limit reached. Please come back later.',
    code: 'SWIPE_RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Message rate limit: 60 messages per minute.
 */
export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Message rate limit exceeded.',
    code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
  },
});
