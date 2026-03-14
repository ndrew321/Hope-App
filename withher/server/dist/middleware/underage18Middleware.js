"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.underage18Middleware = underage18Middleware;
exports.requireAdult = requireAdult;
const errors_1 = require("../utils/errors");
/**
 * Flag requests originating from under-18 users.
 * Must run AFTER authMiddleware (which computes req.isUnderAge).
 *
 * Usage: add this middleware to routes that need additional safeguards
 * for minors — the downstream controller or service reads req.isUnderAge
 * to apply stricter content filters.
 */
function underage18Middleware(_req, _res, next) {
    // req.isUnderAge is set by authMiddleware when dateOfBirth is known
    // No additional action here — controllers check req.isUnderAge
    next();
}
/**
 * Hard-block: reject the request if the authenticated user is under 18.
 * Use this on any route that must never be accessible to minors
 * (e.g., mentor self-application without parental consent).
 */
function requireAdult(req, _res, next) {
    if (req.isUnderAge === true) {
        return next(new errors_1.AgeRestrictionError('This action requires you to be 18 or older'));
    }
    next();
}
//# sourceMappingURL=underage18Middleware.js.map