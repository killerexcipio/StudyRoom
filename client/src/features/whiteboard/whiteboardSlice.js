// client/src/features/whiteboard/whiteboardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import whiteboardApi from './whiteboardApi';

// Async thunks
export const getWhiteboards = createAsyncThunk(
  'whiteboard/getWhiteboards',
  async (_, { rejectWithValue }) => {
    try {
      return await whiteboardApi.getWhiteboards();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getWhiteboard = createAsyncThunk(
  'whiteboard/getWhiteboard',
  async (id, { rejectWithValue }) => {
    try {
      return await whiteboardApi.getWhiteboard(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const saveWhiteboard = createAsyncThunk(
  'whiteboard/saveWhiteboard',
  async (whiteboardData, { rejectWithValue }) => {
    try {
      if (whiteboardData._id) {
        return await whiteboardApi.updateWhiteboard(whiteboardData._id, whiteboardData);
      } else {
        return await whiteboardApi.createWhiteboard(whiteboardData);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteWhiteboard = createAsyncThunk(
  'whiteboard/deleteWhiteboard',
  async (id, { rejectWithValue }) => {
    try {
      await whiteboardApi.deleteWhiteboard(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  whiteboards: [],
  currentWhiteboard: null,
  loading: false,
  error: null,
  success: false
};

const whiteboardSlice = createSlice({
  name: 'whiteboard',
  initialState,
  reducers: {
    clearCurrentWhiteboard: (state) => {
      state.currentWhiteboard = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Whiteboards
      .addCase(getWhiteboards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWhiteboards.fulfilled, (state, action) => {
        state.loading = false;
        state.whiteboards = action.payload;
      })
      .addCase(getWhiteboards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Single Whiteboard
      .addCase(getWhiteboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWhiteboard.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWhiteboard = action.payload;
      })
      .addCase(getWhiteboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save Whiteboard (Create/Update)
      .addCase(saveWhiteboard.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(saveWhiteboard.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentWhiteboard = action.payload;
        
        // Update or add to whiteboards array
        const existingIndex = state.whiteboards.findIndex(
          wb => wb._id === action.payload._id
        );
        if (existingIndex !== -1) {
          state.whiteboards[existingIndex] = action.payload;
        } else {
          state.whiteboards.unshift(action.payload);
        }
      })
      .addCase(saveWhiteboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Delete Whiteboard
      .addCase(deleteWhiteboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWhiteboard.fulfilled, (state, action) => {
        state.loading = false;
        state.whiteboards = state.whiteboards.filter(
          wb => wb._id !== action.payload
        );
      })
      .addCase(deleteWhiteboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCurrentWhiteboard, clearError, clearSuccess } = whiteboardSlice.actions;
export default whiteboardSlice.reducer;