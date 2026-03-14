import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AppUser, UserProfile, UserPreferences, CareerLevel, MentorshipRole } from '../../types';
import { apiService } from '../../services/api';

interface UserState {
  profile: AppUser | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
};

type RootStateLike = {
  auth: {
    appUser: AppUser | null;
    firebaseUser: { uid: string } | null;
    idToken: string | null;
  };
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

function splitGoals(value: unknown): string[] {
  if (typeof value !== 'string' || value.trim().length === 0) return [];
  return value
    .split(/[\n,;]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .slice(0, 5);
}

function normalizeAppUser(raw: unknown, fallback?: { firebaseUid?: string }): AppUser {
  const user = (raw ?? {}) as Record<string, unknown>;
  const profile = (user.profile ?? {}) as Record<string, unknown>;
  const preferences = (user.preferences ?? {}) as Record<string, unknown>;

  const id = (typeof user.id === 'string' ? user.id : fallback?.firebaseUid) ?? '';
  const firebaseUid =
    (typeof user.firebaseUid === 'string' ? user.firebaseUid : fallback?.firebaseUid) ?? id;

  const positions = toStringArray(profile.positions);
  const clubsTeams = toStringArray(profile.clubsTeams);
  const mentorshipGoals = splitGoals(profile.mentorshipGoals);
  const careerGoals = splitGoals(profile.careerGoals);

  return {
    id,
    firebaseUid,
    email: typeof user.email === 'string' ? user.email : '',
    firstName: typeof user.firstName === 'string' ? user.firstName : 'Player',
    lastName: typeof user.lastName === 'string' ? user.lastName : '',
    dateOfBirth: typeof user.dateOfBirth === 'string' ? user.dateOfBirth : '2000-01-01',
    profilePhotoUrl:
      typeof user.profilePhotoUrl === 'string' || user.profilePhotoUrl === null
        ? (user.profilePhotoUrl as string | null)
        : null,
    isActive: typeof user.deletedAt !== 'string',
    isVerified: Boolean(user.isVerified),
    isSuspended: String(user.verificationStatus ?? '').toUpperCase().includes('SUSPENDED'),
    createdAt:
      typeof user.createdAt === 'string' ? user.createdAt : new Date().toISOString(),
    profile: {
      id: typeof profile.id === 'string' ? profile.id : `profile-${id}`,
      userId: typeof profile.userId === 'string' ? profile.userId : id,
      bio:
        typeof user.bio === 'string'
          ? user.bio
          : (typeof profile.bio === 'string' ? profile.bio : null),
      location:
        typeof user.location === 'string'
          ? user.location
          : (typeof profile.location === 'string' ? profile.location : null),
      careerLevel:
        (profile.careerLevel as CareerLevel) ??
        (profile.currentLevel as CareerLevel) ??
        'HIGH_SCHOOL',
      currentTeam:
        typeof profile.currentTeam === 'string'
          ? profile.currentTeam
          : (clubsTeams[0] ?? null),
      position:
        typeof profile.position === 'string' ? profile.position : (positions[0] ?? null),
      yearsExperience:
        typeof profile.yearsExperience === 'number' ? profile.yearsExperience : null,
      achievements: toStringArray(profile.achievements),
      goals:
        toStringArray(profile.goals).length > 0
          ? toStringArray(profile.goals)
          : [...mentorshipGoals, ...careerGoals].slice(0, 5),
      mentorshipRole:
        (profile.mentorshipRole as MentorshipRole) ?? 'BOTH',
      completenessScore:
        (typeof profile.completenessScore === 'number' ? profile.completenessScore : undefined) ??
        (typeof profile.profileCompletenessScore === 'number'
          ? profile.profileCompletenessScore
          : 0),
      goalsEmbedding: Array.isArray(profile.goalsEmbedding)
        ? (profile.goalsEmbedding as number[])
        : null,
    },
    preferences:
      Object.keys(preferences).length > 0
        ? {
            id:
              typeof preferences.id === 'string'
                ? preferences.id
                : `prefs-${id}`,
            userId:
              typeof preferences.userId === 'string' ? preferences.userId : id,
            preferredRoles: ['MENTOR', 'MENTEE', 'BOTH'],
            preferredCareerLevels: toStringArray(preferences.preferredMentorLevels) as UserPreferences['preferredCareerLevels'],
            maxDistance:
              typeof preferences.maxDistanceKm === 'number' ? preferences.maxDistanceKm : null,
            locationFlexible:
              typeof preferences.geographicPreference === 'string'
                ? preferences.geographicPreference.toLowerCase().includes('remote')
                : false,
            preferBipoc: Boolean(profile.bipocIdentification),
            preferLgbtq: Boolean(profile.lgbtqIdentification),
            availabilityWeekdays: false,
            availabilityWeekends: false,
            availabilityMornings: false,
            availabilityAfternoons: false,
            availabilityEvenings: false,
          }
        : undefined,
  };
}

function mapProfileUpdates(updates: Partial<UserProfile>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (updates.mentorshipRole) payload.mentorshipRole = updates.mentorshipRole;
  if (updates.careerLevel) payload.currentLevel = updates.careerLevel;
  if (typeof updates.position === 'string') payload.positions = [updates.position];
  if (typeof updates.currentTeam === 'string') payload.clubsTeams = [updates.currentTeam];
  if (typeof updates.yearsExperience === 'number') payload.yearsExperience = updates.yearsExperience;
  if (Array.isArray(updates.goals)) payload.mentorshipGoals = updates.goals.join(', ');
  if (typeof updates.bio === 'string') payload.mentorshipGoals = updates.bio;
  return payload;
}

function mapPreferenceUpdates(prefs: Partial<UserPreferences>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (typeof prefs.maxDistance === 'number') payload.maxDistanceKm = prefs.maxDistance;
  if (typeof prefs.locationFlexible === 'boolean') {
    payload.geographicPreference = prefs.locationFlexible ? 'REMOTE_OK' : 'LOCAL_ONLY';
  }

  // Map onboarding availability toggles to approximate weekly capacity.
  const availabilityKeys: Array<keyof UserPreferences> = [
    'availabilityWeekdays',
    'availabilityWeekends',
    'availabilityMornings',
    'availabilityAfternoons',
    'availabilityEvenings',
  ];
  const selectedCount = availabilityKeys.reduce((acc, key) => acc + (prefs[key] ? 1 : 0), 0);
  if (selectedCount > 0) payload.availabilityHoursPerWeek = Math.max(2, selectedCount * 2);
  return payload;
}

export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrent',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootStateLike;
      const appUserId = state.auth.appUser?.id;
      const firebaseUid = state.auth.firebaseUser?.uid;
      const idToken = state.auth.idToken;

      if (appUserId) {
        const fullProfile = await apiService.get<unknown>(`/users/${appUserId}/full-profile`);
        return normalizeAppUser(fullProfile, { firebaseUid });
      }

      if (firebaseUid && idToken) {
        const loginData = await apiService.post<unknown>('/auth/login', { firebaseUid, idToken });
        const normalized = normalizeAppUser(loginData, { firebaseUid });
        if (!normalized.id) return normalized;
        const fullProfile = await apiService.get<unknown>(`/users/${normalized.id}/full-profile`);
        return normalizeAppUser(fullProfile, { firebaseUid });
      }

      throw new Error('Missing auth context for current user fetch');
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (updates: Partial<UserProfile>, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootStateLike;
      const userId = state.auth.appUser?.id;
      const firebaseUid = state.auth.firebaseUser?.uid;
      if (!userId) throw new Error('Missing authenticated user id');

      await apiService.put(`/users/${userId}/profile`, mapProfileUpdates(updates));
      const fullProfile = await apiService.get<unknown>(`/users/${userId}/full-profile`);
      return normalizeAppUser(fullProfile, { firebaseUid });
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const updateUserPreferences = createAsyncThunk(
  'user/updatePreferences',
  async (prefs: Partial<UserPreferences>, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootStateLike;
      const userId = state.auth.appUser?.id;
      const firebaseUid = state.auth.firebaseUser?.uid;
      if (!userId) throw new Error('Missing authenticated user id');

      const prefPayload = mapPreferenceUpdates(prefs);
      if (Object.keys(prefPayload).length > 0) {
        await apiService.put(`/users/${userId}/preferences`, prefPayload);
      }

      if (typeof prefs.preferBipoc === 'boolean' || typeof prefs.preferLgbtq === 'boolean') {
        await apiService.put(`/users/${userId}/profile`, {
          ...(typeof prefs.preferBipoc === 'boolean'
            ? { bipocIdentification: prefs.preferBipoc }
            : {}),
          ...(typeof prefs.preferLgbtq === 'boolean'
            ? { lgbtqIdentification: prefs.preferLgbtq }
            : {}),
        });
      }

      const fullProfile = await apiService.get<unknown>(`/users/${userId}/full-profile`);
      return normalizeAppUser(fullProfile, { firebaseUid });
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError(state) {
      state.error = null;
    },
    resetUser() {
      return initialState;
    },
    setUser(state, action: PayloadAction<AppUser | null>) {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.profile = action.payload;
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(updateUserProfile.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.profile = action.payload;
    });
    builder.addCase(updateUserProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(updateUserPreferences.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(updateUserPreferences.fulfilled, (state, action) => {
      state.isLoading = false;
      state.profile = action.payload;
    });
    builder.addCase(updateUserPreferences.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearUserError, resetUser, setUser } = userSlice.actions;
export default userSlice.reducer;
