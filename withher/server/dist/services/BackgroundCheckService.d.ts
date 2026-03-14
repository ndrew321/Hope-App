/**
 * Checkr background check integration.
 *
 * All methods are production-ready stubs. Swap in the real Checkr API
 * endpoints once credentials are configured.
 */
export declare const BackgroundCheckService: {
    /**
     * Initiate a background check for a user.
     * Creates a Verification record in PENDING state and calls Checkr.
     */
    initiateCheck(userId: string): Promise<{
        verificationId: string;
        checkrCandidateId?: string;
    }>;
    /**
     * Get the current background check status for a user.
     */
    getCheckStatus(userId: string): Promise<string | null>;
    /**
     * Process a Checkr webhook payload.
     * Called from a dedicated webhook endpoint (not in main API for security).
     */
    processWebhook(payload: {
        type: string;
        data: {
            object: {
                candidate_id: string;
                status: string;
                adjudication?: string;
            };
        };
    }): Promise<void>;
};
//# sourceMappingURL=BackgroundCheckService.d.ts.map