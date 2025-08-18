// client/src/features/chat/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatApi from './chatApi';

// Async thunks
export const getChats = createAsyncThunk(
  'chat/getChats',
  async (_, { rejectWithValue }) => {
    try {
      return await chatApi.getChats();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getChat = createAsyncThunk(
  'chat/getChat',
  async (chatId, { rejectWithValue }) => {
    try {
      return await chatApi.getChat(chatId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createChat = createAsyncThunk(
  'chat/createChat',
  async (chatData, { rejectWithValue }) => {
    try {
      return await chatApi.createChat(chatData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (chatId, { rejectWithValue }) => {
    try {
      return await chatApi.getMessages(chatId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      return await chatApi.sendMessage(messageData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const markMessageAsRead = createAsyncThunk(
  'chat/markMessageAsRead',
  async ({ chatId, messageId }, { rejectWithValue }) => {
    try {
      return await chatApi.markMessageAsRead(chatId, messageId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async ({ chatId, messageId }, { rejectWithValue }) => {
    try {
      await chatApi.deleteMessage(chatId, messageId);
      return { chatId, messageId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  chats: [],
  currentChat: null,
  messages: [],
  typing: [],
  onlineUsers: [],
  loading: false,
  messagesLoading: false,
  error: null,
  success: false
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearCurrentChat: (state) => {
      state.currentChat = null;
      state.messages = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    addMessage: (state, action) => {
      // For real-time message updates via socket
      const message = action.payload;
      const existingIndex = state.messages.findIndex(m => m._id === message._id);
      
      if (existingIndex === -1) {
        state.messages.push(message);
      } else {
        state.messages[existingIndex] = message;
      }
      
      // Update last message in chat list
      const chatIndex = state.chats.findIndex(c => c._id === message.chat);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message;
        state.chats[chatIndex].updatedAt = message.createdAt;
      }
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      const messageIndex = state.messages.findIndex(m => m._id === messageId);
      if (messageIndex !== -1) {
        state.messages[messageIndex].status = status;
      }
    },
    setTyping: (state, action) => {
      const { chatId, userId, isTyping } = action.payload;
      if (isTyping) {
        if (!state.typing.find(t => t.chatId === chatId && t.userId === userId)) {
          state.typing.push({ chatId, userId });
        }
      } else {
        state.typing = state.typing.filter(t => !(t.chatId === chatId && t.userId === userId));
      }
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    updateChatLastMessage: (state, action) => {
      const { chatId, message } = action.payload;
      const chatIndex = state.chats.findIndex(c => c._id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message;
        state.chats[chatIndex].updatedAt = message.createdAt;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Chats
      .addCase(getChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(getChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Single Chat
      .addCase(getChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChat.fulfilled, (state, action) => {
        state.loading = false;
        state.currentChat = action.payload;
      })
      .addCase(getChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Chat
      .addCase(createChat.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.chats.unshift(action.payload);
      })
      .addCase(createChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Get Messages
      .addCase(getMessages.pending, (state) => {
        state.messagesLoading = true;
        state.error = null;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = action.payload;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload;
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        state.messages.push(message);
        
        // Update last message in chat list
        const chatIndex = state.chats.findIndex(c => c._id === message.chat);
        if (chatIndex !== -1) {
          state.chats[chatIndex].lastMessage = message;
          state.chats[chatIndex].updatedAt = message.createdAt;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete Message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { messageId } = action.payload;
        state.messages = state.messages.filter(m => m._id !== messageId);
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { 
  clearCurrentChat, 
  clearError, 
  clearSuccess, 
  addMessage,
  updateMessageStatus,
  setTyping,
  setOnlineUsers,
  updateChatLastMessage
} = chatSlice.actions;

export default chatSlice.reducer;