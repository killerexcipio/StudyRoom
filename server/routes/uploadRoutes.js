// server/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(authMiddleware);

// @route   POST /api/upload/single
// @desc    Upload single file
// @access  Private
router.post('/single', uploadController.uploadSingle);

// @route   POST /api/upload/multiple
// @desc    Upload multiple files
// @access  Private
router.post('/multiple', uploadController.uploadMultiple);

// @route   POST /api/upload/image
// @desc    Upload image file
// @access  Private
router.post('/image', 
  uploadMiddleware.image('image'),
  uploadMiddleware.handleError,
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }

      res.status(201).json({
        message: 'Image uploaded successfully',
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`
        }
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ message: 'Server error while uploading image' });
    }
  }
);

// @route   POST /api/upload/document
// @desc    Upload document file
// @access  Private
router.post('/document', 
  uploadMiddleware.document('document'),
  uploadMiddleware.handleError,
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No document uploaded' });
      }

      res.status(201).json({
        message: 'Document uploaded successfully',
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`
        }
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ message: 'Server error while uploading document' });
    }
  }
);

// @route   POST /api/upload/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', 
  uploadMiddleware.avatar('avatar'),
  uploadMiddleware.handleError,
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No avatar uploaded' });
      }

      res.status(201).json({
        message: 'Avatar uploaded successfully',
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`
        }
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ message: 'Server error while uploading avatar' });
    }
  }
);

// @route   POST /api/upload/chat
// @desc    Upload file for chat
// @access  Private
router.post('/chat', uploadController.uploadChatFile);

// @route   GET /api/upload/files
// @desc    Get uploaded files for user
// @access  Private
router.get('/files', uploadController.getUserFiles);

// @route   GET /api/upload/files/:id
// @desc    Get file by ID
// @access  Private
router.get('/files/:id', uploadController.getFile);

// @route   DELETE /api/upload/files/:id
// @desc    Delete file
// @access  Private
router.delete('/files/:id', uploadController.deleteFile);

// @route   GET /api/upload/stats
// @desc    Get file upload statistics
// @access  Private
router.get('/stats', uploadController.getUploadStats);

// Error handling middleware for all upload routes
router.use(uploadMiddleware.handleError);

module.exports = router;