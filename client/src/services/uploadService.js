// client/src/services/uploadService.js
import apiClient from './apiClient';

const uploadService = {
  // Upload single file
  uploadSingle: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add optional parameters
      if (options.category) formData.append('category', options.category);
      if (options.description) formData.append('description', options.description);
      if (options.relatedId) formData.append('relatedId', options.relatedId);
      if (options.relatedModel) formData.append('relatedModel', options.relatedModel);

      const response = await apiClient.post('/api/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: options.onProgress
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload multiple files
  uploadMultiple: async (files, options = {}) => {
    try {
      const formData = new FormData();
      
      // Add files
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Add optional parameters
      if (options.category) formData.append('category', options.category);
      if (options.description) formData.append('description', options.description);

      const response = await apiClient.post('/api/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: options.onProgress
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload chat file
  uploadChatFile: async (file, chatId, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', chatId);

      const response = await apiClient.post('/api/upload/chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: options.onProgress
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload avatar
  uploadAvatar: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'avatar');

      const response = await apiClient.post('/api/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: options.onProgress
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user's uploaded files
  getUserFiles: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/upload/files', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get file by ID
  getFile: async (fileId) => {
    try {
      const response = await apiClient.get(`/api/upload/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete file
  deleteFile: async (fileId) => {
    try {
      const response = await apiClient.delete(`/api/upload/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get upload statistics
  getUploadStats: async () => {
    try {
      const response = await apiClient.get('/api/upload/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Download file
  downloadFile: async (fileId, filename) => {
    try {
      const response = await apiClient.get(`/api/upload/files/${fileId}/download`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Validate file before upload
  validateFile: (file, options = {}) => {
    const {
      maxSize = 50 * 1024 * 1024, // 50MB default
      allowedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],
      allowedExtensions = []
    } = options;

    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${uploadService.formatFileSize(maxSize)} limit`);
    }

    // Check file type
    if (allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isAllowed) {
        errors.push('File type not allowed');
      }
    }

    // Check file extension
    if (allowedExtensions.length > 0) {
      const extension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        errors.push('File extension not allowed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Utility function to format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file extension
  getFileExtension: (filename) => {
    return filename.split('.').pop().toLowerCase();
  },

  // Check if file is image
  isImage: (file) => {
    return file.type.startsWith('image/');
  },

  // Check if file is video
  isVideo: (file) => {
    return file.type.startsWith('video/');
  },

  // Check if file is audio
  isAudio: (file) => {
    return file.type.startsWith('audio/');
  },

  // Check if file is document
  isDocument: (file) => {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf'
    ];
    return documentTypes.includes(file.type);
  },

  // Create file preview URL
  createPreviewURL: (file) => {
    if (uploadService.isImage(file)) {
      return URL.createObjectURL(file);
    }
    return null;
  },

  // Cleanup preview URL
  revokePreviewURL: (url) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
};

export default uploadService;