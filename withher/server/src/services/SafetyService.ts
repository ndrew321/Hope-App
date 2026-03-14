import { prisma } from '../utils/prisma';
import { SafetyError } from '../utils/errors';
import { EmailService } from './EmailService';
import { logger } from '../utils/logger';

// ─── Content moderation patterns ────────────────────────

/**
 * Matches phone numbers in common formats.
 * Intentionally broad to catch obfuscated variants.
 */
const PHONE_RE = /(\+?[\d\s\-().]{7,})/g;

/**
 * Matches email addresses.
 */
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

/**
 * Matches external URLs. Whitelisted schemes only.
 */
const URL_RE = /https?:\/\/[^\s]+/gi;

/**
 * Harmful keywords that trigger a moderation flag.
 * Keep this list in a database table in production.
 */
const HARMFUL_KEYWORDS = [
  'venmo', 'cashapp', 'zelle', 'paypal', 'bitcoin', 'send money',
  'nsfw', 'explicit', 'nude', 'naked',
];

// Auto-suspend threshold
const REPORT_SUSPEND_THRESHOLD = 3;

export const SafetyService = {
  // ─── Message scanning ──────────────────────────────────

  /**
   * Scan a message for policy violations before delivery.
   * Throws SafetyError if the message should be blocked.
   * Logs flagged messages to the moderation queue.
   */
  async scanMessage(content: string, senderId: string, recipientId: string): Promise<void> {
    const violations: string[] = [];

    if (PHONE_RE.test(content)) violations.push('phone_number');
    if (EMAIL_RE.test(content)) violations.push('email_address');
    if (URL_RE.test(content)) violations.push('external_url');

    const lowerContent = content.toLowerCase();
    const flaggedKeyword = HARMFUL_KEYWORDS.find((kw) => lowerContent.includes(kw));
    if (flaggedKeyword) violations.push(`keyword:${flaggedKeyword}`);

    // Check if recipient is a minor — apply stricter rules
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { dateOfBirth: true },
    });
    if (recipient?.dateOfBirth) {
      const age = Math.floor((Date.now() - recipient.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      if (age < 18 && violations.length > 0) {
        logger.warn({ senderId, recipientId, violations }, 'Message to minor flagged');
        // Store in flagged messages queue (via message record)
        await prisma.message.updateMany({
          where: { senderId, recipientId, deletedAt: null },
          data: { isFlagged: true, flagReason: violations.join(', ') },
        });
        throw new SafetyError('This message contains content that cannot be sent to users under 18.');
      }
    }

    if (violations.length > 0) {
      logger.warn({ senderId, recipientId, violations }, 'Message flagged for moderation');
      throw new SafetyError(
        'Your message appears to contain personal contact information or restricted content. ' +
          'For your safety, please keep communication within the app.',
      );
    }
  },

  // ─── Report handling ───────────────────────────────────

  /**
   * Create a report record and apply automatic actions based on severity + report count.
   */
  async handleReport(params: {
    reportedByUserId: string;
    reportedUserId: string;
    reportType: string;
    description: string;
    evidenceUrls: string[];
    severityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }): Promise<void> {
    await prisma.report.create({
      data: {
        reportedByUserId: params.reportedByUserId,
        reportedUserId: params.reportedUserId,
        reportType: params.reportType,
        description: params.description,
        evidenceUrls: params.evidenceUrls,
        severityLevel: params.severityLevel,
        status: 'PENDING',
      },
    });

    // Count active reports against this user
    const reportCount = await prisma.report.count({
      where: {
        reportedUserId: params.reportedUserId,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
    });

    // Immediate suspension for CRITICAL reports
    if (params.severityLevel === 'CRITICAL') {
      await prisma.user.update({
        where: { id: params.reportedUserId },
        data: { isVerified: false, verificationStatus: 'SUSPENDED_CRITICAL' },
      });
      await EmailService.sendModerationAlert({
        reportedUserId: params.reportedUserId,
        reporterId: params.reportedByUserId,
        severity: params.severityLevel,
        reason: params.description,
        action: 'AUTO_SUSPEND_CRITICAL',
      });
      logger.warn({ reportedUserId: params.reportedUserId }, 'User suspended due to CRITICAL report');
    }

    // Auto-suspend after threshold
    if (reportCount >= REPORT_SUSPEND_THRESHOLD && params.severityLevel !== 'CRITICAL') {
      await prisma.user.update({
        where: { id: params.reportedUserId },
        data: { isVerified: false, verificationStatus: 'SUSPENDED_PENDING_REVIEW' },
      });
      logger.warn({ reportedUserId: params.reportedUserId, reportCount }, 'User auto-suspended after threshold reports');
    }

    // Email moderation team for HIGH/CRITICAL
    if (params.severityLevel === 'HIGH' || params.severityLevel === 'CRITICAL') {
      await EmailService.sendModerationAlert({
        reportedUserId: params.reportedUserId,
        reporterId: params.reportedByUserId,
        severity: params.severityLevel,
        reason: params.description,
        action: 'MODERATION_REVIEW',
      });
    }
  },

  // ─── Background check verification ────────────────────

  /**
   * Returns true if the mentor has a verified background check.
   */
  async getMentorVerificationStatus(mentorId: string): Promise<boolean> {
    const verification = await prisma.verification.findUnique({
      where: {
        userId_verificationType: { userId: mentorId, verificationType: 'BACKGROUND_CHECK' },
      },
      select: { status: true },
    });
    return verification?.status === 'VERIFIED';
  },

  // ─── Parental consent ──────────────────────────────────

  /**
   * Returns true if the user has an approved parental consent record.
   */
  async hasParentalConsent(userId: string): Promise<boolean> {
    const consent = await prisma.parentalConsent.findUnique({
      where: { childUserId: userId },
      select: { consentGiven: true },
    });
    return consent?.consentGiven === true;
  },
};
