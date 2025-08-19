// client/src/services/authService.js
import apiClient from './apiClient';
import { getToken, setToken, removeToken } from '../utils/tokenUtils';

const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      
      if (response.data.token) {
        setToken(response.data.token);
        // Set authorization header for future requests
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await apiClient.post('/api/auth/register', userData);
      
      if (response.data.token) {
        setToken(response.data.token);
        // Set authorization header for future requests
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: () => {
    removeToken();
    delete apiClient.defaults.headers.common['Authorization'];
    
    // Optional: make server-side logout call
    // apiClient.post('/api/auth/logout').catch(() => {
    //   // Ignore logout errors
    // });
    
    return Promise.resolve();
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/api/auth/profile');
      return response.data;
    } catch (error) {
      // If unauthorized, remove invalid token
      if (error.response?.status === 401) {
        authService.logout();
      }
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/api/auth/profile', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.put('/api/auth/password', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await apiClient.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post('/api/auth/reset-password', {
        token,
        password: newPassword
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify email with token
  verifyEmail: async (token) => {
    try {
      const response = await apiClient.post('/api/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resend verification email
  resendVerification: async (email) => {
    try {
      const response = await apiClient.post('/api/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = getToken();
    if (!token) return false;
    
    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  // Initialize auth state on app start
  initializeAuth: async () => {
    const token = getToken();
    
    if (!token) {
      return { isAuthenticated: false, user: null };
    }

    try {
      // Set authorization header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token is still valid by fetching user profile
      const userData = await authService.getCurrentUser();
      
      return {
        isAuthenticated: true,
        user: userData.user,
        token
      };
    } catch (error) {
      // Token is invalid, clear it
      authService.logout();
      return { isAuthenticated: false, user: null };
    }
  },

  // Refresh token (if your API supports it)
  refreshToken: async () => {
    try {
      const response = await apiClient.post('/api/auth/refresh');
      
      if (response.data.token) {
        setToken(response.data.token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error) {
      // If refresh fails, logout user
      authService.logout();
      throw error;
    }
  }
};

export default authService;
