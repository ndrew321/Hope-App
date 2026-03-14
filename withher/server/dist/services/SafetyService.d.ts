export declare const SafetyService: {
    /**
     * Scan a message for policy violations before delivery.
     * Throws SafetyError if the message should be blocked.
     * Logs flagged messages to the moderation queue.
     */
    scanMessage(content: string, senderId: string, recipientId: string): Promise<void>;
    /**
     * Create a report record and apply automatic actions based on severity + report count.
     */
    handleReport(params: {
        reportedByUserId: string;
        reportedUserId: string;
        reportType: string;
        description: string;
        evidenceUrls: string[];
        severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    }): Promise<void>;
    /**
     * Returns true if the mentor has a verified background check.
     */
    getMentorVerificationStatus(mentorId: string): Promise<boolean>;
    /**
     * Returns true if the user has an approved parental consent record.
     */
    hasParentalConsent(userId: string): Promise<boolean>;
};
//# sourceMappingURL=SafetyService.d.ts.map