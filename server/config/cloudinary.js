const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Force HTTPS URLs
});

// Verify Cloudinary configuration
const verifyCloudinaryConfig = async () => {
  try {
    const result = await cloudinary.api.ping();
    logger.logInfo('Cloudinary connection verified successfully');
    return result;
  } catch (error) {
    logger.logError(error);
    throw new Error('Cloudinary configuration failed: ' + error.message);
  }
};

// Storage configuration for different file types
const createCloudinaryStorage = (folder, allowedFormats, transformation = {}) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `studyroom/${folder}`,
      allowed_formats: allowedFormats,
      public_id: (req, file) => {
        const timestamp = Date.now();
        const userId = req.user?.id || 'anonymous';
        return `${userId}_${timestamp}_${file.originalname.split('.')[0]}`;
      },
      transformation: transformation,
      resource_type: 'auto', // Automatically detect file type
    },
  });
};

// Profile picture storage (images only)
const profilePictureStorage = createCloudinaryStorage(
  'profile_pictures',
  ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto:good',
    format: 'webp'
  }
);

// Note attachments storage (images and documents)
const noteAttachmentStorage = createCloudinaryStorage(
  'note_attachments',
  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt', 'rtf'],
  {
    quality: 'auto:good',
    fetch_format: 'auto'
  }
);

// Chat file storage (images, documents, videos)
const chatFileStorage = createCloudinaryStorage(
  'chat_files',
  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx', 'txt', 'zip', 'rar'],
  {
    quality: 'auto:good',
    fetch_format: 'auto'
  }
);

// Whiteboard export storage (images only)
const whiteboardStorage = createCloudinaryStorage(
  'whiteboards',
  ['jpg', 'jpeg', 'png', 'webp', 'svg'],
  {
    quality: 'auto:best',
    format: 'png'
  }
);

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  profilePicture: 5 * 1024 * 1024, // 5MB
  noteAttachment: 10 * 1024 * 1024, // 10MB
  chatFile: 25 * 1024 * 1024, // 25MB
  whiteboard: 15 * 1024 * 1024, // 15MB
};

// Create multer instances for different upload types
const createMulterUpload = (storage, sizeLimit, fileFilter = null) => {
  const config = {
    storage: storage,
    limits: {
      fileSize: sizeLimit,
      files: 5, // Maximum 5 files per request
    },
  };

  if (fileFilter) {
    config.fileFilter = fileFilter;
  }

  return multer(config);
};

// File filter for images only
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf'
  ];

  if (allowedMimes.some(mime => file.mimetype.startsWith(mime))) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

// Upload middleware instances
const uploadProfilePicture = createMulterUpload(
  profilePictureStorage,
  FILE_SIZE_LIMITS.profilePicture,
  imageFilter
);

const uploadNoteAttachment = createMulterUpload(
  noteAttachmentStorage,
  FILE_SIZE_LIMITS.noteAttachment,
  documentFilter
);

const uploadChatFile = createMulterUpload(
  chatFileStorage,
  FILE_SIZE_LIMITS.chatFile
);

const uploadWhiteboard = createMulterUpload(
  whiteboardStorage,
  FILE_SIZE_LIMITS.whiteboard,
  imageFilter
);

// Helper functions for direct Cloudinary operations
const uploadFromBuffer = async (buffer, options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: 'auto',
        quality: 'auto:good',
        fetch_format: 'auto',
        ...options
      };

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            logger.logError(error);
            reject(error);
          } else {
            logger.logInfo(`File uploaded to Cloudinary: ${result.public_id}`);
            resolve(result);
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    logger.logError(error);
    throw error;
  }
};

// Upload from URL
const uploadFromUrl = async (url, options = {}) => {
  try {
    const uploadOptions = {
      resource_type: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto',
      ...options
    };

    const result = await cloudinary.uploader.upload(url, uploadOptions);
    logger.logInfo(`File uploaded from URL to Cloudinary: ${result.public_id}`);
    return result;
  } catch (error) {
    logger.logError(error);
    throw error;
  }
};

