// server/controllers/uploadController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('cloudinary').v2;
const File = require('../models/File');

// Configure Cloudinary (if using cloud storage)
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'text/plain': true,
    'audio/mpeg': true,
    'audio/wav': true,
    'video/mp4': true,
    'video/webm': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, audio, and video files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: fileFilter
});

const uploadController = {
  // @desc    Upload single file
  // @route   POST /api/upload/single
  // @access  Private
  uploadSingle: [
    upload.single('file'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const { category = 'general', description = '' } = req.body;
        
        let fileUrl = `/uploads/${req.file.filename}`;
        let publicId = null;

        // Upload to Cloudinary if configured
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          try {
            const result = await cloudinary.uploader.upload(req.file.path, {
              folder: `studyroom/${category}`,
              resource_type: 'auto'
            });
            
            fileUrl = result.secure_url;
            publicId = result.public_id;
            
            // Delete local file after successful cloud upload
            await fs.unlink(req.file.path);
          } catch (cloudError) {
            console.error('Cloudinary upload error:', cloudError);
            // Continue with local file if cloud upload fails
          }
        }

        // Save file metadata to database
        const fileRecord = new File({
          originalName: req.file.originalname,
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          cloudinaryId: publicId,
          category,
          description,
          uploadedBy: req.user._id
        });

        await fileRecord.save();
        await fileRecord.populate('uploadedBy', 'name email');

        res.status(201).json({
          message: 'File uploaded successfully',
          file: fileRecord
        });
      } catch (error) {
        console.error('Upload single file error:', error);
        
        // Clean up local file if exists
        if (req.file && req.file.path) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }
        
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
        }
        
        res.status(500).json({ message: 'Server error while uploading file' });
      }
    }
  ],

  // @desc    Upload multiple files
  // @route   POST /api/upload/multiple
  // @access  Private
  uploadMultiple: [
    upload.array('files', 10), // Maximum 10 files
    async (req, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: 'No files uploaded' });
        }

        const { category = 'general', description = '' } = req.body;
        const uploadedFiles = [];

        for (const file of req.files) {
          try {
            let fileUrl = `/uploads/${file.filename}`;
            let publicId = null;

            // Upload to Cloudinary if configured
            if (process.env.CLOUDINARY_CLOUD_NAME) {
              try {
                const result = await cloudinary.uploader.upload(file.path, {
                  folder: `studyroom/${category}`,
                  resource_type: 'auto'
                });
                
                fileUrl = result.secure_url;
                publicId = result.public_id;
                
                // Delete local file after successful cloud upload
                await fs.unlink(file.path);
              } catch (cloudError) {
                console.error('Cloudinary upload error:', cloudError);
                // Continue with local file if cloud upload fails
              }
            }

            // Save file metadata to database
            const fileRecord = new File({
              originalName: file.originalname,
              filename: file.filename,
              mimetype: file.mimetype,
              size: file.size,
              url: fileUrl,
              cloudinaryId: publicId,
              category,
              description,
              uploadedBy: req.user._id
            });

            await fileRecord.save();
            await fileRecord.populate('uploadedBy', 'name email');
            uploadedFiles.push(fileRecord);
          } catch (fileError) {
            console.error(`Error uploading file ${file.originalname}:`, fileError);
            // Clean up local file if exists
            if (file.path) {
              try {
                await fs.unlink(file.path);
              } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
              }
            }
          }
        }

        res.status(201).json({
          message: `${uploadedFiles.length} file(s) uploaded successfully`,
          files: uploadedFiles
        });
      } catch (error) {
        console.error('Upload multiple files error:', error);
        
        // Clean up local files if they exist
        if (req.files) {
          for (const file of req.files) {
            if (file.path) {
              try {
                await fs.unlink(file.path);
              } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
              }
            }
          }
        }
        
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'One or more files are too large. Maximum size is 50MB per file.' });
        }
        
        res.status(500).json({ message: 'Server error while uploading files' });
      }
    }
  ],

  // @desc    Upload chat attachment
  // @route   POST /api/upload/chat
  // @access  Private
  uploadChatFile: [
    upload.single('file'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const { chatId } = req.body;
        
        if (!chatId) {
          return res.status(400).json({ message: 'Chat ID is required' });
        }

        let fileUrl = `/uploads/${req.file.filename}`;
        let publicId = null;

        // Upload to Cloudinary if configured
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          try {
            const result = await cloudinary.uploader.upload(req.file.path, {
              folder: 'studyroom/chat',
              resource_type: 'auto'
            });
            
            fileUrl = result.secure_url;
            publicId = result.public_id;
            
            // Delete local file after successful cloud upload
            await fs.unlink(req.file.path);
          } catch (cloudError) {
            console.error('Cloudinary upload error:', cloudError);
            // Continue with local file if cloud upload fails
          }
        }

        // Save file metadata to database
        const fileRecord = new File({
          originalName: req.file.originalname,
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          cloudinaryId: publicId,
          category: 'chat',
          relatedId: chatId,
          uploadedBy: req.user._id
        });

        await fileRecord.save();

        res.status(201).json({
          message: 'Chat file uploaded successfully',
          file: {
            id: fileRecord._id,
            originalName: fileRecord.originalName,
            url: fileRecord.url,
            mimetype: fileRecord.mimetype,
            size: fileRecord.size
          }
        });
      } catch (error) {
        console.error('Upload chat file error:', error);
        
        // Clean up local file if exists
        if (req.file && req.file.path) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }
        
        res.status(500).json({ message: 'Server error while uploading chat file' });
      }
    }
  ],

  // @desc    Get uploaded files for user
  // @route   GET /api/upload/files
  // @access  Private
  getUserFiles: async (req, res) => {
    try {
      const { category, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;
      
      let query = { uploadedBy: req.user._id };
      
      if (category && category !== 'all') {
        query.category = category;
      }

      const files = await File.find(query)
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await File.countDocuments(query);

      res.json({
        files,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get user files error:', error);
      res.status(500).json({ message: 'Server error while fetching files' });
    }
  },

  // @desc    Get file by ID
  // @route   GET /api/upload/files/:id
  // @access  Private
  getFile: async (req, res) => {
    try {
      const file = await File.findById(req.params.id)
        .populate('uploadedBy', 'name email');
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Check if user has access to the file
      if (file.uploadedBy._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied to this file' });
      }

      res.json(file);
    } catch (error) {
      console.error('Get file error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'File not found' });
      }
      res.status(500).json({ message: 'Server error while fetching file' });
    }
  },

  // @desc    Delete file
  // @route   DELETE /api/upload/files/:id
  // @access  Private
  deleteFile: async (req, res) => {
    try {
      const file = await File.findById(req.params.id);
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Check if user owns the file
      if (file.uploadedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this file' });
      }

      // Delete from Cloudinary if it exists
      if (file.cloudinaryId) {
        try {
          await cloudinary.uploader.destroy(file.cloudinaryId);
        } catch (cloudError) {
          console.error('Cloudinary deletion error:', cloudError);
        }
      } else {
        // Delete local file
        try {
          const filePath = path.join(__dirname, '../uploads', file.filename);
          await fs.unlink(filePath);
        } catch (fileError) {
          console.error('Local file deletion error:', fileError);
        }
      }

      // Delete from database
      await file.deleteOne();
      
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Delete file error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'File not found' });
      }
      res.status(500).json({ message: 'Server error while deleting file' });
    }
  },

  // @desc    Get file upload statistics
  // @route   GET /api/upload/stats
  // @access  Private
  getUploadStats: async (req, res) => {
    try {
      const userId = req.user._id;
      
      const stats = await Promise.all([
        File.countDocuments({ uploadedBy: userId }),
        File.aggregate([
          { $match: { uploadedBy: userId } },
          { $group: { _id: null, totalSize: { $sum: '$size' } } }
        ]),
        File.aggregate([
          { $match: { uploadedBy: userId } },
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),
        File.aggregate([
          { $match: { uploadedBy: userId } },
          { $group: { _id: '$mimetype', count: { $sum: 1 } } }
        ])
      ]);

      const [totalFiles, sizeStats, categoryStats, typeStats] = stats;
      const totalSize = sizeStats.length > 0 ? sizeStats[0].totalSize : 0;

      res.json({
        totalFiles,
        totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        byCategory: categoryStats,
        byType: typeStats
      });
    } catch (error) {
      console.error('Get upload stats error:', error);
      res.status(500).json({ message: 'Server error while fetching upload statistics' });
    }
  }
};

module.exports = uploadController;