import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';

let initialized = false;

export function initializeFirebase(): void {
  if (initialized) return;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount) as admin.ServiceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  } else {
    // Fallback: use Application Default Credentials (GCP / Cloud Run)
    admin.initializeApp({
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }

  initialized = true;
  logger.info('Firebase Admin initialized');
}

export const FirebaseService = {
  /**
   * Verify a Firebase ID token and return the decoded payload.
   */
  async verifyToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return admin.auth().verifyIdToken(idToken, true);
  },

  /**
   * Revoke all refresh tokens for a user (force logout all devices).
   */
  async revokeRefreshTokens(firebaseUid: string): Promise<void> {
    await admin.auth().revokeRefreshTokens(firebaseUid);
    logger.info({ firebaseUid }, 'Firebase refresh tokens revoked');
  },

  /**
   * Generate a password reset link for a user.
   */
  async generatePasswordResetLink(email: string): Promise<string> {
    return admin.auth().generatePasswordResetLink(email);
  },

  /**
   * Send a verification email via Firebase.
   */
  async generateEmailVerificationLink(email: string): Promise<string> {
    return admin.auth().generateEmailVerificationLink(email);
  },

  /**
   * Delete a Firebase user account.
   */
  async deleteUser(firebaseUid: string): Promise<void> {
    await admin.auth().deleteUser(firebaseUid);
    logger.info({ firebaseUid }, 'Firebase user deleted');
  },

  /**
   * Upload a buffer to Firebase Storage and return the public URL.
   */
  async uploadFile(opts: {
    buffer: Buffer;
    destination: string;
    contentType: string;
  }): Promise<string> {
    const bucket = admin.storage().bucket();
    const file = bucket.file(opts.destination);
    await file.save(opts.buffer, { contentType: opts.contentType });
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${opts.destination}`;
  },

  /**
   * Delete a file from Firebase Storage by its storage path.
   */
  async deleteFile(storagePath: string): Promise<void> {
    const bucket = admin.storage().bucket();
    await bucket.file(storagePath).delete({ ignoreNotFound: true });
    logger.info({ storagePath }, 'Firebase Storage file deleted');
  },
};
