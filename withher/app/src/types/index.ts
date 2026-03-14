// ─── Enums mirrored from server/prisma/schema.prisma ─────────────────────────

export type CareerLevel = 'YOUTH' | 'HIGH_SCHOOL' | 'COLLEGE' | 'PROFESSIONAL' | 'ALUM';
export type MentorshipRole = 'MENTOR' | 'MENTEE' | 'BOTH';
export type MatchStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DECLINED';
export type ProgramStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type SessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type SessionType = 'VIDEO' | 'AUDIO' | 'ASYNC_MESSAGE';
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
export type PostStatus = 'PUBLISHED' | 'REMOVED' | 'FLAGGED';
export type EventType = 'WEBINAR' | 'WORKSHOP' | 'Q_AND_A' | 'CAMP' | 'TRYOUT' | 'OTHER';
export type ResourceType = 'ARTICLE' | 'VIDEO' | 'PODCAST' | 'GUIDE' | 'TOOL';
export type VerificationStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthState {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  idToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface FirebaseUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
}

// ─── User / Profile ───────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  profilePhotoUrl?: string | null;
  isActive: boolean;
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
  profile?: UserProfile;
  preferences?: UserPreferences;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string | null;
  location?: string | null;
  careerLevel: CareerLevel;
  currentTeam?: string | null;
  position?: string | null;
  yearsExperience?: number | null;
  achievements?: string[];
  goals?: string[];
  mentorshipRole: MentorshipRole;
  completenessScore: number;
  goalsEmbedding?: number[] | null;
}

export interface UserPreferences {
  id: string;
  userId: string;
  preferredRoles: MentorshipRole[];
  preferredCareerLevels: CareerLevel[];
  maxDistance?: number | null;
  locationFlexible: boolean;
  preferBipoc: boolean;
  preferLgbtq: boolean;
  availabilityWeekdays: boolean;
  availabilityWeekends: boolean;
  availabilityMornings: boolean;
  availabilityAfternoons: boolean;
  availabilityEvenings: boolean;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export interface Match {
  id: string;
  mentorId: string;
  menteeId: string;
  status: MatchStatus;
  compatibilityScore?: number | null;
  confirmedAt?: string | null;
  createdAt: string;
  mentor?: AppUser;
  mentee?: AppUser;
  program?: MentorshipProgram | null;
}

export interface SwipeCandidate {
  userId: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  careerLevel: CareerLevel;
  currentTeam?: string | null;
  position?: string | null;
  yearsExperience?: number | null;
  achievements: string[];
  goals: string[];
  mentorshipRole: MentorshipRole;
  compatibilityScore: number;
  isVerified: boolean;
}

// ─── Mentorship ───────────────────────────────────────────────────────────────

export interface MentorshipProgram {
  id: string;
  matchId: string;
  mentorId: string;
  menteeId: string;
  status: ProgramStatus;
  startDate: string;
  endDate: string;
  completionPercentage: number;
  createdAt: string;
  sessions?: Session[];
}

export interface Session {
  id: string;
  programId: string;
  scheduledAt?: string | null;
  duration?: number | null;
  type: SessionType;
  status: SessionStatus;
  notes?: SessionNotes | null;
}

export interface SessionNotes {
  id: string;
  sessionId: string;
  topicsDiscussed: string[];
  goalsSet: string[];
  challenges: string[];
  nextSteps: string[];
  mentorRating?: number | null;
  menteeRating?: number | null;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface Conversation {
  matchId: string;
  partner: AppUser;
  lastMessage?: Message | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content?: string | null;
  mediaUrl?: string | null;
  type: MessageType;
  isRead: boolean;
  isFlagged: boolean;
  deletedAt?: string | null;
  createdAt: string;
}

// ─── Community ────────────────────────────────────────────────────────────────

export interface ForumPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  viewCount: number;
  status: PostStatus;
  isPinned: boolean;
  createdAt: string;
  author?: AppUser;
  comments?: ForumComment[];
  userVote?: 'UP' | 'DOWN' | null;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  upvotes: number;
  createdAt: string;
  author?: AppUser;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  type: EventType;
  startDate: string;
  endDate: string;
  location?: string | null;
  isVirtual: boolean;
  meetingLink?: string | null;
  maxAttendees?: number | null;
  attendeeCount: number;
  imageUrl?: string | null;
  isRegistered?: boolean;
}

// ─── Resources ────────────────────────────────────────────────────────────────

export interface Resource {
  id: string;
  authorId: string;
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  tags: string[];
  viewCount: number;
  targetCareerLevels: CareerLevel[];
  isSaved?: boolean;
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string | null;
  category: string;
  criteria: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badge: Badge;
  earnedAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  EmailVerification: { email: string };
};

export type OnboardingStackParamList = {
  OnboardingRole: undefined;
  OnboardingCareerLevel: undefined;
  OnboardingPosition: undefined;
  OnboardingGoals: undefined;
  OnboardingAvailability: undefined;
  OnboardingPreferences: undefined;
};

export type MainTabParamList = {
  Discover: undefined;
  Matches: undefined;
  Messages: undefined;
  Community: undefined;
  Profile: undefined;
};

export type DiscoverStackParamList = {
  DiscoverFeed: undefined;
  ProfileView: { userId: string };
};

export type MatchesStackParamList = {
  MatchList: undefined;
  ProgramDetail: { programId: string };
  SessionDetail: { sessionId: string };
};

export type MessagesStackParamList = {
  ConversationList: undefined;
  Chat: { matchId: string; partnerName: string };
};

export type CommunityStackParamList = {
  Forum: undefined;
  PostDetail: { postId: string };
  CreatePost: undefined;
  EventList: undefined;
  EventDetail: { eventId: string };
  ResourceList: undefined;
  ResourceDetail: { resourceId: string };
};

export type ProfileStackParamList = {
  MyProfile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Notifications: undefined;
  Badges: undefined;
  Leaderboard: undefined;
  Safety: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};
