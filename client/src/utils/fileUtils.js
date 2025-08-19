// client/src/utils/fileUtils.js
const fileUtils = {
  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file extension
  getFileExtension: (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  },

  // Get filename without extension
  getFilenameWithoutExtension: (filename) => {
    if (!filename) return '';
    return filename.substring(0, filename.lastIndexOf('.')) || filename;
  },

  // Check if file is image
  isImage: (file) => {
    if (typeof file === 'string') {
      // Check by filename extension
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
      const extension = fileUtils.getFileExtension(file);
      return imageExtensions.includes(extension);
    }
    // Check by MIME type
    return file.type && file.type.startsWith('image/');
  },

  // Check if file is video
  isVideo: (file) => {
    if (typeof file === 'string') {
      const videoExtensions = ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
      const extension = fileUtils.getFileExtension(file);
      return videoExtensions.includes(extension);
    }
    return file.type && file.type.startsWith('video/');
  },

  // Check if file is audio
  isAudio: (file) => {
    if (typeof file === 'string') {
      const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
      const extension = fileUtils.getFileExtension(file);
      return audioExtensions.includes(extension);
    }
    return file.type && file.type.startsWith('audio/');
  },

  // Check if file is document
  isDocument: (file) => {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/rtf'
    ];

    if (typeof file === 'string') {
      const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'];
      const extension = fileUtils.getFileExtension(file);
      return documentExtensions.includes(extension);
    }
    return documentTypes.includes(file.type);
  },

  // Check if file is archive
  isArchive: (file) => {
    const archiveTypes = [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip'
    ];

    if (typeof file === 'string') {
      const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
      const extension = fileUtils.getFileExtension(file);
      return archiveExtensions.includes(extension);
    }
    return archiveTypes.includes(file.type);
  },

  // Validate file type
  validateFileType: (file, allowedTypes = []) => {
    if (allowedTypes.length === 0) return true;
    
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        // Wildcard type (e.g., 'image/*')
        const baseType = type.slice(0, -2);
        return file.type.startsWith(baseType + '/');
      }
      return file.type === type;
    });
  },

  // Validate file size
  validateFileSize: (file, maxSize) => {
    return file.size <= maxSize;
  },

  // Generate unique filename
  generateUniqueFilename: (originalFilename, existingFilenames = []) => {
    const extension = fileUtils.getFileExtension(originalFilename);
    const baseName = fileUtils.getFilenameWithoutExtension(originalFilename);
    
    let counter = 1;
    let newFilename = originalFilename;
    
    while (existingFilenames.includes(newFilename)) {
      newFilename = `${baseName} (${counter}).${extension}`;
      counter++;
    }
    
    return newFilename;
  },

  // Create file preview URL
  createPreviewURL: (file) => {
    if (!file) return null;
    
    if (fileUtils.isImage(file) || fileUtils.isVideo(file)) {
      return URL.createObjectURL(file);
    }
    
    return null;
  },

  // Revoke file preview URL
  revokePreviewURL: (url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  },

  // Read file as text
  readFileAsText: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  },

  // Read file as data URL
  readFileAsDataURL: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  // Read file as array buffer
  readFileAsArrayBuffer: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  },

  // Convert file to base64
  fileToBase64: async (file) => {
    const dataURL = await fileUtils.readFileAsDataURL(file);
    return dataURL.split(',')[1]; // Remove data URL prefix
  },

  // Create download link
  downloadFile: (data, filename, mimeType = 'application/octet-stream') => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  },

  // Download URL as file
  downloadFromURL: (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Compress image file
  compressImage: (file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  },

  // Get file icon based on type
  getFileIcon: (file) => {
    if (fileUtils.isImage(file)) return '🖼️';
    if (fileUtils.isVideo(file)) return '🎥';
    if (fileUtils.isAudio(file)) return '🎵';
    if (fileUtils.isDocument(file)) return '📄';
    if (fileUtils.isArchive(file)) return '📦';
    return '📄';
  },

  // Get file type category
  getFileCategory: (file) => {
    if (fileUtils.isImage(file)) return 'image';
    if (fileUtils.isVideo(file)) return 'video';
    if (fileUtils.isAudio(file)) return 'audio';
    if (fileUtils.isDocument(file)) return 'document';
    if (fileUtils.isArchive(file)) return 'archive';
    return 'other';
  },

  // Sanitize filename
  sanitizeFilename: (filename) => {
    // Remove or replace invalid characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim();
  },

  // Convert bytes to human readable string with progress
  formatProgress: (loaded, total) => {
    const percentage = Math.round((loaded / total) * 100);
    const loadedSize = fileUtils.formatFileSize(loaded);
    const totalSize = fileUtils.formatFileSize(total);
    return `${percentage}% (${loadedSize} / ${totalSize})`;
  },

  // Validate multiple files
  validateFiles: (files, options = {}) => {
    const {
      maxSize = 50 * 1024 * 1024, // 50MB
      maxFiles = 10,
      allowedTypes = []
    } = options;

    const errors = [];
    const validFiles = [];

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { validFiles: [], errors };
    }

    files.forEach((file, index) => {
      const fileErrors = [];

      if (!fileUtils.validateFileSize(file, maxSize)) {
        fileErrors.push(`File ${index + 1}: Size exceeds ${fileUtils.formatFileSize(maxSize)}`);
      }

      if (allowedTypes.length > 0 && !fileUtils.validateFileType(file, allowedTypes)) {
        fileErrors.push(`File ${index + 1}: Invalid file type`);
      }

      if (fileErrors.length === 0) {
        validFiles.push(file);
      } else {
        errors.push(...fileErrors);
      }
    });

    return { validFiles, errors };
  }
};

export default fileUtils;

