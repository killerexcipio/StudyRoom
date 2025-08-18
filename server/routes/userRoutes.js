// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', userController.getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', userController.updateProfile);

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', userController.changePassword);

// @route   GET /api/users/search
// @desc    Search users (for chat functionality)
// @access  Private
router.get('/search', userController.searchUsers);

// @route   POST /api/users/batch
// @desc    Get multiple users by IDs
// @access  Private
router.post('/batch', userController.getUsersByIds);

// @route   PUT /api/users/status
// @desc    Update user online status
// @access  Private
router.put('/status', userController.updateOnlineStatus);

// @route   GET /api/users/settings
// @desc    Get user settings/preferences
// @access  Private
router.get('/settings', userController.getSettings);

// @route   PUT /api/users/settings
// @desc    Update user settings/preferences
// @access  Private
router.put('/settings', userController.updateSettings);

// @route   GET /api/users/stats
// @desc    Get user activity statistics
// @access  Private
router.get('/stats', userController.getUserStats);

// @route   GET /api/users/online
// @desc    Get online users (for chat)
// @access  Private
router.get('/online', userController.getOnlineUsers);

// @route   GET /api/users/blocked
// @desc    Get blocked users
// @access  Private
router.get('/blocked', userController.getBlockedUsers);

// @route   POST /api/users/:id/block
// @desc    Block/Unblock user
// @access  Private
router.post('/:id/block', userController.toggleBlockUser);

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', userController.deleteAccount);

// @route   GET /api/users/:id
// @desc    Get user by ID (public info)
// @access  Private
router.get('/:id', userController.getUserById);

module.exports = router;