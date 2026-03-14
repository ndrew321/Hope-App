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
exports.FirebaseService = void 0;
exports.initializeFirebase = initializeFirebase;
const admin = __importStar(require("firebase-admin"));
const logger_1 = require("../utils/logger");
let initialized = false;
function initializeFirebase() {
    if (initialized)
        return;
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
    }
    else {
        // Fallback: use Application Default Credentials (GCP / Cloud Run)
        admin.initializeApp({
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
    }
    initialized = true;
    logger_1.logger.info('Firebase Admin initialized');
}
exports.FirebaseService = {
    /**
     * Verify a Firebase ID token and return the decoded payload.
     */
    async verifyToken(idToken) {
        return admin.auth().verifyIdToken(idToken, true);
    },
    /**
     * Revoke all refresh tokens for a user (force logout all devices).
     */
    async revokeRefreshTokens(firebaseUid) {
        await admin.auth().revokeRefreshTokens(firebaseUid);
        logger_1.logger.info({ firebaseUid }, 'Firebase refresh tokens revoked');
    },
    /**
     * Generate a password reset link for a user.
     */
    async generatePasswordResetLink(email) {
        return admin.auth().generatePasswordResetLink(email);
    },
    /**
     * Send a verification email via Firebase.
     */
    async generateEmailVerificationLink(email) {
        return admin.auth().generateEmailVerificationLink(email);
    },
    /**
     * Delete a Firebase user account.
     */
    async deleteUser(firebaseUid) {
        await admin.auth().deleteUser(firebaseUid);
        logger_1.logger.info({ firebaseUid }, 'Firebase user deleted');
    },
    /**
     * Upload a buffer to Firebase Storage and return the public URL.
     */
    async uploadFile(opts) {
        const bucket = admin.storage().bucket();
        const file = bucket.file(opts.destination);
        await file.save(opts.buffer, { contentType: opts.contentType });
        await file.makePublic();
        return `https://storage.googleapis.com/${bucket.name}/${opts.destination}`;
    },
    /**
     * Delete a file from Firebase Storage by its storage path.
     */
    async deleteFile(storagePath) {
        const bucket = admin.storage().bucket();
        await bucket.file(storagePath).delete({ ignoreNotFound: true });
        logger_1.logger.info({ storagePath }, 'Firebase Storage file deleted');
    },
};
//# sourceMappingURL=FirebaseService.js.map