// server/routes/calendarRoutes.js
const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/reminders
// @desc    Get all reminders for authenticated user
// @access  Private
router.get('/', calendarController.getReminders);

// @route   GET /api/reminders/search
// @desc    Search reminders
// @access  Private
router.get('/search', calendarController.searchReminders);

// @route   GET /api/reminders/stats
// @desc    Get reminder statistics
// @access  Private
router.get('/stats', calendarController.getReminderStats);

// @route   GET /api/reminders/pending
// @desc    Get pending reminders
// @access  Private
router.get('/pending', calendarController.getPendingReminders);

// @route   GET /api/reminders/completed
// @desc    Get completed reminders
// @access  Private
router.get('/completed', calendarController.getCompletedReminders);

// @route   GET /api/reminders/overdue
// @desc    Get overdue reminders
// @access  Private
router.get('/overdue', calendarController.getOverdueReminders);

// @route   GET /api/reminders/upcoming
// @desc    Get upcoming reminders
// @access  Private
router.get('/upcoming', calendarController.getUpcomingReminders);

// @route   GET /api/reminders/range
// @desc    Get reminders by date range
// @access  Private
router.get('/range', calendarController.getRemindersByDateRange);

// @route   GET /api/reminders/category/:category
// @desc    Get reminders by category
// @access  Private
router.get('/category/:category', calendarController.getRemindersByCategory);

// @route   GET /api/reminders/priority/:priority
// @desc    Get reminders by priority
// @access  Private
router.get('/priority/:priority', calendarController.getRemindersByPriority);

// @route   GET /api/reminders/date/:date
// @desc    Get reminders by specific date
// @access  Private
router.get('/date/:date', calendarController.getRemindersByDate);

// @route   GET /api/reminders/:id
// @desc    Get single reminder by ID
// @access  Private
router.get('/:id', calendarController.getReminder);

// @route   POST /api/reminders
// @desc    Create new reminder
// @access  Private
router.post('/', calendarController.createReminder);

// @route   PUT /api/reminders/:id
// @desc    Update reminder
// @access  Private
router.put('/:id', calendarController.updateReminder);

// @route   DELETE /api/reminders/:id
// @desc    Delete reminder
// @access  Private
router.delete('/:id', calendarController.deleteReminder);

// @route   PATCH /api/reminders/:id/complete
// @desc    Mark reminder as complete
// @access  Private
router.patch('/:id/complete', calendarController.markComplete);

// @route   PATCH /api/reminders/:id/incomplete
// @desc    Mark reminder as incomplete
// @access  Private
router.patch('/:id/incomplete', calendarController.markIncomplete);

// @route   PATCH /api/reminders/:id/snooze
// @desc    Snooze reminder
// @access  Private
router.patch('/:id/snooze', calendarController.snoozeReminder);

// @route   POST /api/reminders/:id/duplicate
// @desc    Duplicate reminder
// @access  Private
router.post('/:id/duplicate', calendarController.duplicateReminder);

module.exports = router;