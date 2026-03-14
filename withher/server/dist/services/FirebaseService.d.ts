import * as admin from 'firebase-admin';
export declare function initializeFirebase(): void;
export declare const FirebaseService: {
    /**
     * Verify a Firebase ID token and return the decoded payload.
     */
    verifyToken(idToken: string): Promise<admin.auth.DecodedIdToken>;
    /**
     * Revoke all refresh tokens for a user (force logout all devices).
     */
    revokeRefreshTokens(firebaseUid: string): Promise<void>;
    /**
     * Generate a password reset link for a user.
     */
    generatePasswordResetLink(email: string): Promise<string>;
    /**
     * Send a verification email via Firebase.
     */
    generateEmailVerificationLink(email: string): Promise<string>;
    /**
     * Delete a Firebase user account.
     */
    deleteUser(firebaseUid: string): Promise<void>;
    /**
     * Upload a buffer to Firebase Storage and return the public URL.
     */
    uploadFile(opts: {
        buffer: Buffer;
        destination: string;
        contentType: string;
    }): Promise<string>;
    /**
     * Delete a file from Firebase Storage by its storage path.
     */
    deleteFile(storagePath: string): Promise<void>;
};
//# sourceMappingURL=FirebaseService.d.ts.map