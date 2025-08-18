// server/models/Whiteboard.js
const mongoose = require('mongoose');

const whiteboardSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Untitled Whiteboard',
    trim: true,
    maxlength: 100
  },
  canvasData: {
    type: String, // Base64 encoded canvas data
    required: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  version: {
    type: Number,
    default: 1
  },
  metadata: {
    canvasWidth: {
      type: Number,
      default: 800
    },
    canvasHeight: {
      type: Number,
      default: 600
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
whiteboardSchema.index({ user: 1, createdAt: -1 });
whiteboardSchema.index({ tags: 1 });
whiteboardSchema.index({ title: 'text', tags: 'text' });

// Virtual for formatted creation date
whiteboardSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Virtual for formatted update date
whiteboardSchema.virtual('formattedUpdatedAt').get(function() {
  return this.updatedAt.toLocaleDateString();
});

// Pre-save middleware to update version
whiteboardSchema.pre('save', function(next) {
  if (this.isModified('canvasData') && !this.isNew) {
    this.version += 1;
  }
  next();
});

// Instance method to add collaborator
whiteboardSchema.methods.addCollaborator = function(userId, permission = 'view') {
  const existingCollaborator = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );
  
  if (!existingCollaborator) {
    this.collaborators.push({ user: userId, permission });
  } else {
    existingCollaborator.permission = permission;
  }
  
  return this.save();
};

// Instance method to remove collaborator
whiteboardSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(
    collab => collab.user.toString() !== userId.toString()
  );
  return this.save();
};

// Static method to find by user (including collaborations)
whiteboardSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { user: userId },
      { 'collaborators.user': userId }
    ]
  }).populate('user', 'name email')
    .populate('collaborators.user', 'name email')
    .sort({ updatedAt: -1 });
};

// Static method to search whiteboards
whiteboardSchema.statics.searchByUser = function(userId, query) {
  return this.find({
    $and: [
      {
        $or: [
          { user: userId },
          { 'collaborators.user': userId }
        ]
      },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  }).populate('user', 'name email')
    .sort({ updatedAt: -1 });
};

const Whiteboard = mongoose.model('Whiteboard', whiteboardSchema);

module.exports = Whiteboard;