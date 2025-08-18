// server/models/Message.js
const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'voice', 'video'],
    default: 'text'
  },
  fileUrl: {
    type: String, // For file attachments
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  editedAt: {
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
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ content: 'text' });

// Virtual for message status (sent, delivered, read)
messageSchema.virtual('status').get(function() {
  if (this.readBy.length > 0) return 'read';
  return 'sent'; // In a real app, you'd track delivery status
});

// Pre-save middleware to update chat's lastMessage
messageSchema.post('save', async function(doc) {
  try {
    await Chat.findByIdAndUpdate(doc.chat, {
      lastMessage: doc._id,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating last message:', error);
  }
});

// Instance method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(
    read => read.user.toString() === userId.toString()
  );
  
  if (!existingRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    return this.save();
  }
  
  return this;
};

// Instance method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(
    reaction => reaction.user.toString() === userId.toString()
  );
  
  if (existingReaction) {
    existingReaction.emoji = emoji;
  } else {
    this.reactions.push({ user: userId, emoji });
  }
  
  return this.save();
};

// Instance method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  return this.save();
};

// Static method to get messages for chat with pagination
messageSchema.statics.getByChatId = function(chatId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    chat: chatId, 
    isDeleted: false 
  })
    .populate('sender', 'name email avatar')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const Message = mongoose.model('Message', messageSchema);

module.exports = { Chat, Message };