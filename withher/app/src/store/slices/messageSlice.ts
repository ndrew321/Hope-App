import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Conversation, Message } from '../../types';
import { apiService } from '../../services/api';

interface MessageState {
  conversations: Conversation[];
  messagesByMatchId: Record<string, Message[]>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  sendingMatchId: string | null;
  error: string | null;
}

const initialState: MessageState = {
  conversations: [],
  messagesByMatchId: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  sendingMatchId: null,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  'message/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      return await apiService.get<Conversation[]>('/messages/conversations');
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const fetchMessages = createAsyncThunk(
  'message/fetchMessages',
  async (matchId: string, { rejectWithValue }) => {
    try {
      const messages = await apiService.get<Message[]>(`/messages/${matchId}`);
      return { matchId, messages };
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const sendMessage = createAsyncThunk(
  'message/send',
  async (
    args: { matchId: string; content?: string; mediaUrl?: string; type?: string },
    { rejectWithValue },
  ) => {
    try {
      const message = await apiService.post<Message>(`/messages/${args.matchId}`, {
        content: args.content,
        mediaUrl: args.mediaUrl,
        type: args.type ?? 'TEXT',
      });
      return { matchId: args.matchId, message };
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const deleteMessage = createAsyncThunk(
  'message/delete',
  async (args: { matchId: string; messageId: string }, { rejectWithValue }) => {
    try {
      await apiService.delete(`/messages/${args.matchId}/${args.messageId}`);
      return args;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    appendMessage(state, action: { payload: { matchId: string; message: Message } }) {
      const { matchId, message } = action.payload;
      if (!state.messagesByMatchId[matchId]) {
        state.messagesByMatchId[matchId] = [];
      }
      state.messagesByMatchId[matchId].push(message);
    },
    clearMessageError(state) {
      state.error = null;
    },
    resetMessages() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchConversations.pending, (state) => {
      state.isLoadingConversations = true;
    });
    builder.addCase(fetchConversations.fulfilled, (state, action) => {
      state.isLoadingConversations = false;
      state.conversations = action.payload;
    });
    builder.addCase(fetchConversations.rejected, (state, action) => {
      state.isLoadingConversations = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchMessages.pending, (state) => {
      state.isLoadingMessages = true;
    });
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      state.isLoadingMessages = false;
      state.messagesByMatchId[action.payload.matchId] = action.payload.messages;
    });
    builder.addCase(fetchMessages.rejected, (state, action) => {
      state.isLoadingMessages = false;
      state.error = action.payload as string;
    });

    builder.addCase(sendMessage.pending, (state, action) => {
      state.sendingMatchId = action.meta.arg.matchId;
    });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.sendingMatchId = null;
      const { matchId, message } = action.payload;
      if (!state.messagesByMatchId[matchId]) state.messagesByMatchId[matchId] = [];
      state.messagesByMatchId[matchId].push(message);
      // Update last message in conversation
      const conv = state.conversations.find((c) => c.matchId === matchId);
      if (conv) conv.lastMessage = message;
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.sendingMatchId = null;
      state.error = action.payload as string;
    });

    builder.addCase(deleteMessage.fulfilled, (state, action) => {
      const { matchId, messageId } = action.payload;
      const msgs = state.messagesByMatchId[matchId];
      if (msgs) {
        const idx = msgs.findIndex((m) => m.id === messageId);
        if (idx !== -1) msgs.splice(idx, 1);
      }
    });
  },
});

export const { appendMessage, clearMessageError, resetMessages } = messageSlice.actions;
export default messageSlice.reducer;
