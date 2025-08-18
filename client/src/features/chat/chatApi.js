// client/src/features/chat/chatApi.js
import apiClient from '../../services/apiClient';

const chatApi = {
  // Get all chats for the current user
  getChats: async () => {
    const response = await apiClient.get('/api/chats');
    return response.data;
  },

  // Get a single chat by ID
  getChat: async (chatId) => {
    const response = await apiClient.get(`/api/chats/${chatId}`);
    return response.data;
  },

  // Create a new chat
  createChat: async (chatData) => {
    const response = await apiClient.post('/api/chats', chatData);
    return response.data;
  },

  // Update chat (for group chat names, etc.)
  updateChat: async (chatId, chatData) => {
    const response = await apiClient.put(`/api/chats/${chatId}`, chatData);
    return response.data;
  },

  // Delete a chat
  deleteChat: async (chatId) => {
    const response = await apiClient.delete(`/api/chats/${chatId}`);
    return response.data;
  },

  // Add participants to group chat
  addParticipants: async (chatId, userIds) => {
    const response = await apiClient.post(`/api/chats/${chatId}/participants`, { userIds });
    return response.data;
  },

  // Remove participant from group chat
  removeParticipant: async (chatId, userId) => {
    const response = await apiClient.delete(`/api/chats/${chatId}/participants/${userId}`);
    return response.data;
  },

  // Get messages for a chat
  getMessages: async (chatId, page = 1, limit = 50) => {
    const response = await apiClient.get(`/api/chats/${chatId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Send a message
  sendMessage: async (messageData) => {
    const response = await apiClient.post('/api/messages', messageData);
    return response.data;
  },

  // Update a message
  updateMessage: async (messageId, messageData) => {
    const response = await apiClient.put(`/api/messages/${messageId}`, messageData);
    return response.data;
  },

  // Delete a message
  deleteMessage: async (chatId, messageId) => {
    const response = await apiClient.delete(`/api/chats/${chatId}/messages/${messageId}`);
    return response.data;
  },

  // Mark message as read
  markMessageAsRead: async (chatId, messageId) => {
    const response = await apiClient.put(`/api/chats/${chatId}/messages/${messageId}/read`);
    return response.data;
  },

  // Mark all messages in chat as read
  markChatAsRead: async (chatId) => {
    const response = await apiClient.put(`/api/chats/${chatId}/read`);
    return response.data;
  },

  // Search messages
  searchMessages: async (chatId, query) => {
    const response = await apiClient.get(`/api/chats/${chatId}/messages/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get chat participants
  getParticipants: async (chatId) => {
    const response = await apiClient.get(`/api/chats/${chatId}/participants`);
    return response.data;
  },

  // Upload file for chat
  uploadFile: async (file, chatId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    
    const response = await apiClient.post('/api/chats/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default chatApi;