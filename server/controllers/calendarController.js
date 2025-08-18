// server/controllers/calendarController.js
const Reminder = require('../models/Reminder');

const calendarController = {
  // @desc    Get all reminders for authenticated user
  // @route   GET /api/reminders
  // @access  Private
  getReminders: async (req, res) => {
    try {
      const { category, priority, completed, startDate, endDate } = req.query;
      
      let query = { user: req.user._id };
      
      // Apply filters
      if (category && category !== 'all') {
        query.category = category;
      }
      
      if (priority && priority !== 'all') {
        query.priority = priority;
      }
      
      if (completed !== undefined && completed !== 'all') {
        query.completed = completed === 'true';
      }
      
      if (startDate && endDate) {
        query.dueDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const reminders = await Reminder.find(query)
        .populate('user', 'name email')
        .populate('sharedWith.user', 'name email')
        .sort({ dueDate: 1 });

      res.json(reminders);
    } catch (error) {
      console.error('Get reminders error:', error);
      res.status(500).json({ message: 'Server error while fetching reminders' });
    }
  },

  // @desc    Get single reminder by ID
  // @route   GET /api/reminders/:id
  // @access  Private
  getReminder: async (req, res) => {
    try {
      const reminder = await Reminder.findById(req.params.id)
        .populate('user', 'name email')
        .populate('sharedWith.user', 'name email');
      
      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }

      // Check if user has access (owner or shared with)
      const hasAccess = reminder.user._id.toString() === req.user._id.toString() ||
                       reminder.sharedWith.some(shared => 
                         shared.user._id.toString() === req.user._id.toString()
                       );

      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this reminder' });
      }

      res.json(reminder);
    } catch (error) {
      console.error('Get reminder error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Reminder not found' });
      }
      res.status(500).json({ message: 'Server error while fetching reminder' });
    }
  },

  // @desc    Create new reminder
  // @route   POST /api/reminders
  // @access  Private
  createReminder: async (req, res) => {
    try {
      const {
        title,
        description,
        dueDate,
        priority,
        category,
        recurrence,
        notifications,
        tags,
        location,
        isAllDay,
        color
      } = req.body;

      if (!title || !dueDate) {
        return res.status(400).json({ message: 'Title and due date are required' });
      }

      const reminder = new Reminder({
        title,
        description,
        dueDate: new Date(dueDate),
        priority: priority || 'medium',
        category: category || 'personal',
        recurrence,
        notifications: notifications || [],
        tags: tags || [],
        location,
        isAllDay: isAllDay || false,
        color: color || '#3B82F6',
        user: req.user._id,
        createdBy: req.user._id
      });
      
      await reminder.save();
      await reminder.populate('user', 'name email');
      
      res.status(201).json(reminder);
    } catch (error) {
      console.error('Create reminder error:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ message: 'Server error while creating reminder' });
    }
  },

  // @desc    Update reminder
  // @route   PUT /api/reminders/:id
  // @access  Private
  updateReminder: async (req, res) => {
    try {
      let reminder = await Reminder.findById(req.params.id);
      
      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }

      // Check if user is owner or has edit permission
      const isOwner = reminder.user.toString() === req.user._id.toString();
      const hasEditAccess = reminder.sharedWith.some(shared => 
        shared.user.toString() === req.user._id.toString() && shared.permission === 'edit'
      );

      if (!isOwner && !hasEditAccess) {
        return res.status(403).json({ message: 'Not authorized to edit this reminder' });
      }

      const updateFields = {
        title,
        description,
        dueDate,
        priority,
        category,
        completed,
        recurrence,
        notifications,
        tags,
        location,
        isAllDay,
        color
      } = req.body;

      // Update only provided fields
      Object.keys(updateFields).forEach(key => {
        if (updateFields[key] !== undefined) {
          if (key === 'dueDate') {
            reminder[key] = new Date(updateFields[key]);
          } else {
            reminder[key] = updateFields[key];
          }
        }
      });

      await reminder.save();
      await reminder.populate('user', 'name email');
      await reminder.populate('sharedWith.user', 'name email');
      
      res.json(reminder);
    } catch (error) {
      console.error('Update reminder error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Reminder not found' });
      }
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ message: 'Server error while updating reminder' });
    }
  },

  // @desc    Delete reminder
  // @route   DELETE /api/reminders/:id
  // @access  Private
  deleteReminder: async (req, res) => {
    try {
      const reminder = await Reminder.findById(req.params.id);
      
      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }

      // Only owner can delete
      if (reminder.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this reminder' });
      }

      await reminder.deleteOne();
      res.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
      console.error('Delete reminder error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Reminder not found' });
      }
      res.status(500).json({ message: 'Server error while deleting reminder' });
    }
  },

  // @desc    Get reminders by date
  // @route   GET /api/reminders/date/:date
  // @access  Private
  getRemindersByDate: async (req, res) => {
    try {
      const { date } = req.params;
      const reminders = await Reminder.findByDate(req.user._id, date);
      res.json(reminders);
    } catch (error) {
      console.error('Get reminders by date error:', error);
      res.status(500).json({ message: 'Server error while fetching reminders by date' });
    }
  },

  // @desc    Get reminders by date range
  // @route   GET /api/reminders/range?start=YYYY-MM-DD&end=YYYY-MM-DD
  // @access  Private
  getRemindersByDateRange: async (req, res) => {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ message: 'Start and end dates are required' });
      }

      const reminders = await Reminder.findByDateRange(req.user._id, start, end);
      res.json(reminders);
    } catch (error) {
      console.error('Get reminders by date range error:', error);
      res.status(500).json({ message: 'Server error while fetching reminders by date range' });
    }
  },

  // @desc    Get reminders by category
  // @route   GET /api/reminders/category/:category
  // @access  Private
  getRemindersByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      const reminders = await Reminder.findByCategory(req.user._id, category);
      res.json(reminders);
    } catch (error) {
      console.error('Get reminders by category error:', error);
      res.status(500).json({ message: 'Server error while fetching reminders by category' });
    }
  },

  // @desc    Get reminders by priority
  // @route   GET /api/reminders/priority/:priority
  // @access  Private
  getRemindersByPriority: async (req, res) => {
    try {
      const { priority } = req.params;
      const reminders = await Reminder.findByPriority(req.user._id, priority);
      res.json(reminders);
    } catch (error) {
      console.error('Get reminders by priority error:', error);
      res.status(500).json({ message: 'Server error while fetching reminders by priority' });
    }
  },

  // @desc    Get pending reminders
  // @route   GET /api/reminders/pending
  // @access  Private
  getPendingReminders: async (req, res) => {
    try {
      const reminders = await Reminder.find({
        user: req.user._id,
        completed: false
      }).sort({ dueDate: 1 });
      
      res.json(reminders);
    } catch (error) {
      console.error('Get pending reminders error:', error);
      res.status(500).json({ message: 'Server error while fetching pending reminders' });
    }
  },

  // @desc    Get completed reminders
  // @route   GET /api/reminders/completed
  // @access  Private
  getCompletedReminders: async (req, res) => {
    try {
      const reminders = await Reminder.find({
        user: req.user._id,
        completed: true
      }).sort({ completedAt: -1 });
      
      res.json(reminders);
    } catch (error) {
      console.error('Get completed reminders error:', error);
      res.status(500).json({ message: 'Server error while fetching completed reminders' });
    }
  },

  // @desc    Get overdue reminders
  // @route   GET /api/reminders/overdue
  // @access  Private
  getOverdueReminders: async (req, res) => {
    try {
      const reminders = await Reminder.findOverdue(req.user._id);
      res.json(reminders);
    } catch (error) {
      console.error('Get overdue reminders error:', error);
      res.status(500).json({ message: 'Server error while fetching overdue reminders' });
    }
  },

  // @desc    Get upcoming reminders
  // @route   GET /api/reminders/upcoming?days=7
  // @access  Private
  getUpcomingReminders: async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const reminders = await Reminder.findUpcoming(req.user._id, parseInt(days));
      res.json(reminders);
    } catch (error) {
      console.error('Get upcoming reminders error:', error);
      res.status(500).json({ message: 'Server error while fetching upcoming reminders' });
    }
  },

  // @desc    Search reminders
  // @route   GET /api/reminders/search?q=query
  // @access  Private
  searchReminders: async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || q.trim() === '') {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const reminders = await Reminder.searchByUser(req.user._id, q.trim());
      res.json(reminders);
    } catch (error) {
      console.error('Search reminders error:', error);
      res.status(500).json({ message: 'Server error while searching reminders' });
    }
  },

  // @desc    Mark reminder as complete
  // @route   PATCH /api/reminders/:id/complete
  // @access  Private
  markComplete: async (req, res) => {
    try {
      const reminder = await Reminder.findById(req.params.id);
      
      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }

      // Check if user has access
      const hasAccess = reminder.user.toString() === req.user._id.toString() ||
                       reminder.sharedWith.some(shared => 
                         shared.user.toString() === req.user._id.toString()
                       );

      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this reminder' });
      }

      await reminder.markComplete();
      res.json(reminder);
    } catch (error) {
      console.error('Mark complete error:', error);
      res.status(500).json({ message: 'Server error while marking reminder as complete' });
    }
  },

  // @desc    Mark reminder as incomplete
  // @route   PATCH /api/reminders/:id/incomplete
  // @access  Private
  markIncomplete: async (req, res) => {
    try {
      const reminder = await Reminder.findById(req.params.id);
      
      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }

      // Check if user has access
      const hasAccess = reminder.user.toString() === req.user._id.toString() ||
                       reminder.sharedWith.some(shared => 
                         shared.user.toString() === req.user._id.toString()
                       );

      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this reminder' });
      }

      await reminder.markIncomplete();
      res.json(reminder);
    } catch (error) {
      console.error('Mark incomplete error:', error);
      res.status(500).json({ message: 'Server error while marking reminder as incomplete' });
    }
  },

  // @desc    Snooze reminder
  // @route   PATCH /api/reminders/:id/snooze
  // @access  Private
  snoozeReminder: async (req, res) => {
    try {
      const { newDateTime } = req.body;
      const reminder = await Reminder.findById(req.params.id);
      
      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }

      // Check if user has access
      const hasAccess = reminder.user.toString() === req.user._id.toString() ||
                       reminder.sharedWith.some(shared => 
                         shared.user.toString() === req.user._id.toString() && shared.permission === 'edit'
                       );

      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to snooze this reminder' });
      }

      if (!newDateTime) {
        return res.status(400).json({ message: 'New date and time are required' });
      }

      await reminder.snooze(newDateTime);
      res.json(reminder);
    } catch (error) {
      console.error('Snooze reminder error:', error);
      res.status(500).json({ message: 'Server error while snoozing reminder' });
    }
  },

  // @desc    Duplicate reminder
  // @route   POST /api/reminders/:id/duplicate
  // @access  Private
  duplicateReminder: async (req, res) => {
    try {
      const { dueDate } = req.body;
      const originalReminder = await Reminder.findById(req.params.id);
      
      if (!originalReminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }

      // Check if user has access
      const hasAccess = originalReminder.user.toString() === req.user._id.toString() ||
                       originalReminder.sharedWith.some(shared => 
                         shared.user.toString() === req.user._id.toString()
                       );

      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this reminder' });
      }

      const duplicatedReminder = new Reminder({
        title: `${originalReminder.title} (Copy)`,
        description: originalReminder.description,
        dueDate: dueDate ? new Date(dueDate) : originalReminder.dueDate,
        priority: originalReminder.priority,
        category: originalReminder.category,
        recurrence: originalReminder.recurrence,
        notifications: originalReminder.notifications,
        tags: originalReminder.tags,
        location: originalReminder.location,
        isAllDay: originalReminder.isAllDay,
        color: originalReminder.color,
        user: req.user._id,
        createdBy: req.user._id
      });

      await duplicatedReminder.save();
      await duplicatedReminder.populate('user', 'name email');
      
      res.status(201).json(duplicatedReminder);
    } catch (error) {
      console.error('Duplicate reminder error:', error);
      res.status(500).json({ message: 'Server error while duplicating reminder' });
    }
  },

  // @desc    Get reminder statistics
  // @route   GET /api/reminders/stats
  // @access  Private
  getReminderStats: async (req, res) => {
    try {
      const userId = req.user._id;
      
      const stats = await Promise.all([
        Reminder.countDocuments({ user: userId }),
        Reminder.countDocuments({ user: userId, completed: true }),
        Reminder.countDocuments({ user: userId, completed: false }),
        Reminder.countDocuments({ 
          user: userId, 
          completed: false, 
          dueDate: { $lt: new Date() } 
        }),
        Reminder.countDocuments({ 
          user: userId, 
          completed: false, 
          dueDate: { 
            $gte: new Date(),
            $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
          } 
        })
      ]);

      const [total, completed, pending, overdue, upcoming] = stats;

      res.json({
        total,
        completed,
        pending,
        overdue,
        upcoming,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      });
    } catch (error) {
      console.error('Get reminder stats error:', error);
      res.status(500).json({ message: 'Server error while fetching reminder statistics' });
    }
  }
};

module.exports = calendarController;