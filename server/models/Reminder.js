// server/models/Reminder.js
const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  dueDate: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['personal', 'work', 'study', 'health', 'other'],
    default: 'personal'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recurrence: {
    type: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none'
    },
    interval: {
      type: Number, // e.g., every 2 weeks
      default: 1
    },
    endDate: {
      type: Date,
      default: null
    },
    daysOfWeek: [{ // For weekly recurrence
      type: Number, // 0 = Sunday, 1 = Monday, etc.
      min: 0,
      max: 6
    }],
    dayOfMonth: { // For monthly recurrence
      type: Number,
      min: 1,
      max: 31
    }
  },
  notifications: [{
    type: {
      type: String,
      enum: ['email', 'push', 'sms'],
      default: 'push'
    },
    timing: {
      type: String,
      enum: ['at_time', '5_minutes', '15_minutes', '30_minutes', '1_hour', '1_day', '1_week'],
      default: 'at_time'
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date,
      default: null
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
reminderSchema.index({ user: 1, dueDate: 1 });
reminderSchema.index({ dueDate: 1 });
reminderSchema.index({ category: 1, user: 1 });
reminderSchema.index({ priority: 1, user: 1 });
reminderSchema.index({ completed: 1, user: 1 });
reminderSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for overdue status
reminderSchema.virtual('isOverdue').get(function() {
  return !this.completed && this.dueDate < new Date();
});

// Virtual for upcoming status (within next 24 hours)
reminderSchema.virtual('isUpcoming').get(function() {
  if (this.completed) return false;
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return this.dueDate >= now && this.dueDate <= tomorrow;
});

// Virtual for time until due
reminderSchema.virtual('timeUntilDue').get(function() {
  if (this.completed) return null;
  const now = new Date();
  const timeDiff = this.dueDate.getTime() - now.getTime();
  
  if (timeDiff < 0) return 'overdue';
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
});

// Pre-save middleware to set completedAt when marking as complete
reminderSchema.pre('save', function(next) {
  if (this.isModified('completed')) {
    if (this.completed && !this.completedAt) {
      this.completedAt = new Date();
    } else if (!this.completed) {
      this.completedAt = null;
    }
  }
  next();
});

// Instance method to mark as complete
reminderSchema.methods.markComplete = function() {
  this.completed = true;
  this.completedAt = new Date();
  return this.save();
};

// Instance method to mark as incomplete
reminderSchema.methods.markIncomplete = function() {
  this.completed = false;
  this.completedAt = null;
  return this.save();
};

// Instance method to snooze reminder
reminderSchema.methods.snooze = function(newDueDate) {
  this.dueDate = new Date(newDueDate);
  // Reset notification status when snoozed
  this.notifications.forEach(notification => {
    notification.sent = false;
    notification.sentAt = null;
  });
  return this.save();
};

// Static method to find by user
reminderSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId })
    .sort({ dueDate: 1 });
};

// Static method to find by date range
reminderSchema.statics.findByDateRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    dueDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ dueDate: 1 });
};

// Static method to find by specific date
reminderSchema.statics.findByDate = function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    user: userId,
    dueDate: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).sort({ dueDate: 1 });
};

// Static method to find overdue reminders
reminderSchema.statics.findOverdue = function(userId) {
  return this.find({
    user: userId,
    completed: false,
    dueDate: { $lt: new Date() }
  }).sort({ dueDate: 1 });
};

// Static method to find upcoming reminders
reminderSchema.statics.findUpcoming = function(userId, days = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    user: userId,
    completed: false,
    dueDate: {
      $gte: now,
      $lte: futureDate
    }
  }).sort({ dueDate: 1 });
};

// Static method to search reminders
reminderSchema.statics.searchByUser = function(userId, query) {
  return this.find({
    user: userId,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  }).sort({ dueDate: 1 });
};

// Static method to get reminders by category
reminderSchema.statics.findByCategory = function(userId, category) {
  return this.find({
    user: userId,
    category: category
  }).sort({ dueDate: 1 });
};

// Static method to get reminders by priority
reminderSchema.statics.findByPriority = function(userId, priority) {
  return this.find({
    user: userId,
    priority: priority
  }).sort({ dueDate: 1 });
};

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;