// client/src/features/notes/notesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notesApi from './notesApi';

// Async thunks
export const getNotes = createAsyncThunk(
  'notes/getNotes',
  async (params, { rejectWithValue }) => {
    try {
      return await notesApi.getNotes(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getNote = createAsyncThunk(
  'notes/getNote',
  async (id, { rejectWithValue }) => {
    try {
      return await notesApi.getNote(id);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createNote = createAsyncThunk(
  'notes/createNote',
  async (noteData, { rejectWithValue }) => {
    try {
      return await notesApi.createNote(noteData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async ({ id, noteData }, { rejectWithValue }) => {
    try {
      return await notesApi.updateNote(id, noteData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (id, { rejectWithValue }) => {
    try {
      await notesApi.deleteNote(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getUserTags = createAsyncThunk(
  'notes/getUserTags',
  async (_, { rejectWithValue }) => {
    try {
      return await notesApi.getUserTags();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const searchNotes = createAsyncThunk(
  'notes/searchNotes',
  async (query, { rejectWithValue }) => {
    try {
      return await notesApi.searchNotes(query);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  notes: [],
  currentNote: null,
  tags: [],
  filteredNotes: [],
  loading: false,
  error: null,
  success: false,
  searchQuery: '',
  filters: {
    tags: [],
    archived: false,
    pinned: false
  }
};

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    clearCurrentNote: (state) => {
      state.currentNote = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.filteredNotes = filterNotes(state.notes, state.searchQuery, state.filters);
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.filteredNotes = filterNotes(state.notes, state.searchQuery, state.filters);
    },
    clearFilters: (state) => {
      state.filters = {
        tags: [],
        archived: false,
        pinned: false
      };
      state.searchQuery = '';
      state.filteredNotes = state.notes;
    },
    toggleNotePin: (state, action) => {
      const noteId = action.payload;
      const noteIndex = state.notes.findIndex(note => note._id === noteId);
      if (noteIndex !== -1) {
        state.notes[noteIndex].isPinned = !state.notes[noteIndex].isPinned;
        state.filteredNotes = filterNotes(state.notes, state.searchQuery, state.filters);
      }
    },
    toggleNoteArchive: (state, action) => {
      const noteId = action.payload;
      const noteIndex = state.notes.findIndex(note => note._id === noteId);
      if (noteIndex !== -1) {
        state.notes[noteIndex].isArchived = !state.notes[noteIndex].isArchived;
        state.filteredNotes = filterNotes(state.notes, state.searchQuery, state.filters);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Notes
      .addCase(getNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload.notes;
        state.filteredNotes = filterNotes(action.payload.notes, state.searchQuery, state.filters);
      })
      .addCase(getNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Single Note
      .addCase(getNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNote.fulfilled, (state, action) => {
        state.loading = false;
        state.currentNote = action.payload.note;
      })
      .addCase(getNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Note
      .addCase(createNote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.notes.unshift(action.payload.note);
        state.filteredNotes = filterNotes(state.notes, state.searchQuery, state.filters);
      })
      .addCase(createNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Update Note
      .addCase(updateNote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedNote = action.payload.note;
        const index = state.notes.findIndex(note => note._id === updatedNote._id);
        if (index !== -1) {
          state.notes[index] = updatedNote;
        }
        state.currentNote = updatedNote;
        state.filteredNotes = filterNotes(state.notes, state.searchQuery, state.filters);
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Delete Note
      .addCase(deleteNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = state.notes.filter(note => note._id !== action.payload);
        state.filteredNotes = filterNotes(state.notes, state.searchQuery, state.filters);
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get User Tags
      .addCase(getUserTags.fulfilled, (state, action) => {
        state.tags = action.payload.tags;
      })
      // Search Notes
      .addCase(searchNotes.fulfilled, (state, action) => {
        state.filteredNotes = action.payload.notes;
      });
  }
});

// Helper function to filter notes
const filterNotes = (notes, searchQuery, filters) => {
  return notes.filter(note => {
    // Search query filter
    if (searchQuery && !note.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !note.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }

    // Tag filter
    if (filters.tags.length > 0 && !filters.tags.some(tag => note.tags.includes(tag))) {
      return false;
    }

    // Archived filter
    if (filters.archived !== note.isArchived) {
      return false;
    }

    // Pinned filter
    if (filters.pinned && !note.isPinned) {
      return false;
    }

    return true;
  });
};

export const {
  clearCurrentNote,
  clearError,
  clearSuccess,
  setSearchQuery,
  setFilters,
  clearFilters,
  toggleNotePin,
  toggleNoteArchive
} = notesSlice.actions;

export default notesSlice.reducer;
