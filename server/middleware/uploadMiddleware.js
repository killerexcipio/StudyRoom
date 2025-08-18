// server/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create subdirectories based on file type
    let subDir = 'general';
    
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype.startsWith('audio/')) {
      subDir = 'audio';
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'video';
    } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) {
      subDir = 'documents';
    }

    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, `${sanitizedBaseName}_${uniqueSuffix}${extension}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedMimeTypes = {
    // Images
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'image/svg+xml': true,
    
    // Documents
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'application/vnd.ms-excel': true,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
    'application/vnd.ms-powerpoint': true,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': true,
    'text/plain': true,
    'text/csv': true,
    'application/rtf': true,
    
    // Audio
    'audio/mpeg': true,
    'audio/mp3': true,
    'audio/wav': true,
    'audio/ogg': true,
    'audio/aac': true,
    'audio/m4a': true,
    
    // Video
    'video/mp4': true,
    'video/mpeg': true,
    'video/quicktime': true,
    'video/webm': true,
    'video/avi': true,
    'video/mov': true,
    
    // Archives
    'application/zip': true,
    'application/x-rar-compressed': true,
    'application/x-7z-compressed': true,
    
    // Other
    'application/json': true
  };

  if (allowedMimeTypes[file.mimetype]) {
    cb(null, true);
  } else {
    const error = new Error(`File type not allowed: ${file.mimetype}`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Size limits based on file type
const getFileSizeLimit = (mimetype) => {
  if (mimetype.startsWith('image/')) {
    return 10 * 1024 * 1024; // 10MB for images
  } else if (mimetype.startsWith('video/')) {
    return 100 * 1024 * 1024; // 100MB for videos
  } else if (mimetype.startsWith('audio/')) {
    return 50 * 1024 * 1024; // 50MB for audio
  } else {
    return 25 * 1024 * 1024; // 25MB for documents and others
  }
};

// Custom file size validation
const checkFileSize = (req, file, cb) => {
  const maxSize = getFileSizeLimit(file.mimetype);
  
  // Note: This is a basic check, actual size validation happens in multer limits
  cb(null, true);
};

// Base multer configuration
const createUploadMiddleware = (options = {}) => {
  const {
    maxFiles = 10,
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = null
  } = options;

  return multer({
    storage: storage,
    fileFilter: allowedTypes ? (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        const error = new Error(`File type not allowed: ${file.mimetype}`);
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
      }
    } : fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
      fieldSize: 2 * 1024 * 1024, // 2MB field size
      fieldNameSize: 50, // 50 bytes field name size
      headerPairs: 2000
    }
  });
};

// Pre-configured middleware for different use cases
const uploadMiddleware = {
  // Single file upload
  single: (fieldName = 'file', options = {}) => {
    const upload = createUploadMiddleware(options);
    return upload.single(fieldName);
  },

  // Multiple files upload
  multiple: (fieldName = 'files', maxCount = 10, options = {}) => {
    const upload = createUploadMiddleware({ ...options, maxFiles: maxCount });
    return upload.array(fieldName, maxCount);
  },

  // Image upload only
  image: (fieldName = 'image') => {
    const imageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    const upload = createUploadMiddleware({
      maxFileSize: 10 * 1024 * 1024, // 10MB for images
      allowedTypes: imageTypes
    });
    
    return upload.single(fieldName);
  },

  // Document upload only
  document: (fieldName = 'document') => {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const upload = createUploadMiddleware({
      maxFileSize: 25 * 1024 * 1024, // 25MB for documents
      allowedTypes: documentTypes
    });
    
    return upload.single(fieldName);
  },

  // Chat file upload (smaller size limit)
  chatFile: (fieldName = 'file') => {
    const upload = createUploadMiddleware({
      maxFileSize: 20 * 1024 * 1024 // 20MB for chat files
    });
    
    return upload.single(fieldName);
  },

  // Profile avatar upload
  avatar: (fieldName = 'avatar') => {
    const imageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    const upload = createUploadMiddleware({
      maxFileSize: 5 * 1024 * 1024, // 5MB for avatars
      allowedTypes: imageTypes
    });
    
    return upload.single(fieldName);
  },

  // Error handling middleware
  handleError: (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          return res.status(400).json({
            success: false,
            message: 'File too large. Please upload a smaller file.'
          });
        case 'LIMIT_FILE_COUNT':
          return res.status(400).json({
            success: false,
            message: 'Too many files. Please upload fewer files.'
          });
        case 'LIMIT_UNEXPECTED_FILE':
          return res.status(400).json({
            success: false,
            message: 'Unexpected file field.'
          });
        case 'LIMIT_PART_COUNT':
          return res.status(400).json({
            success: false,
            message: 'Too many parts in the request.'
          });
        case 'LIMIT_FIELD_KEY':
          return res.status(400).json({
            success: false,
            message: 'Field name too long.'
          });
        case 'LIMIT_FIELD_VALUE':
          return res.status(400).json({
            success: false,
            message: 'Field value too long.'
          });
        case 'LIMIT_FIELD_COUNT':
          return res.status(400).json({
            success: false,
            message: 'Too many fields.'
          });
        default:
          return res.status(400).json({
            success: false,
            message: 'File upload error.'
          });
      }
    }

    if (error.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  },

  // File validation helpers
  validateFileType: (allowedTypes) => (req, res, next) => {
    if (!req.file) {
      return next();
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `File type ${req.file.mimetype} is not allowed`
      });
    }

    next();
  },

  validateFileSize: (maxSize) => (req, res, next) => {
    if (!req.file) {
      return next();
    }

    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds limit of ${Math.round(maxSize / (1024 * 1024))}MB`
      });
    }

    next();
  }
};

module.exports = uploadMiddleware;