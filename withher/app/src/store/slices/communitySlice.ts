import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { ForumPost, ForumComment, Event, Resource } from '../../types';
import { apiService } from '../../services/api';

interface CommunityState {
  posts: ForumPost[];
  selectedPost: ForumPost | null;
  events: Event[];
  resources: Resource[];
  isLoadingPosts: boolean;
  isLoadingEvents: boolean;
  isLoadingResources: boolean;
  error: string | null;
}

const initialState: CommunityState = {
  posts: [],
  selectedPost: null,
  events: [],
  resources: [],
  isLoadingPosts: false,
  isLoadingEvents: false,
  isLoadingResources: false,
  error: null,
};

export const fetchPosts = createAsyncThunk(
  'community/fetchPosts',
  async (params: { category?: string; page?: number } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.category) query.set('category', params.category);
      if (params.page) query.set('page', String(params.page));
      return await apiService.get<ForumPost[]>(`/community/posts?${query.toString()}`);
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const fetchPost = createAsyncThunk(
  'community/fetchPost',
  async (postId: string, { rejectWithValue }) => {
    try {
      return await apiService.get<ForumPost>(`/community/posts/${postId}`);
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const createPost = createAsyncThunk(
  'community/createPost',
  async (
    data: { title: string; content: string; category: string; tags?: string[] },
    { rejectWithValue },
  ) => {
    try {
      return await apiService.post<ForumPost>('/community/posts', data);
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const votePost = createAsyncThunk(
  'community/votePost',
  async (args: { postId: string; voteType: 'UP' | 'DOWN' }, { rejectWithValue }) => {
    try {
      return await apiService.post<ForumPost>(`/community/posts/${args.postId}/vote`, {
        voteType: args.voteType,
      });
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const addComment = createAsyncThunk(
  'community/addComment',
  async (args: { postId: string; content: string }, { rejectWithValue }) => {
    try {
      const comment = await apiService.post<ForumComment>(
        `/community/posts/${args.postId}/comments`,
        { content: args.content },
      );
      return { postId: args.postId, comment };
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const fetchEvents = createAsyncThunk(
  'community/fetchEvents',
  async (_, { rejectWithValue }) => {
    try {
      return await apiService.get<Event[]>('/events');
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const fetchResources = createAsyncThunk(
  'community/fetchResources',
  async (_, { rejectWithValue }) => {
    try {
      return await apiService.get<Resource[]>('/resources');
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    clearCommunityError(state) {
      state.error = null;
    },
    resetCommunity() {
      return initialState;
    },
    setSelectedPost(state, action: PayloadAction<ForumPost | null>) {
      state.selectedPost = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPosts.pending, (state) => {
      state.isLoadingPosts = true;
    });
    builder.addCase(fetchPosts.fulfilled, (state, action) => {
      state.isLoadingPosts = false;
      state.posts = action.payload;
    });
    builder.addCase(fetchPosts.rejected, (state, action) => {
      state.isLoadingPosts = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchPost.fulfilled, (state, action) => {
      state.selectedPost = action.payload;
      const idx = state.posts.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) state.posts[idx] = action.payload;
    });

    builder.addCase(createPost.fulfilled, (state, action) => {
      state.posts.unshift(action.payload);
    });

    builder.addCase(votePost.fulfilled, (state, action) => {
      const idx = state.posts.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) state.posts[idx] = action.payload;
      if (state.selectedPost?.id === action.payload.id) state.selectedPost = action.payload;
    });

    builder.addCase(addComment.fulfilled, (state, action) => {
      const { postId, comment } = action.payload;
      const post = state.posts.find((p) => p.id === postId) ?? state.selectedPost;
      if (post) {
        if (!post.comments) post.comments = [];
        post.comments.push(comment);
      }
    });

    builder.addCase(fetchEvents.pending, (state) => {
      state.isLoadingEvents = true;
    });
    builder.addCase(fetchEvents.fulfilled, (state, action) => {
      state.isLoadingEvents = false;
      state.events = action.payload;
    });
    builder.addCase(fetchEvents.rejected, (state, action) => {
      state.isLoadingEvents = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchResources.pending, (state) => {
      state.isLoadingResources = true;
    });
    builder.addCase(fetchResources.fulfilled, (state, action) => {
      state.isLoadingResources = false;
      state.resources = action.payload;
    });
    builder.addCase(fetchResources.rejected, (state, action) => {
      state.isLoadingResources = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearCommunityError, resetCommunity, setSelectedPost } = communitySlice.actions;
export default communitySlice.reducer;
