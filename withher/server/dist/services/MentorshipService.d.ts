export declare const MentorshipService: {
    /**
     * Start a new 30-day mentorship program.
     * Creates the program record and 4 weekly session stubs.
     */
    startProgram(matchId: string, menteeInitialGoal: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ProgramStatus;
        matchId: string;
        programNumber: number;
        startDate: Date;
        endDate: Date | null;
        menteeInitialGoal: string | null;
        menteeReflection: string | null;
        mentorFeedback: string | null;
        ratingByMentee: number | null;
        ratingByMentor: number | null;
        completionPercentage: number;
    }>;
    /**
     * Recalculate and persist completion percentage from completed session count.
     */
    updateCompletionPercentage(programId: string): Promise<void>;
    /**
     * Complete a program — prompt both users for ratings and renewal.
     */
    completeProgram(programId: string): Promise<void>;
    /**
     * Process early-completion check for all active programs.
     * Called daily by the job scheduler.
     */
    processActiveProgramMilestones(): Promise<void>;
};
//# sourceMappingURL=MentorshipService.d.ts.map