// Delete file from Cloudinary
const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    if (result.result === 'ok') {
      logger.logInfo(`File deleted from Cloudinary: ${publicId}`);
      return true;
    } else {
      logger.logWarn(`Failed to delete file from Cloudinary: ${publicId}`);
      return false;
    }
  } catch (error) {
    logger.logError(error);
    throw error;
  }
};

// Delete multiple files
const deleteMultipleFiles = async (publicIds, resourceType = 'image') => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType
    });
    
    const deletedCount = Object.values(result.deleted).filter(status => status === 'deleted').length;
    logger.logInfo(`Deleted ${deletedCount}/${publicIds.length} files from Cloudinary`);
    
    return result;
  } catch (error) {
    logger.logError(error);
    throw error;
  }
};

// Generate transformation URL
const generateTransformationUrl = (publicId, transformations = {}) => {
  try {
    return cloudinary.url(publicId, {
      secure: true,
      ...transformations
    });
  } catch (error) {
    logger.logError(error);
    throw error;
  }
};

// Get file info
const getFileInfo = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    logger.logError(error);
    throw error;
  }
};

// Get folder contents
const getFolderContents = async (folderPath, maxResults = 100) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderPath,
      max_results: maxResults,
      resource_type: 'auto'
    });
    return result;
  } catch (error) {
    logger.logError(error);
    throw error;
  }
};

// Create archive (zip) of multiple files
const createArchive = async (publicIds, targetFormat = 'zip', options = {}) => {
  try {
    const archiveOptions = {
      resource_type: 'auto',
      type: 'upload',
      target_format: targetFormat,
      ...options
    };

    const result = await cloudinary.uploader.create_archive(archiveOptions, publicIds);
    logger.logInfo(`Archive created: ${result.secure_url}`);
    return result;
  } catch (error) {
    logger.logError(error);
    throw error;
  }
};

// Generate signed upload URL for client-side uploads
const generateSignedUploadUrl = (folder, transformation = {}) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const uploadParams = {
      timestamp: timestamp,
      folder: `studyroom/${folder}`,
      ...transformation
    };

    const signature = cloudinary.utils.api_sign_request(uploadParams, process.env.CLOUDINARY_API_SECRET);

    return {
      url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      params: {
        ...uploadParams,
        signature: signature,
        api_key: process.env.CLOUDINARY_API_KEY
      }
    };
  } catch (error) {
    logger.logError(error);
    throw error;
  }
};

// Validate file before upload
const validateFile = (file, type) => {
  const errors = [];

  // Check file size
  const sizeLimit = FILE_SIZE_LIMITS[type];
  if (file.size > sizeLimit) {
    errors.push(`File size exceeds limit of ${sizeLimit / (1024 * 1024)}MB`);
  }

  // Check file type based on upload type
  if (type === 'profilePicture' && !file.mimetype.startsWith('image/')) {
    errors.push('Profile pictures must be image files');
  }

  return errors;
};

// Initialize Cloudinary connection on module load
(async () => {
  try {
    await verifyCloudinaryConfig();
  } catch (error) {
    logger.logError(error);
    // Don't throw here as it would crash the app
    // Let individual upload attempts handle the error
  }
})();

module.exports = {
  cloudinary,
  
  // Upload middleware
  uploadProfilePicture,
  uploadNoteAttachment,
  uploadChatFile,
  uploadWhiteboard,
  
  // Direct upload functions
  uploadFromBuffer,
  uploadFromUrl,
  
  // File management
  deleteFile,
  deleteMultipleFiles,
  getFileInfo,
  getFolderContents,
  
  // Utilities
  generateTransformationUrl,
  generateSignedUploadUrl,
  createArchive,
  validateFile,
  verifyCloudinaryConfig,
  
  // Constants
  FILE_SIZE_LIMITS
};

//Gotta come back to this