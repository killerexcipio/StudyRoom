const express = require('express');
const {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  getUserTags,
  bulkUpdateNotes,
  noteValidation,
} = require('../controllers/noteController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/notes
// @desc    Get all notes for authenticated user
// @access  Private
router.get('/', getNotes);

// @route   GET /api/notes/tags
// @desc    Get all unique tags for user
// @access  Private
router.get('/tags', getUserTags);

// @route   POST /api/notes
// @desc    Create new note
// @access  Private
router.post('/', noteValidation, createNote);

// @route   PATCH /api/notes/bulk
// @desc    Bulk update notes
// @access  Private
router.patch('/bulk', bulkUpdateNotes);

// @route   GET /api/notes/:id
// @desc    Get single note
// @access  Private
router.get('/:id', getNote);

// @route   PUT /api/notes/:id
// @desc    Update note
// @access  Private
router.put('/:id', noteValidation, updateNote);

// @route   DELETE /api/notes/:id
// @desc    Delete note
// @access  Private
router.delete('/:id', deleteNote);

module.exports = router;