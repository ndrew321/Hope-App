import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, FirebaseUser, AppUser } from '../../types';
import { authService } from '../../services/authService';
import { apiService } from '../../services/api';
import { localDevMatching } from '../../services/localDevMatching';

function isApiUnavailableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const message = err.message.toLowerCase();
  return (
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('unable to connect') ||
    message.includes('timeout')
  );
}

function toLocalAppUser(firebaseUser: FirebaseUser, profile?: {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}): AppUser {
  const email = firebaseUser.email ?? '';
  const guessedFirstName =
    profile?.firstName ?? firebaseUser.displayName?.split(' ')[0] ?? email.split('@')[0] ?? 'Player';
  const guessedLastName =
    profile?.lastName ?? firebaseUser.displayName?.split(' ').slice(1).join(' ') ?? '';

  return {
    id: firebaseUser.uid,
    firebaseUid: firebaseUser.uid,
    email,
    firstName: guessedFirstName,
    lastName: guessedLastName,
    dateOfBirth: profile?.dateOfBirth ?? '2000-01-01',
    profilePhotoUrl: firebaseUser.photoURL,
    isActive: true,
    isVerified: firebaseUser.emailVerified,
    isSuspended: false,
    createdAt: new Date().toISOString(),
    profile: {
      id: `local-profile-${firebaseUser.uid}`,
      userId: firebaseUser.uid,
      mentorshipRole: 'BOTH',
      careerLevel: 'HIGH_SCHOOL',
      completenessScore: 20,
    },
  };
}

const initialState: AuthState = {
  firebaseUser: null,
  appUser: null,
  idToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    args: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const { firebaseUser, idToken } = await authService.registerWithEmail(
        args.email,
        args.password,
      );
      let appUser: AppUser;
      try {
        appUser = await apiService.post<AppUser>('/auth/register', {
          idToken,
          firstName: args.firstName,
          lastName: args.lastName,
          dateOfBirth: args.dateOfBirth,
        });
      } catch (apiErr: unknown) {
        if (!isApiUnavailableError(apiErr)) throw apiErr;
        // Local dev fallback: allow frontend flow when backend is offline.
        appUser = toLocalAppUser(firebaseUser, {
          firstName: args.firstName,
          lastName: args.lastName,
          dateOfBirth: args.dateOfBirth,
        });
      }
      localDevMatching.upsertUser(appUser);
      return { firebaseUser, appUser, idToken };
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (args: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { firebaseUser, idToken } = await authService.signInWithEmail(
        args.email,
        args.password,
      );
      let appUser: AppUser;
      try {
        appUser = await apiService.post<AppUser>('/auth/login', { idToken });
      } catch (apiErr: unknown) {
        if (!isApiUnavailableError(apiErr)) throw apiErr;
        // Local dev fallback: prefer stored profile so prior onboarding data is preserved.
        appUser = localDevMatching.getUser(firebaseUser.uid) ?? toLocalAppUser(firebaseUser);
      }
      localDevMatching.upsertUser(appUser);
      return { firebaseUser, appUser, idToken };
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authService.signOut();
    await apiService.post('/auth/logout', {});
  } catch (err: unknown) {
    return rejectWithValue((err as Error).message);
  }
});

export const refreshIdToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const idToken = await authService.getIdToken();
      return idToken;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setFirebaseUser(state, action: PayloadAction<FirebaseUser | null>) {
      state.firebaseUser = action.payload;
      state.isAuthenticated = action.payload !== null && state.appUser !== null;
    },
    setAppUser(state, action: PayloadAction<AppUser | null>) {
      state.appUser = action.payload;
      state.isAuthenticated = action.payload !== null && state.firebaseUser !== null;
    },
    setIdToken(state, action: PayloadAction<string | null>) {
      state.idToken = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    resetAuth() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.firebaseUser = action.payload.firebaseUser;
      state.appUser = action.payload.appUser;
      state.idToken = action.payload.idToken;
      state.isAuthenticated = true;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.firebaseUser = action.payload.firebaseUser;
      state.appUser = action.payload.appUser;
      state.idToken = action.payload.idToken;
      state.isAuthenticated = true;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, () => initialState);
    builder.addCase(logoutUser.rejected, () => initialState);

    // Refresh token
    builder.addCase(refreshIdToken.fulfilled, (state, action) => {
      state.idToken = action.payload ?? null;
    });
  },
});

export const { setFirebaseUser, setAppUser, setIdToken, clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
