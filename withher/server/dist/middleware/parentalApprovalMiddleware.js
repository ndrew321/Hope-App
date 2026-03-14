"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentalApprovalMiddleware = parentalApprovalMiddleware;
const prisma_1 = require("../utils/prisma");
const errors_1 = require("../utils/errors");
/**
 * Verify that an under-18 mentee has an approved parental consent record
 * before a match confirmation request is processed.
 *
 * Must run AFTER authMiddleware.
 *
 * If the user is 18+ this middleware is a no-op.
 * If the user is under 18 and no approved consent exists, the request is rejected.
 */
async function parentalApprovalMiddleware(req, _res, next) {
    try {
        if (!req.isUnderAge) {
            // Not a minor — pass straight through
            return next();
        }
        const consent = await prisma_1.prisma.parentalConsent.findUnique({
            where: { childUserId: req.userId },
            select: { consentGiven: true, signedDate: true },
        });
        if (!consent?.consentGiven) {
            return next(new errors_1.AgeRestrictionError('A parent or guardian must approve this action before you can proceed.'));
        }
        next();
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=parentalApprovalMiddleware.js.map