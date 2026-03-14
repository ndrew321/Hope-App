import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM_ADDRESS = `with/her <${process.env.SMTP_FROM ?? 'noreply@withher.app'}>`;
const MODERATION_EMAIL = process.env.MODERATION_EMAIL ?? 'moderation@withher.app';

async function send(to: string, subject: string, html: string): Promise<void> {
  try {
    await transporter.sendMail({ from: FROM_ADDRESS, to, subject, html });
    logger.info({ to, subject }, 'Email sent');
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
  }
}

export const EmailService = {
  async sendModerationAlert(opts: {
    reportedUserId: string;
    reporterId: string;
    reason: string;
    severity: string;
    action: string;
  }): Promise<void> {
    const subject = `[with/her] ${opts.severity} Safety Report — Action: ${opts.action}`;
    const html = `
      <h2>Safety Report Alert</h2>
      <p><strong>Severity:</strong> ${opts.severity}</p>
      <p><strong>Reported User ID:</strong> ${opts.reportedUserId}</p>
      <p><strong>Reporter ID:</strong> ${opts.reporterId}</p>
      <p><strong>Reason:</strong> ${opts.reason}</p>
      <p><strong>Action Taken:</strong> ${opts.action}</p>
      <p><small>Timestamp: ${new Date().toISOString()}</small></p>
    `;
    await send(MODERATION_EMAIL, subject, html);
  },

  async sendParentalConsentEmail(opts: {
    parentEmail: string;
    childName: string;
    consentToken: string;
  }): Promise<void> {
    const consentUrl = `${process.env.APP_URL ?? 'https://withher.app'}/consent?token=${encodeURIComponent(opts.consentToken)}`;
    const subject = 'Parental Consent Required — with/her';
    const html = `
      <h2>Parental Consent Request</h2>
      <p>Your child, <strong>${opts.childName}</strong>, has signed up for the with/her mentorship platform.</p>
      <p>with/her connects young female soccer players with experienced mentors in a safe, monitored environment.</p>
      <p>Please review our <a href="${process.env.APP_URL ?? 'https://withher.app'}/privacy">privacy policy</a> and click below to grant consent:</p>
      <p><a href="${consentUrl}" style="background:#7C4DFF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Grant Consent</a></p>
      <p>If you did not expect this email, please ignore it or contact us at support@withher.app.</p>
    `;
    await send(opts.parentEmail, subject, html);
  },

  async sendProgramWelcomeEmail(opts: {
    mentorEmail: string;
    menteeEmail: string;
    mentorName: string;
    menteeName: string;
    programId: string;
  }): Promise<void> {
    const dashboardUrl = `${process.env.APP_URL ?? 'https://withher.app'}/programs/${opts.programId}`;
    const mentorHtml = `
      <h2>Your Mentorship Program Has Started!</h2>
      <p>Hi ${opts.mentorName},</p>
      <p>You have been matched as a mentor with <strong>${opts.menteeName}</strong> on with/her.</p>
      <p>Your 30-day program has been set up with 4 weekly sessions. Check the app or <a href="${dashboardUrl}">view your program dashboard</a>.</p>
      <p>Thank you for giving back to the game!</p>
    `;
    const menteeHtml = `
      <h2>Your Mentorship Program Has Started!</h2>
      <p>Hi ${opts.menteeName},</p>
      <p>Exciting news — <strong>${opts.mentorName}</strong> is now your mentor on with/her!</p>
      <p>Your 30-day program includes 4 weekly sessions. <a href="${dashboardUrl}">View your program dashboard</a> to get started.</p>
      <p>Good luck and keep playing!</p>
    `;
    await Promise.all([
      send(opts.mentorEmail, 'Your with/her Mentorship Program Has Started', mentorHtml),
      send(opts.menteeEmail, 'Your with/her Mentorship Program Has Started', menteeHtml),
    ]);
  },

  async sendSessionReminder(opts: {
    recipientEmail: string;
    recipientName: string;
    partnerName: string;
    sessionDate: Date;
    hoursUntil: number;
  }): Promise<void> {
    const subject = `Reminder: Session with ${opts.partnerName} in ${opts.hoursUntil} hour${opts.hoursUntil !== 1 ? 's' : ''}`;
    const html = `
      <h2>Session Reminder</h2>
      <p>Hi ${opts.recipientName},</p>
      <p>You have a mentorship session with <strong>${opts.partnerName}</strong> scheduled for
        <strong>${opts.sessionDate.toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' })} UTC</strong>.
      </p>
      <p>Open the with/her app to prepare your notes and join the session.</p>
    `;
    await send(opts.recipientEmail, subject, html);
  },

  async sendWeeklyDigest(opts: {
    recipientEmail: string;
    recipientName: string;
    newMatches: number;
    upcomingSessions: number;
    newBadges: string[];
  }): Promise<void> {
    const subject = 'Your with/her Weekly Update';
    const badgesHtml =
      opts.newBadges.length > 0
        ? `<p>🏆 New badges earned: ${opts.newBadges.map((b) => `<strong>${b}</strong>`).join(', ')}</p>`
        : '';
    const html = `
      <h2>Your Weekly with/her Update</h2>
      <p>Hi ${opts.recipientName}, here's what happened this week:</p>
      <ul>
        <li>${opts.newMatches} new match${opts.newMatches !== 1 ? 'es' : ''}</li>
        <li>${opts.upcomingSessions} upcoming session${opts.upcomingSessions !== 1 ? 's' : ''}</li>
      </ul>
      ${badgesHtml}
      <p>Keep up the great work! Open the app to see your full updates.</p>
    `;
    await send(opts.recipientEmail, subject, html);
  },

  async sendPasswordResetEmail(opts: {
    recipientEmail: string;
    resetLink: string;
  }): Promise<void> {
    const subject = 'Reset Your with/her Password';
    const html = `
      <h2>Password Reset</h2>
      <p>We received a request to reset your with/her password.</p>
      <p><a href="${opts.resetLink}" style="background:#7C4DFF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password</a></p>
      <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
    `;
    await send(opts.recipientEmail, subject, html);
  },

  async sendAccountSuspensionEmail(opts: {
    recipientEmail: string;
    recipientName: string;
    reason: string;
  }): Promise<void> {
    const subject = 'Your with/her Account Has Been Suspended';
    const html = `
      <h2>Account Suspended</h2>
      <p>Hi ${opts.recipientName},</p>
      <p>Your with/her account has been suspended due to a violation of our community guidelines.</p>
      <p><strong>Reason:</strong> ${opts.reason}</p>
      <p>If you believe this is a mistake, please contact us at support@withher.app.</p>
    `;
    await send(opts.recipientEmail, subject, html);
  },
};
