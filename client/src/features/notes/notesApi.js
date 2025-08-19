// client/src/features/notes/notesApi.js
import apiClient from '../../services/apiClient';

const notesApi = {
  // Get all notes for user
  getNotes: async (params = {}) => {
    const response = await apiClient.get('/api/notes', { params });
    return response.data;
  },

  // Get single note by ID
  getNote: async (id) => {
    const response = await apiClient.get(`/api/notes/${id}`);
    return response.data;
  },

  // Create new note
  createNote: async (noteData) => {
    const response = await apiClient.post('/api/notes', noteData);
    return response.data;
  },

  // Update existing note
  updateNote: async (id, noteData) => {
    const response = await apiClient.put(`/api/notes/${id}`, noteData);
    return response.data;
  },

  // Delete note
  deleteNote: async (id) => {
    const response = await apiClient.delete(`/api/notes/${id}`);
    return response.data;
  },

  // Get user's tags
  getUserTags: async () => {
    const response = await apiClient.get('/api/notes/tags');
    return response.data;
  },

  // Bulk update notes
  bulkUpdateNotes: async (noteIds, updates) => {
    const response = await apiClient.patch('/api/notes/bulk', { noteIds, updates });
    return response.data;
  },

  // Search notes
  searchNotes: async (query) => {
    const response = await apiClient.get(`/api/notes/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get notes by tag
  getNotesByTag: async (tag) => {
    const response = await apiClient.get(`/api/notes/tag/${tag}`);
    return response.data;
  },

  // Archive/unarchive note
  toggleArchive: async (id, isArchived) => {
    const response = await apiClient.patch(`/api/notes/${id}/archive`, { isArchived });
    return response.data;
  },

  // Pin/unpin note
  togglePin: async (id, isPinned) => {
    const response = await apiClient.patch(`/api/notes/${id}/pin`, { isPinned });
    return response.data;
  },

  // Duplicate note
  duplicateNote: async (id) => {
    const response = await apiClient.post(`/api/notes/${id}/duplicate`);
    return response.data;
  },

  // Export notes
  exportNotes: async (format = 'json') => {
    const response = await apiClient.get(`/api/notes/export?format=${format}`);
    return response.data;
  },

  // Import notes
  importNotes: async (notesData) => {
    const response = await apiClient.post('/api/notes/import', notesData);
    return response.data;
  }
};

export default notesApi;
