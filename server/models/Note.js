const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    default: '',
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters'],
  },
  content: {
    type: String,
    default: '',
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index for faster queries
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: '#ffffff',
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color'],
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
  }],
}, {
  timestamps: true,
});

// Index for text search
noteSchema.index({ 
  title: 'text', 
  content: 'text',
  tags: 'text'
});

// Compound index for user-specific queries
noteSchema.index({ author: 1, createdAt: -1 });

// Virtual for excerpt
noteSchema.virtual('excerpt').get(function() {
  return this.content.length > 150 
    ? this.content.substring(0, 150) + '...'
    : this.content;
});

// Instance method to check ownership
noteSchema.methods.isOwnedBy = function(userId) {
  return this.author.toString() === userId.toString();
};

// Static method to find notes by user
noteSchema.statics.findByUser = function(userId, options = {}) {
  const query = { author: userId };
  
  if (options.archived !== undefined) {
    query.isArchived = options.archived;
  }
  
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  if (options.search) {
    query.$text = { $search: options.search };
  }
  
  return this.find(query)
    .sort(options.sort || { updatedAt: -1 })
    .limit(options.limit || 50);
};

// Pre-save middleware to clean up tags
noteSchema.pre('save', function(next) {
  if (this.isModified('tags')) {
    this.tags = this.tags
      .filter(tag => tag && tag.trim().length > 0)
      .map(tag => tag.trim().toLowerCase())
      .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
  }
  next();
});

module.exports = mongoose.model('Note', noteSchema);