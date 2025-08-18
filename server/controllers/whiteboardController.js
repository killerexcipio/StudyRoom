// server/controllers/whiteboardController.js
const Whiteboard = require('../models/Whiteboard');

const whiteboardController = {
  // @desc    Get all whiteboards for authenticated user
  // @route   GET /api/whiteboards
  // @access  Private
  getWhiteboards: async (req, res) => {
    try {
      const whiteboards = await Whiteboard.findByUser(req.user._id);
      res.json(whiteboards);
    } catch (error) {
      console.error('Get whiteboards error:', error);
      res.status(500).json({ message: 'Server error while fetching whiteboards' });
    }
  },

  // @desc    Get single whiteboard by ID
  // @route   GET /api/whiteboards/:id
  // @access  Private
  getWhiteboard: async (req, res) => {
    try {
      const whiteboard = await Whiteboard.findById(req.params.id)
        .populate('user', 'name email')
        .populate('collaborators.user', 'name email');
      
      if (!whiteboard) {
        return res.status(404).json({ message: 'Whiteboard not found' });
      }

      // Check if user has access (owner or collaborator)
      const hasAccess = whiteboard.user._id.toString() === req.user._id.toString() ||
                       whiteboard.collaborators.some(collab => 
                         collab.user._id.toString() === req.user._id.toString()
                       );

      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this whiteboard' });
      }

      res.json(whiteboard);
    } catch (error) {
      console.error('Get whiteboard error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Whiteboard not found' });
      }
      res.status(500).json({ message: 'Server error while fetching whiteboard' });
    }
  },

  // @desc    Create new whiteboard
  // @route   POST /api/whiteboards
  // @access  Private
  createWhiteboard: async (req, res) => {
    try {
      const { title, canvasData, tags, isPublic, metadata } = req.body;

      const whiteboard = new Whiteboard({
        title: title || 'Untitled Whiteboard',
        canvasData,
        tags: tags || [],
        user: req.user._id,
        isPublic: isPublic || false,
        metadata: metadata || {}
      });
      
      await whiteboard.save();
      await whiteboard.populate('user', 'name email');
      
      res.status(201).json(whiteboard);
    } catch (error) {
      console.error('Create whiteboard error:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ message: 'Server error while creating whiteboard' });
    }
  },

  // @desc    Update whiteboard
  // @route   PUT /api/whiteboards/:id
  // @access  Private
  updateWhiteboard: async (req, res) => {
    try {
      let whiteboard = await Whiteboard.findById(req.params.id);
      
      if (!whiteboard) {
        return res.status(404).json({ message: 'Whiteboard not found' });
      }

      // Check if user is owner or has edit permission
      const isOwner = whiteboard.user.toString() === req.user._id.toString();
      const hasEditAccess = whiteboard.collaborators.some(collab => 
        collab.user.toString() === req.user._id.toString() && collab.permission === 'edit'
      );

      if (!isOwner && !hasEditAccess) {
        return res.status(403).json({ message: 'Not authorized to edit this whiteboard' });
      }

      const { title, canvasData, tags, isPublic, metadata } = req.body;

      // Update fields
      if (title !== undefined) whiteboard.title = title;
      if (canvasData !== undefined) whiteboard.canvasData = canvasData;
      if (tags !== undefined) whiteboard.tags = tags;
      if (isPublic !== undefined) whiteboard.isPublic = isPublic;
      if (metadata !== undefined) whiteboard.metadata = { ...whiteboard.metadata, ...metadata };

      await whiteboard.save();
      await whiteboard.populate('user', 'name email');
      await whiteboard.populate('collaborators.user', 'name email');
      
      res.json(whiteboard);
    } catch (error) {
      console.error('Update whiteboard error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Whiteboard not found' });
      }
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ message: 'Server error while updating whiteboard' });
    }
  },

  // @desc    Delete whiteboard
  // @route   DELETE /api/whiteboards/:id
  // @access  Private
  deleteWhiteboard: async (req, res) => {
    try {
      const whiteboard = await Whiteboard.findById(req.params.id);
      
      if (!whiteboard) {
        return res.status(404).json({ message: 'Whiteboard not found' });
      }

      // Only owner can delete
      if (whiteboard.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this whiteboard' });
      }

      await whiteboard.deleteOne();
      res.json({ message: 'Whiteboard deleted successfully' });
    } catch (error) {
      console.error('Delete whiteboard error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Whiteboard not found' });
      }
      res.status(500).json({ message: 'Server error while deleting whiteboard' });
    }
  },

  // @desc    Search whiteboards
  // @route   GET /api/whiteboards/search?q=query
  // @access  Private
  searchWhiteboards: async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || q.trim() === '') {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const whiteboards = await Whiteboard.searchByUser(req.user._id, q.trim());
      res.json(whiteboards);
    } catch (error) {
      console.error('Search whiteboards error:', error);
      res.status(500).json({ message: 'Server error while searching whiteboards' });
    }
  },

  // @desc    Get whiteboards by tag
  // @route   GET /api/whiteboards/tag/:tag
  // @access  Private
  getWhiteboardsByTag: async (req, res) => {
    try {
      const { tag } = req.params;
      
      const whiteboards = await Whiteboard.find({
        user: req.user._id,
        tags: { $in: [tag] }
      }).populate('user', 'name email')
        .sort({ updatedAt: -1 });

      res.json(whiteboards);
    } catch (error) {
      console.error('Get whiteboards by tag error:', error);
      res.status(500).json({ message: 'Server error while fetching whiteboards by tag' });
    }
  },

  // @desc    Add collaborator to whiteboard
  // @route   POST /api/whiteboards/:id/collaborators
  // @access  Private
  addCollaborator: async (req, res) => {
    try {
      const { userId, permission } = req.body;
      const whiteboard = await Whiteboard.findById(req.params.id);
      
      if (!whiteboard) {
        return res.status(404).json({ message: 'Whiteboard not found' });
      }

      // Only owner can add collaborators
      if (whiteboard.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only owner can add collaborators' });
      }

      await whiteboard.addCollaborator(userId, permission);
      await whiteboard.populate('collaborators.user', 'name email');
      
      res.json(whiteboard);
    } catch (error) {
      console.error('Add collaborator error:', error);
      res.status(500).json({ message: 'Server error while adding collaborator' });
    }
  },

  // @desc    Remove collaborator from whiteboard
  // @route   DELETE /api/whiteboards/:id/collaborators/:userId
  // @access  Private
  removeCollaborator: async (req, res) => {
    try {
      const { userId } = req.params;
      const whiteboard = await Whiteboard.findById(req.params.id);
      
      if (!whiteboard) {
        return res.status(404).json({ message: 'Whiteboard not found' });
      }

      // Only owner can remove collaborators
      if (whiteboard.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only owner can remove collaborators' });
      }

      await whiteboard.removeCollaborator(userId);
      await whiteboard.populate('collaborators.user', 'name email');
      
      res.json(whiteboard);
    } catch (error) {
      console.error('Remove collaborator error:', error);
      res.status(500).json({ message: 'Server error while removing collaborator' });
    }
  }
};

module.exports = whiteboardController;