export declare const BadgeService: {
    /**
     * Check badge eligibility after a session is completed.
     * Triggers: MENTOR_STARTER, FIRST_SESSION, CONSISTENT_MENTOR
     */
    checkAfterSessionCompleted(userId: string): Promise<void>;
    /**
     * Check badge eligibility after a forum post is created.
     * Triggers: COMMUNITY_VOICE
     */
    checkAfterPostCreated(userId: string): Promise<void>;
    /**
     * Check badge eligibility after profile is updated.
     * Triggers: PROFILE_MASTER
     */
    checkAfterProfileUpdated(userId: string): Promise<void>;
    /**
     * Check badge eligibility after attending an event.
     * Triggers: EVENT_REGULAR
     */
    checkAfterEventAttended(userId: string): Promise<void>;
    /**
     * Check login streak badges.
     */
    checkAfterLogin(userId: string): Promise<void>;
};
//# sourceMappingURL=BadgeService.d.ts.map