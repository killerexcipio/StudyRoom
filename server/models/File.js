// server/models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  filename: {
    type: String,
    required: true,
    unique: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String,
    default: null
  },
  category: {
    type: String,
    enum: ['general', 'images', 'documents', 'audio', 'video', 'chat', 'avatar', 'whiteboard'],
    default: 'general'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  relatedModel: {
    type: String,
    enum: ['Note', 'Whiteboard', 'Chat', 'Message', 'Reminder', 'User'],
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number, // For audio/video files
    pages: Number, // For document files
    compression: String,
    exifData: mongoose.Schema.Types.Mixed
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  accessPermissions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write', 'delete'],
      default: 'read'
    }
  }],
  virusScanStatus: {
    type: String,
    enum: ['pending', 'clean', 'infected', 'error'],
    default: 'pending'
  },
  virusScanDate: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ category: 1, uploadedBy: 1 });
fileSchema.index({ mimetype: 1 });
fileSchema.index({ filename: 1 });
fileSchema.index({ originalName: 'text', description: 'text', tags: 'text' });
fileSchema.index({ relatedId: 1, relatedModel: 1 });
fileSchema.index({ isDeleted: 1 });

// Virtuals
fileSchema.virtual('fileExtension').get(function() {
  return this.originalName.split('.').pop().toLowerCase();
});

fileSchema.virtual('sizeInMB').get(function() {
  return Math.round((this.size / (1024 * 1024)) * 100) / 100;
});

fileSchema.virtual('sizeInKB').get(function() {
  return Math.round((this.size / 1024) * 100) / 100;
});

fileSchema.virtual('isImage').get(function() {
  return this.mimetype.startsWith('image/');
});

fileSchema.virtual('isVideo').get(function() {
  return this.mimetype.startsWith('video/');
});

fileSchema.virtual('isAudio').get(function() {
  return this.mimetype.startsWith('audio/');
});

fileSchema.virtual('isDocument').get(function() {
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf'
  ];
  return docTypes.includes(this.mimetype);
});

fileSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Instance methods
fileSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

fileSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return this;
};

fileSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

fileSchema.methods.grantAccess = function(userId, permission = 'read') {
  const existingPermission = this.accessPermissions.find(
    perm => perm.user.toString() === userId.toString()
  );
  
  if (existingPermission) {
    existingPermission.permission = permission;
  } else {
    this.accessPermissions.push({ user: userId, permission });
  }
  
  return this.save();
};

fileSchema.methods.revokeAccess = function(userId) {
  this.accessPermissions = this.accessPermissions.filter(
    perm => perm.user.toString() !== userId.toString()
  );
  return this.save();
};

fileSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

fileSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

// Static methods
fileSchema.statics.findByUser = function(userId, options = {}) {
  const { 
    category, 
    mimetype, 
    includeDeleted = false,
    page = 1, 
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;
  
  let query = { uploadedBy: userId };
  
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  
  if (category) {
    query.category = category;
  }
  
  if (mimetype) {
    query.mimetype = new RegExp(mimetype, 'i');
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('uploadedBy', 'name email')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

fileSchema.statics.findByCategory = function(category, userId = null) {
  let query = { category, isDeleted: false };
  
  if (userId) {
    query.uploadedBy = userId;
  }
  
  return this.find(query)
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });
};

fileSchema.statics.findByMimetype = function(mimetype, userId = null) {
  let query = { 
    mimetype: new RegExp(mimetype, 'i'),
    isDeleted: false 
  };
  
  if (userId) {
    query.uploadedBy = userId;
  }
  
  return this.find(query)
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });
};

fileSchema.statics.findRelated = function(relatedId, relatedModel) {
  return this.find({
    relatedId,
    relatedModel,
    isDeleted: false
  }).populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });
};

fileSchema.statics.searchFiles = function(userId, query) {
  return this.find({
    uploadedBy: userId,
    isDeleted: false,
    $or: [
      { originalName: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  }).populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });
};

fileSchema.statics.getStorageStats = function(userId) {
  return this.aggregate([
    { $match: { uploadedBy: userId, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        byCategory: {
          $push: {
            category: '$category',
            size: '$size'
          }
        },
        byMimetype: {
          $push: {
            mimetype: '$mimetype',
            size: '$size'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalFiles: 1,
        totalSize: 1,
        totalSizeMB: { $round: [{ $divide: ['$totalSize', 1048576] }, 2] },
        byCategory: 1,
        byMimetype: 1
      }
    }
  ]);
};

// Pre-save middleware
fileSchema.pre('save', function(next) {
  // Auto-set category based on mimetype if not set
  if (!this.category || this.category === 'general') {
    if (this.mimetype.startsWith('image/')) {
      this.category = 'images';
    } else if (this.mimetype.startsWith('video/')) {
      this.category = 'video';
    } else if (this.mimetype.startsWith('audio/')) {
      this.category = 'audio';
    } else if (this.isDocument) {
      this.category = 'documents';
    }
  }
  
  next();
});

// Post-remove middleware to clean up related data
fileSchema.post('remove', async function(doc) {
  // TODO: Clean up physical file and cloud storage
  console.log(`File ${doc.filename} removed from database`);
});

const File = mongoose.model('File', fileSchema);

module.exports = File;