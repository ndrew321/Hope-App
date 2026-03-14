/**
 * General API rate limit: 100 requests per 15 minutes per IP.
 */
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict auth rate limit: 5 requests per 15 minutes per IP.
 * Applied to login, register, password reset, and OTP routes.
 */
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Swipe rate limit: 200 swipes per hour.
 * Prevents automated scraping of the discover feed.
 */
export declare const swipeRateLimit: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Message rate limit: 60 messages per minute.
 */
export declare const messageRateLimit: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimitMiddleware.d.ts.map