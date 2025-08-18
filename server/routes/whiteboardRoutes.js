// server/routes/whiteboardRoutes.js
const express = require('express');
const router = express.Router();
const whiteboardController = require('../controllers/whiteboardController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/whiteboards
// @desc    Get all whiteboards for authenticated user
// @access  Private
router.get('/', whiteboardController.getWhiteboards);

// @route   GET /api/whiteboards/search
// @desc    Search whiteboards
// @access  Private
router.get('/search', whiteboardController.searchWhiteboards);

// @route   GET /api/whiteboards/tag/:tag
// @desc    Get whiteboards by tag
// @access  Private
router.get('/tag/:tag', whiteboardController.getWhiteboardsByTag);

// @route   GET /api/whiteboards/:id
// @desc    Get single whiteboard by ID
// @access  Private
router.get('/:id', whiteboardController.getWhiteboard);

// @route   POST /api/whiteboards
// @desc    Create new whiteboard
// @access  Private
router.post('/', whiteboardController.createWhiteboard);

// @route   PUT /api/whiteboards/:id
// @desc    Update whiteboard
// @access  Private
router.put('/:id', whiteboardController.updateWhiteboard);

// @route   DELETE /api/whiteboards/:id
// @desc    Delete whiteboard
// @access  Private
router.delete('/:id', whiteboardController.deleteWhiteboard);

// @route   POST /api/whiteboards/:id/collaborators
// @desc    Add collaborator to whiteboard
// @access  Private
router.post('/:id/collaborators', whiteboardController.addCollaborator);

// @route   DELETE /api/whiteboards/:id/collaborators/:userId
// @desc    Remove collaborator from whiteboard
// @access  Private
router.delete('/:id/collaborators/:userId', whiteboardController.removeCollaborator);

module.exports = router;