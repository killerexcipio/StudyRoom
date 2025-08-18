// server/controllers/reminderController.js
// Note: This is an alias/alternative to calendarController.js for reminder-specific operations
const calendarController = require('./calendarController');

// Re-export all calendar controller methods as reminder controller methods
const reminderController = {
  // Basic CRUD operations
  getReminders: calendarController.getReminders,
  getReminder: calendarController.getReminder,
  createReminder: calendarController.createReminder,
  updateReminder: calendarController.updateReminder,
  deleteReminder: calendarController.deleteReminder,

  // Date-based queries
  getRemindersByDate: calendarController.getRemindersByDate,
  getRemindersByDateRange: calendarController.getRemindersByDateRange,

  // Category and priority filters
  getRemindersByCategory: calendarController.getRemindersByCategory,
  getRemindersByPriority: calendarController.getRemindersByPriority,

  // Status-based queries
  getPendingReminders: calendarController.getPendingReminders,
  getCompletedReminders: calendarController.getCompletedReminders,
  getOverdueReminders: calendarController.getOverdueReminders,
  getUpcomingReminders: calendarController.getUpcomingReminders,

  // Search functionality
  searchReminders: calendarController.searchReminders,

  // Status management
  markComplete: calendarController.markComplete,
  markIncomplete: calendarController.markIncomplete,

  // Advanced operations
  snoozeReminder: calendarController.snoozeReminder,
  duplicateReminder: calendarController.duplicateReminder,

  // Statistics
  getReminderStats: calendarController.getReminderStats
};

module.exports = reminderController;