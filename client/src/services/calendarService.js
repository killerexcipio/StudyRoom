import apiClient from './apiClient';

const calendarService = {
  // Get all reminders for the current user
  getReminders: async () => {
    const response = await apiClient.get('/api/reminders');
    return response.data;
  },

  // Get a single reminder by ID
  getReminder: async (id) => {
    const response = await apiClient.get(`/api/reminders/${id}`);
    return response.data;
  },

  // Create a new reminder
  createReminder: async (reminderData) => {
    const response = await apiClient.post('/api/reminders', reminderData);
    return response.data;
  },

  // Update an existing reminder
  updateReminder: async (id, reminderData) => {
    const response = await apiClient.put(`/api/reminders/${id}`, reminderData);
    return response.data;
  },

  // Delete a reminder
  deleteReminder: async (id) => {
    const response = await apiClient.delete(`/api/reminders/${id}`);
    return response.data;
  },

  // Get reminders for a specific date
  getRemindersByDate: async (date) => {
    const dateString = new Date(date).toISOString().split('T')[0];
    const response = await apiClient.get(`/api/reminders/date/${dateString}`);
    return response.data;
  },

  // Get reminders within a date range
  getRemindersByDateRange: async (startDate, endDate) => {
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];
    const response = await apiClient.get(`/api/reminders/range?start=${start}&end=${end}`);
    return response.data;
  },

  // Get reminders by category
  getRemindersByCategory: async (category) => {
    const response = await apiClient.get(`/api/reminders/category/${category}`);
    return response.data;
  },

  // Get reminders by priority
  getRemindersByPriority: async (priority) => {
    const response = await apiClient.get(`/api/reminders/priority/${priority}`);
    return response.data;
  },

  // Get pending reminders (not completed)
  getPendingReminders: async () => {
    const response = await apiClient.get('/api/reminders/pending');
    return response.data;
  },

  // Get completed reminders
  getCompletedReminders: async () => {
    const response = await apiClient.get('/api/reminders/completed');
    return response.data;
  },

  // Get overdue reminders
  getOverdueReminders: async () => {
    const response = await apiClient.get('/api/reminders/overdue');
    return response.data;
  },

  // Get upcoming reminders (next 7 days)
  getUpcomingReminders: async () => {
    const response = await apiClient.get('/api/reminders/upcoming');
    return response.data;
  },

  // Search reminders
  searchReminders: async (query) => {
    const response = await apiClient.get(`/api/reminders/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Mark reminder as complete
  markComplete: async (id) => {
    const response = await apiClient.patch(`/api/reminders/${id}/complete`);
    return response.data;
  },

  // Mark reminder as incomplete
  markIncomplete: async (id) => {
    const response = await apiClient.patch(`/api/reminders/${id}/incomplete`);
    return response.data;
  },

  // Snooze reminder (postpone to a new date/time)
  snoozeReminder: async (id, newDateTime) => {
    const response = await apiClient.patch(`/api/reminders/${id}/snooze`, {
      newDateTime: new Date(newDateTime).toISOString()
    });
    return response.data;
  },

  // Duplicate a reminder
  duplicateReminder: async (id, newDate) => {
    const response = await apiClient.post(`/api/reminders/${id}/duplicate`, {
      dueDate: new Date(newDate).toISOString()
    });
    return response.data;
  },

  // Get reminder statistics
  getReminderStats: async () => {
    const response = await apiClient.get('/api/reminders/stats');
    return response.data;
  },

  // Bulk operations
  bulkUpdateReminders: async (reminderIds, updates) => {
    const response = await apiClient.patch('/api/reminders/bulk', {
      reminderIds,
      updates
    });
    return response.data;
  },

  // Bulk delete reminders
  bulkDeleteReminders: async (reminderIds) => {
    const response = await apiClient.delete('/api/reminders/bulk', {
      data: { reminderIds }
    });
    return response.data;
  }
};

export default calendarService;