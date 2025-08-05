const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');

// @desc    Get all notes for authenticated user
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
  try {
    const { search, tags, archived, sort, limit } = req.query;
    
    const options = {
      archived: archived === 'true',
      sort: sort || { updatedAt: -1 },
      limit: parseInt(limit) || 50,
    };

    if (search) {
      options.search = search;
    }

    if (tags) {
      options.tags = tags.split(',').map(tag => tag.trim());
    }

    const notes = await Note.findByUser(req.user.id, options);
    
    res.json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      message: 'Server error while fetching notes',
    });
  }
};

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
const getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({
        message: 'Note not found',
      });
    }

    // Check if user owns the note
    if (!note.isOwnedBy(req.user.id)) {
      return res.status(403).json({
        message: 'Not authorized to access this note',
      });
    }

    res.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error('Get note error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        message: 'Note not found',
      });
    }
    res.status(500).json({
      message: 'Server error while fetching note',
    });
  }
};

// @desc    Create new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { title, content, tags, color, isPinned } = req.body;

    const noteData = {
      title: title || '',
      content: content || '',
      tags: tags || [],
      author: req.user.id,
    };

    if (color) noteData.color = color;
    if (isPinned !== undefined) noteData.isPinned = isPinned;

    const note = await Note.create(noteData);

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note,
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      message: 'Server error while creating note',
    });
  }
};

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({
        message: 'Note not found',
      });
    }

    // Check if user owns the note
    if (!note.isOwnedBy(req.user.id)) {
      return res.status(403).json({
        message: 'Not authorized to update this note',
      });
    }

    const { title, content, tags, color, isPinned, isArchived } = req.body;

    // Update fields
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (color !== undefined) note.color = color;
    if (isPinned !== undefined) note.isPinned = isPinned;
    if (isArchived !== undefined) note.isArchived = isArchived;

    await note.save();

    res.json({
      success: true,
      message: 'Note updated successfully',
      note,
    });
  } catch (error) {
    console.error('Update note error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        message: 'Note not found',
      });
    }
    res.status(500).json({
      message: 'Server error while updating note',
    });
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({
        message: 'Note not found',
      });
    }

    // Check if user owns the note
    if (!note.isOwnedBy(req.user.id)) {
      return res.status(403).json({
        message: 'Not authorized to delete this note',
      });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Delete note error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        message: 'Note not found',
      });
    }
    res.status(500).json({
      message: 'Server error while deleting note',
    });
  }
};

// @desc    Get all unique tags for user
// @route   GET /api/notes/tags
// @access  Private
const getUserTags = async (req, res) => {
  try {
    const notes = await Note.find({ author: req.user.id }).select('tags');
    
    // Extract all unique tags
    const allTags = notes.reduce((tags, note) => {
      return tags.concat(note.tags);
    }, []);
    
    const uniqueTags = [...new Set(allTags)].sort();

    res.json({
      success: true,
      tags: uniqueTags,
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      message: 'Server error while fetching tags',
    });
  }
};

// @desc    Bulk update notes
// @route   PATCH /api/notes/bulk
// @access  Private
const bulkUpdateNotes = async (req, res) => {
  try {
    const { noteIds, updates } = req.body;
    
    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({
        message: 'Note IDs are required',
      });
    }

    // Verify all notes belong to the user
    const notes = await Note.find({ 
      _id: { $in: noteIds }, 
      author: req.user.id 
    });

    if (notes.length !== noteIds.length) {
      return res.status(403).json({
        message: 'Not authorized to update some of these notes',
      });
    }

    // Perform bulk update
    await Note.updateMany(
      { _id: { $in: noteIds }, author: req.user.id },
      updates
    );

    res.json({
      success: true,
      message: `${noteIds.length} notes updated successfully`,
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      message: 'Server error while updating notes',
    });
  }
};

// Validation rules
const noteValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('content')
    .optional()
    .isLength({ max: 50000 })
    .withMessage('Content must be less than 50,000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color'),
  body('isPinned')
    .optional()
    .isBoolean()
    .withMessage('isPinned must be a boolean'),
  body('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean'),
];

module.exports = {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  getUserTags,
  bulkUpdateNotes,
  noteValidation,
};