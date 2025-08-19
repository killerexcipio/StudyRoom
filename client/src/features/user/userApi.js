// client/src/features/user/userApi.js
import apiClient from '../../services/apiClient';

const userApi = {
  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get('/api/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await apiClient.put('/api/users/profile', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await apiClient.put('/api/users/password', passwordData);
    return response.data;
  },

  // Search users
  searchUsers: async (query, limit = 10) => {
    const response = await apiClient.get(`/api/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await apiClient.get(`/api/users/${id}`);
    return response.data;
  },

  // Get multiple users by IDs
  getUsersByIds: async (userIds) => {
    const response = await apiClient.post('/api/users/batch', { userIds });
    return response.data;
  },

  // Update online status
  updateOnlineStatus: async (isOnline) => {
    const response = await apiClient.put('/api/users/status', { isOnline });
    return response.data;
  },

  // Get user settings
  getSettings: async () => {
    const response = await apiClient.get('/api/users/settings');
    return response.data;
  },

  // Update user settings
  updateSettings: async (settings) => {
    const response = await apiClient.put('/api/users/settings', settings);
    return response.data;
  },

  // Delete user account
  deleteAccount: async (password) => {
    const response = await apiClient.delete('/api/users/account', { data: { password } });
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await apiClient.get('/api/users/stats');
    return response.data;
  },

  // Get online users
  getOnlineUsers: async (limit = 50) => {
    const response = await apiClient.get(`/api/users/online?limit=${limit}`);
    return response.data;
  },

  // Block/unblock user
  toggleBlockUser: async (userId, block = true) => {
    const response = await apiClient.post(`/api/users/${userId}/block`, { block });
    return response.data;
  },

  // Get blocked users
  getBlockedUsers: async () => {
    const response = await apiClient.get('/api/users/blocked');
    return response.data;
  }
};

export default userApi;
