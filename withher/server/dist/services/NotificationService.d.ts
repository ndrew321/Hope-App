export declare const NotificationService: {
    /**
     * "You have a new match!" — sent to both mentor and mentee.
     */
    sendNewMatchNotification(mentorId: string, menteeId: string): Promise<void>;
    /**
     * "New message from [name]" — real-time message received.
     */
    sendNewMessageNotification(senderId: string, recipientId: string): Promise<void>;
    /**
     * Schedule 24h and 1h reminders before a session.
     */
    scheduleSessionReminder(sessionId: string, sessionDate: Date): Promise<void>;
    /**
     * "[Name] sent session notes" — after a session is logged.
     */
    sendSessionNotesNotification(recipientId: string, senderName: string): Promise<void>;
    /**
     * "You earned a badge: [badge name]!" — after badge is awarded.
     */
    sendBadgeEarnedNotification(userId: string, badgeName: string): Promise<void>;
    /**
     * "Your mentorship program ends in N days"
     */
    sendProgramEndingNotification(userId: string, daysLeft: number): Promise<void>;
};
//# sourceMappingURL=NotificationService.d.ts.map