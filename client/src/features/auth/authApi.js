// client/src/features/auth/authApi.js
import apiClient from '../../services/apiClient';

const authApi = {
  // Login user
  login: async (credentials) => {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },

  // Register user
  register: async (userData) => {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get('/api/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await apiClient.put('/api/auth/profile', userData);
    return response.data;
  },

  // Logout user (if needed for server-side logout)
  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await apiClient.put('/api/auth/password', passwordData);
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await apiClient.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await apiClient.post('/api/auth/reset-password', resetData);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await apiClient.post('/api/auth/verify-email', { token });
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await apiClient.post('/api/auth/resend-verification', { email });
    return response.data;
  }
};

export default authApi;
