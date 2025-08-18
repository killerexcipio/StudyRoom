// client/src/features/calendar/calendarSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import calendarApi from './calendarApi';

// Async thunks
export const getReminders = createAsyncThunk(
  'calendar/getReminders',
  async (_, { rejectWithValue }) => {
    try {
      return await calendarApi.getReminders();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getReminder = createAsyncThunk(
  'calendar/getReminder',
  async (id, { rejectWithValue }) => {
    try {
      return await calendarApi.getReminder(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createReminder = createAsyncThunk(
  'calendar/createReminder',
  async (reminderData, { rejectWithValue }) => {
    try {
      return await calendarApi.createReminder(reminderData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateReminder = createAsyncThunk(
  'calendar/updateReminder',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      return await calendarApi.updateReminder(id, updates);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteReminder = createAsyncThunk(
  'calendar/deleteReminder',
  async (id, { rejectWithValue }) => {
    try {
      await calendarApi.deleteReminder(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getRemindersByDate = createAsyncThunk(
  'calendar/getRemindersByDate',
  async (date, { rejectWithValue }) => {
    try {
      return await calendarApi.getRemindersByDate(date);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getRemindersByDateRange = createAsyncThunk(
  'calendar/getRemindersByDateRange',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      return await calendarApi.getRemindersByDateRange(startDate, endDate);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const searchReminders = createAsyncThunk(
  'calendar/searchReminders',
  async (query, { rejectWithValue }) => {
    try {
      return await calendarApi.searchReminders(query);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  reminders: [],
  currentReminder: null,
  filteredReminders: [],
  loading: false,
  error: null,
  success: false,
  filters: {
    category: 'all',
    priority: 'all',
    completed: 'all'
  }
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    clearCurrentReminder: (state) => {
      state.currentReminder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      // Apply filters to reminders
      state.filteredReminders = applyFilters(state.reminders, state.filters);
    },
    clearFilters: (state) => {
      state.filters = {
        category: 'all',
        priority: 'all',
        completed: 'all'
      };
      state.filteredReminders = state.reminders;
    },
    toggleReminderComplete: (state, action) => {
      const reminderId = action.payload;
      const reminderIndex = state.reminders.findIndex(r => r._id === reminderId);
      if (reminderIndex !== -1) {
        state.reminders[reminderIndex].completed = !state.reminders[reminderIndex].completed;
        state.filteredReminders = applyFilters(state.reminders, state.filters);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Reminders
      .addCase(getReminders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReminders.fulfilled, (state, action) => {
        state.loading = false;
        state.reminders = action.payload;
        state.filteredReminders = applyFilters(action.payload, state.filters);
      })
      .addCase(getReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Single Reminder
      .addCase(getReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReminder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentReminder = action.payload;
      })
      .addCase(getReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Reminder
      .addCase(createReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createReminder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.reminders.push(action.payload);
        state.filteredReminders = applyFilters(state.reminders, state.filters);
      })
      .addCase(createReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Update Reminder
      .addCase(updateReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateReminder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.reminders.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.reminders[index] = action.payload;
        }
        state.filteredReminders = applyFilters(state.reminders, state.filters);
      })
      .addCase(updateReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Delete Reminder
      .addCase(deleteReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.loading = false;
        state.reminders = state.reminders.filter(r => r._id !== action.payload);
        state.filteredReminders = applyFilters(state.reminders, state.filters);
      })
      .addCase(deleteReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Reminders by Date
      .addCase(getRemindersByDate.fulfilled, (state, action) => {
        state.filteredReminders = action.payload;
      })
      // Get Reminders by Date Range
      .addCase(getRemindersByDateRange.fulfilled, (state, action) => {
        state.filteredReminders = action.payload;
      })
      // Search Reminders
      .addCase(searchReminders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchReminders.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredReminders = action.payload;
      })
      .addCase(searchReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Helper function to apply filters
const applyFilters = (reminders, filters) => {
  return reminders.filter(reminder => {
    // Category filter
    if (filters.category !== 'all' && reminder.category !== filters.category) {
      return false;
    }
    
    // Priority filter
    if (filters.priority !== 'all' && reminder.priority !== filters.priority) {
      return false;
    }
    
    // Completed filter
    if (filters.completed === 'completed' && !reminder.completed) {
      return false;
    }
    if (filters.completed === 'pending' && reminder.completed) {
      return false;
    }
    
    return true;
  });
};

export const { 
  clearCurrentReminder, 
  clearError, 
  clearSuccess, 
  setFilters, 
  clearFilters,
  toggleReminderComplete 
} = calendarSlice.actions;

export default calendarSlice.reducer;