// server/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(authMiddleware);

// CHAT ROUTES

// @route   GET /api/chats
// @desc    Get all chats for authenticated user
// @access  Private
router.get('/', chatController.getChats);

// @route   GET /api/chats/:id
// @desc    Get single chat by ID
// @access  Private
router.get('/:id', chatController.getChat);

// @route   POST /api/chats
// @desc    Create new chat
// @access  Private
router.post('/', chatController.createChat);

// @route   PUT /api/chats/:id
// @desc    Update chat (group chats only)
// @access  Private
router.put('/:id', chatController.updateChat);

// @route   DELETE /api/chats/:id
// @desc    Delete chat
// @access  Private
router.delete('/:id', chatController.deleteChat);

// @route   POST /api/chats/:id/participants
// @desc    Add participants to group chat
// @access  Private
router.post('/:id/participants', chatController.addParticipants);

// @route   DELETE /api/chats/:id/participants/:userId
// @desc    Remove participant from group chat
// @access  Private
router.delete('/:id/participants/:userId', chatController.removeParticipant);

// @route   GET /api/chats/:id/messages
// @desc    Get messages for a chat
// @access  Private
router.get('/:id/messages', chatController.getMessages);

// @route   DELETE /api/chats/:chatId/messages/:messageId
// @desc    Delete message
// @access  Private
router.delete('/:chatId/messages/:messageId', chatController.deleteMessage);

// @route   PUT /api/chats/:chatId/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/:chatId/messages/:messageId/read', chatController.markMessageAsRead);

// MESSAGE ROUTES

// @route   POST /api/messages
// @desc    Send message
// @access  Private
router.post('/messages', chatController.sendMessage);

// @route   PUT /api/messages/:id
// @desc    Update message
// @access  Private
router.put('/messages/:id', chatController.updateMessage);

// @route   POST /api/messages/:id/reactions
// @desc    Add reaction to message
// @access  Private
router.post('/messages/:id/reactions', chatController.addReaction);

// @route   DELETE /api/messages/:id/reactions
// @desc    Remove reaction from message
// @access  Private
router.delete('/messages/:id/reactions', chatController.removeReaction);

// FILE UPLOAD ROUTES

// @route   POST /api/chats/upload
// @desc    Upload file for chat
// @access  Private
router.post('/upload', 
  uploadMiddleware.chatFile('file'),
  uploadMiddleware.handleError,
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`
        }
      });
    } catch (error) {
      console.error('Chat file upload error:', error);
      res.status(500).json({ message: 'Server error while uploading file' });
    }
  }
);

module.exports = router;