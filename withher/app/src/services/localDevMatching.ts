import { Platform } from 'react-native';
import type { AppUser, MentorshipRole, SwipeCandidate } from '../types';

const LOCAL_USERS_KEY = 'withher.localUsers';
const LOCAL_SWIPES_KEY = 'withher.localSwipes';

function canUseWebStorage(): boolean {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseWebStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!canUseWebStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures in local fallback mode.
  }
}

function roleOf(user: AppUser): MentorshipRole {
  return user.profile?.mentorshipRole ?? 'BOTH';
}

function supportsRole(current: MentorshipRole, candidate: MentorshipRole): boolean {
  if (current === 'BOTH') return true;
  if (current === 'MENTEE') return candidate === 'MENTOR' || candidate === 'BOTH';
  return candidate === 'MENTEE' || candidate === 'BOTH';
}

function isCompatible(a: MentorshipRole, b: MentorshipRole): boolean {
  return supportsRole(a, b) && supportsRole(b, a);
}

function toCandidate(user: AppUser): SwipeCandidate {
  return {
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
    bio: user.profile?.bio ?? null,
    location: user.profile?.location ?? null,
    careerLevel: user.profile?.careerLevel ?? 'HIGH_SCHOOL',
    currentTeam: user.profile?.currentTeam ?? null,
    position: user.profile?.position ?? null,
    yearsExperience: user.profile?.yearsExperience ?? null,
    achievements: user.profile?.achievements ?? [],
    goals: user.profile?.goals ?? [],
    mentorshipRole: user.profile?.mentorshipRole ?? 'BOTH',
    compatibilityScore: 0.76,
    isVerified: user.isVerified,
  };
}

function fallbackDemoCandidate(currentRole: MentorshipRole): SwipeCandidate {
  const mentorshipRole: MentorshipRole = currentRole === 'MENTEE' ? 'MENTOR' : 'MENTEE';
  return {
    userId: `demo-${mentorshipRole.toLowerCase()}`,
    firstName: mentorshipRole === 'MENTOR' ? 'Avery' : 'Jordan',
    lastName: mentorshipRole === 'MENTOR' ? 'Lopez' : 'Kim',
    profilePhotoUrl: null,
    bio:
      mentorshipRole === 'MENTOR'
        ? 'Former college captain helping players with transitions and confidence.'
        : 'Developing attacking player focused on technical growth and consistency.',
    location: 'Local',
    careerLevel: mentorshipRole === 'MENTOR' ? 'COLLEGE' : 'HIGH_SCHOOL',
    currentTeam: mentorshipRole === 'MENTOR' ? 'City FC Alumni' : 'Riverside United',
    position: mentorshipRole === 'MENTOR' ? 'Central Midfielder' : 'Striker',
    yearsExperience: mentorshipRole === 'MENTOR' ? 9 : 4,
    achievements: mentorshipRole === 'MENTOR' ? ['Conference champion'] : ['Varsity starter'],
    goals: ['Build confidence', 'Improve game IQ'],
    mentorshipRole,
    compatibilityScore: 0.82,
    isVerified: true,
  };
}

export const localDevMatching = {
  upsertUser(user: AppUser): void {
    const users = readJson<AppUser[]>(LOCAL_USERS_KEY, []);
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) users.push(user);
    else users[idx] = { ...users[idx], ...user };
    writeJson(LOCAL_USERS_KEY, users);
  },

  getCandidatesFor(currentUser: AppUser): SwipeCandidate[] {
    const users = readJson<AppUser[]>(LOCAL_USERS_KEY, []);
    const swipes = readJson<Record<string, string[]>>(LOCAL_SWIPES_KEY, {});
    const seen = new Set(swipes[currentUser.id] ?? []);
    const currentRole = roleOf(currentUser);

    const candidates = users
      .filter((u) => u.id !== currentUser.id)
      .filter((u) => isCompatible(currentRole, roleOf(u)))
      .filter((u) => !seen.has(u.id))
      .map(toCandidate);

    if (candidates.length > 0) return candidates;
    return [fallbackDemoCandidate(currentRole)];
  },

  recordSwipe(currentUserId: string, targetUserId: string): void {
    const swipes = readJson<Record<string, string[]>>(LOCAL_SWIPES_KEY, {});
    const existing = new Set(swipes[currentUserId] ?? []);
    existing.add(targetUserId);
    swipes[currentUserId] = Array.from(existing);
    writeJson(LOCAL_SWIPES_KEY, swipes);
  },

  getUser(uid: string): AppUser | null {
    const users = readJson<AppUser[]>(LOCAL_USERS_KEY, []);
    return users.find((u) => u.id === uid || u.firebaseUid === uid) ?? null;
  },
};
