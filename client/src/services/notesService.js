
// client/src/services/notesService.js
import apiClient from './apiClient';

const notesService = {
  // Get all notes for user
  getNotes: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/notes', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single note by ID
  getNote: async (id) => {
    try {
      const response = await apiClient.get(`/api/notes/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new note
  createNote: async (noteData) => {
    try {
      const response = await apiClient.post('/api/notes', noteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update existing note
  updateNote: async (id, noteData) => {
    try {
      const response = await apiClient.put(`/api/notes/${id}`, noteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete note
  deleteNote: async (id) => {
    try {
      const response = await apiClient.delete(`/api/notes/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user's tags
  getUserTags: async () => {
    try {
      const response = await apiClient.get('/api/notes/tags');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search notes
  searchNotes: async (query, params = {}) => {
    try {
      const response = await apiClient.get('/api/notes/search', {
        params: { q: query, ...params }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get notes by tag
  getNotesByTag: async (tag) => {
    try {
      const response = await apiClient.get(`/api/notes/tag/${encodeURIComponent(tag)}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Toggle pin status
  togglePin: async (id, isPinned) => {
    try {
      const response = await apiClient.patch(`/api/notes/${id}/pin`, { isPinned });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Toggle archive status
  toggleArchive: async (id, isArchived) => {
    try {
      const response = await apiClient.patch(`/api/notes/${id}/archive`, { isArchived });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Duplicate note
  duplicateNote: async (id) => {
    try {
      const response = await apiClient.post(`/api/notes/${id}/duplicate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Bulk operations
  bulkUpdate: async (noteIds, updates) => {
    try {
      const response = await apiClient.patch('/api/notes/bulk', {
        noteIds,
        updates
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  bulkDelete: async (noteIds) => {
    try {
      const response = await apiClient.delete('/api/notes/bulk', {
        data: { noteIds }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Export notes
  exportNotes: async (format = 'json', options = {}) => {
    try {
      const response = await apiClient.get('/api/notes/export', {
        params: { format, ...options },
        responseType: format === 'json' ? 'json' : 'blob'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Import notes
  importNotes: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });

      const response = await apiClient.post('/api/notes/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get note statistics
  getNotesStats: async () => {
    try {
      const response = await apiClient.get('/api/notes/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Share note (make public)
  shareNote: async (id, isPublic = true) => {
    try {
      const response = await apiClient.patch(`/api/notes/${id}/share`, { isPublic });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get public notes
  getPublicNotes: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/notes/public', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add/remove note favorite
  toggleFavorite: async (id, isFavorite) => {
    try {
      const response = await apiClient.patch(`/api/notes/${id}/favorite`, { isFavorite });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get favorite notes
  getFavoriteNotes: async () => {
    try {
      const response = await apiClient.get('/api/notes/favorites');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add attachment to note
  addAttachment: async (noteId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('noteId', noteId);

      const response = await apiClient.post(`/api/notes/${noteId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Remove attachment from note
  removeAttachment: async (noteId, attachmentId) => {
    try {
      const response = await apiClient.delete(`/api/notes/${noteId}/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default notesService;

