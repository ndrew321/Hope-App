import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AppUser, UserProfile, UserPreferences } from '../../types';
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

export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      return await apiService.get<AppUser>('/users/me');
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (updates: Partial<UserProfile>, { rejectWithValue }) => {
    try {
      return await apiService.patch<AppUser>('/users/me/profile', updates);
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const updateUserPreferences = createAsyncThunk(
  'user/updatePreferences',
  async (prefs: Partial<UserPreferences>, { rejectWithValue }) => {
    try {
      return await apiService.patch<AppUser>('/users/me/preferences', prefs);
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
