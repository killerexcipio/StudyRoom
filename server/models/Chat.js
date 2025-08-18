const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  chatName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  chatImage: {
    type: String, // URL to chat image for group chats
    default: null
  },
  description: {
    type: String,
    maxlength: 250
  },
  settings: {
    muteNotifications: {
      type: Boolean,
      default: false
    },
    allowMessageDeletion: {
      type: Boolean,
      default: true
    },
    onlyAdminsCanMessage: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

// Virtual for unread message count per user
chatSchema.virtual('unreadCount').get(function() {
  // This would be calculated based on user's last read timestamp
  return 0; // Placeholder
});

// Instance method to add participant
chatSchema.methods.addParticipant = function(userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    return this.save();
  }
  return this;
};

// Instance method to remove participant
chatSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(
    participant => participant.toString() !== userId.toString()
  );
  return this.save();
};

// Static method to find chats by user
chatSchema.statics.findByUser = function(userId) {
  return this.find({ participants: userId })
    .populate('participants', 'name email avatar isOnline')
    .populate('lastMessage')
    .populate('admin', 'name email')
    .sort({ updatedAt: -1 });
};

const Chat = mongoose.model('Chat', chatSchema);
