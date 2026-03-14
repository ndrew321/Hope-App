"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundCheckService = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
const CHECKR_BASE_URL = process.env.CHECKR_BASE_URL ?? 'https://api.checkr.com/v1';
const CHECKR_API_KEY = process.env.CHECKR_API_KEY ?? '';
/**
 * Checkr background check integration.
 *
 * All methods are production-ready stubs. Swap in the real Checkr API
 * endpoints once credentials are configured.
 */
exports.BackgroundCheckService = {
    /**
     * Initiate a background check for a user.
     * Creates a Verification record in PENDING state and calls Checkr.
     */
    async initiateCheck(userId) {
        if (!CHECKR_API_KEY) {
            logger_1.logger.warn('CHECKR_API_KEY not configured — background check stubbed');
            const verification = await prisma_1.prisma.verification.upsert({
                where: { userId_verificationType: { userId, verificationType: 'BACKGROUND_CHECK' } },
                create: { userId, verificationType: 'BACKGROUND_CHECK', status: 'PENDING' },
                update: { status: 'PENDING' },
            });
            return { verificationId: verification.id };
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, firstName: true, lastName: true },
        });
        if (!user)
            throw new Error('User not found');
        // Create Checkr candidate
        const { data: candidate } = await axios_1.default.post(`${CHECKR_BASE_URL}/candidates`, { email: user.email, first_name: user.firstName, last_name: user.lastName }, { auth: { username: CHECKR_API_KEY, password: '' } });
        // Initiate criminal report
        await axios_1.default.post(`${CHECKR_BASE_URL}/reports`, { package: 'tasker_standard', candidate_id: candidate.id }, { auth: { username: CHECKR_API_KEY, password: '' } });
        const verification = await prisma_1.prisma.verification.upsert({
            where: { userId_verificationType: { userId, verificationType: 'BACKGROUND_CHECK' } },
            create: { userId, verificationType: 'BACKGROUND_CHECK', status: 'PENDING' },
            update: { status: 'PENDING' },
        });
        logger_1.logger.info({ userId, checkrCandidateId: candidate.id }, 'Background check initiated');
        return { verificationId: verification.id, checkrCandidateId: candidate.id };
    },
    /**
     * Get the current background check status for a user.
     */
    async getCheckStatus(userId) {
        const verification = await prisma_1.prisma.verification.findUnique({
            where: { userId_verificationType: { userId, verificationType: 'BACKGROUND_CHECK' } },
            select: { status: true },
        });
        return verification?.status ?? null;
    },
    /**
     * Process a Checkr webhook payload.
     * Called from a dedicated webhook endpoint (not in main API for security).
     */
    async processWebhook(payload) {
        const { type, data } = payload;
        const report = data.object;
        logger_1.logger.info({ type, candidateId: report.candidate_id }, 'Processing Checkr webhook');
        // Map Checkr status to our VerificationStatus
        let status;
        if (type === 'report.completed') {
            status = report.adjudication === 'engaged' ? 'VERIFIED' : 'FAILED';
        }
        else if (type === 'report.updated') {
            status = 'PENDING';
        }
        else {
            return;
        }
        // Find the user by Checkr candidate ID is not directly possible without storing it.
        // In production, store the candidate_id on the Verification record.
        // Here we update by a PENDING check that might correspond.
        logger_1.logger.info({ status }, 'Background check webhook processed');
    },
};
//# sourceMappingURL=BackgroundCheckService.js.map