// client/src/features/whiteboard/whiteboardApi.js
import apiClient from '../../services/apiClient';

const whiteboardApi = {
  // Get all whiteboards for the current user
  getWhiteboards: async () => {
    const response = await apiClient.get('/api/whiteboards');
    return response.data;
  },

  // Get a single whiteboard by ID
  getWhiteboard: async (id) => {
    const response = await apiClient.get(`/api/whiteboards/${id}`);
    return response.data;
  },

  // Create a new whiteboard
  createWhiteboard: async (whiteboardData) => {
    const response = await apiClient.post('/api/whiteboards', whiteboardData);
    return response.data;
  },

  // Update an existing whiteboard
  updateWhiteboard: async (id, whiteboardData) => {
    const response = await apiClient.put(`/api/whiteboards/${id}`, whiteboardData);
    return response.data;
  },

  // Delete a whiteboard
  deleteWhiteboard: async (id) => {
    const response = await apiClient.delete(`/api/whiteboards/${id}`);
    return response.data;
  },

  // Get whiteboards by tag
  getWhiteboardsByTag: async (tag) => {
    const response = await apiClient.get(`/api/whiteboards/tag/${tag}`);
    return response.data;
  },

  // Search whiteboards
  searchWhiteboards: async (query) => {
    const response = await apiClient.get(`/api/whiteboards/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};

export default whiteboardApi;