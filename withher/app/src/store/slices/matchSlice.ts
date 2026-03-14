import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Match, SwipeCandidate, MentorshipProgram, AppUser } from '../../types';
import { apiService } from '../../services/api';
import { localDevMatching } from '../../services/localDevMatching';

interface MatchState {
  candidates: SwipeCandidate[];
  matches: Match[];
  programs: MentorshipProgram[];
  currentCandidateIndex: number;
  isLoadingCandidates: boolean;
  isLoadingMatches: boolean;
  error: string | null;
}

const initialState: MatchState = {
  candidates: [],
  matches: [],
  programs: [],
  currentCandidateIndex: 0,
  isLoadingCandidates: false,
  isLoadingMatches: false,
  error: null,
};

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

export const fetchCandidates = createAsyncThunk(
  'match/fetchCandidates',
  async (_, { rejectWithValue, getState }) => {
    try {
      return await apiService.get<SwipeCandidate[]>('/matches/discover');
    } catch (err: unknown) {
      if (!isApiUnavailableError(err)) {
        return rejectWithValue((err as Error).message);
      }
      const state = getState() as { auth: { appUser: AppUser | null } };
      const currentUser = state.auth.appUser;
      if (!currentUser) return [] as SwipeCandidate[];
      return localDevMatching.getCandidatesFor(currentUser);
    }
  },
);

export const swipeOnUser = createAsyncThunk(
  'match/swipe',
  async (
    args: { targetUserId: string; direction: 'RIGHT' | 'LEFT' },
    { rejectWithValue, getState },
  ) => {
    try {
      return await apiService.post<{ matched: boolean; matchId?: string }>('/matches/swipe', args);
    } catch (err: unknown) {
      if (!isApiUnavailableError(err)) {
        return rejectWithValue((err as Error).message);
      }
      const state = getState() as { auth: { appUser: AppUser | null } };
      const currentUserId = state.auth.appUser?.id;
      if (currentUserId) {
        localDevMatching.recordSwipe(currentUserId, args.targetUserId);
      }
      return { matched: args.direction === 'RIGHT' };
    }
  },
);

export const fetchMatches = createAsyncThunk(
  'match/fetchMatches',
  async (_, { rejectWithValue }) => {
    try {
      return await apiService.get<Match[]>('/matches/active');
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const confirmMatch = createAsyncThunk(
  'match/confirm',
  async (matchId: string, { rejectWithValue }) => {
    try {
      return await apiService.post<Match>(`/matches/${matchId}/confirm`, {});
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const startProgram = createAsyncThunk(
  'match/startProgram',
  async (matchId: string, { rejectWithValue }) => {
    try {
      return await apiService.post<MentorshipProgram>(`/matches/${matchId}/start-program`, {});
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    advanceCandidate(state) {
      state.currentCandidateIndex = Math.min(
        state.currentCandidateIndex + 1,
        state.candidates.length,
      );
    },
    resetCandidates(state) {
      state.candidates = [];
      state.currentCandidateIndex = 0;
    },
    clearMatchError(state) {
      state.error = null;
    },
    resetMatches() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCandidates.pending, (state) => {
      state.isLoadingCandidates = true;
      state.error = null;
    });
    builder.addCase(fetchCandidates.fulfilled, (state, action) => {
      state.isLoadingCandidates = false;
      state.candidates = action.payload;
      state.currentCandidateIndex = 0;
    });
    builder.addCase(fetchCandidates.rejected, (state, action) => {
      state.isLoadingCandidates = false;
      state.error = action.payload as string;
    });

    builder.addCase(swipeOnUser.fulfilled, (state) => {
      state.currentCandidateIndex += 1;
    });

    builder.addCase(fetchMatches.pending, (state) => {
      state.isLoadingMatches = true;
    });
    builder.addCase(fetchMatches.fulfilled, (state, action) => {
      state.isLoadingMatches = false;
      state.matches = action.payload;
    });
    builder.addCase(fetchMatches.rejected, (state, action) => {
      state.isLoadingMatches = false;
      state.error = action.payload as string;
    });

    builder.addCase(confirmMatch.fulfilled, (state, action) => {
      const idx = state.matches.findIndex((m) => m.id === action.payload.id);
      if (idx !== -1) state.matches[idx] = action.payload;
      else state.matches.unshift(action.payload);
    });

    builder.addCase(startProgram.fulfilled, (state, action: PayloadAction<MentorshipProgram>) => {
      state.programs.unshift(action.payload);
    });
  },
});

export const { advanceCandidate, resetCandidates, clearMatchError, resetMatches } =
  matchSlice.actions;
export default matchSlice.reducer;
