// client/src/pages/Calendar/CalendarView.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, Edit3, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { getReminders, createReminder, updateReminder, deleteReminder } from '../../features/calendar/calendarSlice';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  
  const dispatch = useDispatch();
  const { reminders, loading, error } = useSelector(state => state.calendar);

  useEffect(() => {
    dispatch(getReminders());
  }, [dispatch]);

  // Calendar helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  };

  const getRemindersForDate = (date) => {
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.dueDate);
      return isSameDate(reminderDate, date);
    });
  };

  const hasReminders = (date) => {
    return getRemindersForDate(date).length > 0;
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayReminders = getRemindersForDate(date);
      const isSelected = isSameDate(date, selectedDate);
      const isTodayDate = isToday(date);
      const hasReminderDots = hasReminders(date);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`
            h-12 flex flex-col items-center justify-center cursor-pointer rounded-lg transition-colors relative
            ${isSelected 
              ? 'bg-blue-600 text-white' 
              : isTodayDate 
                ? 'bg-blue-100 text-blue-600 font-semibold' 
                : hasReminderDots
                  ? 'bg-blue-50 hover:bg-blue-100'
                  : 'hover:bg-gray-100'
            }
          `}
        >
          <span className="text-sm">{day}</span>
          {hasReminderDots && (
            <div className="flex space-x-1 mt-1">
              {dayReminders.slice(0, 3).map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-blue-500'
                  }`}
                />
              ))}
              {dayReminders.length > 3 && (
                <span className={`text-xs ${isSelected ? 'text-white' : 'text-blue-600'}`}>
                  +{dayReminders.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const selectedDateReminders = getRemindersForDate(selectedDate);
  const completedReminders = selectedDateReminders.filter(r => r.completed);
  const pendingReminders = selectedDateReminders.filter(r => !r.completed);

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
        <button
          onClick={() => setShowReminderModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Add Reminder</span>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            {/* Calendar days */}
            {renderCalendarDays()}
          </div>
        </div>

        {/* Reminders Sidebar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: selectedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
              })}
            </h3>
            <span className="text-sm text-gray-500">
              {selectedDateReminders.length} reminder{selectedDateReminders.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Pending Reminders */}
            {pendingReminders.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Pending</h4>
                <div className="space-y-2">
                  {pendingReminders.map(reminder => (
                    <ReminderCard
                      key={reminder._id}
                      reminder={reminder}
                      onToggleComplete={() => dispatch(updateReminder({
                        id: reminder._id,
                        updates: { completed: !reminder.completed }
                      }))}
                      onEdit={() => {
                        setEditingReminder(reminder);
                        setShowReminderModal(true);
                      }}
                      onDelete={() => dispatch(deleteReminder(reminder._id))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Reminders */}
            {completedReminders.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Completed</h4>
                <div className="space-y-2">
                  {completedReminders.map(reminder => (
                    <ReminderCard
                      key={reminder._id}
                      reminder={reminder}
                      onToggleComplete={() => dispatch(updateReminder({
                        id: reminder._id,
                        updates: { completed: !reminder.completed }
                      }))}
                      onEdit={() => {
                        setEditingReminder(reminder);
                        setShowReminderModal(true);
                      }}
                      onDelete={() => dispatch(deleteReminder(reminder._id))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {selectedDateReminders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm">No reminders for this date</p>
                <button
                  onClick={() => setShowReminderModal(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Add a reminder
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <ReminderModal
          reminder={editingReminder}
          selectedDate={selectedDate}
          onClose={() => {
            setShowReminderModal(false);
            setEditingReminder(null);
          }}
          onSave={(reminderData) => {
            if (editingReminder) {
              dispatch(updateReminder({
                id: editingReminder._id,
                updates: reminderData
              }));
            } else {
              dispatch(createReminder(reminderData));
            }
            setShowReminderModal(false);
            setEditingReminder(null);
          }}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

const ReminderCard = ({ reminder, onToggleComplete, onEdit, onDelete }) => {
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`p-3 rounded-lg border ${reminder.completed ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'} group`}>
      <div className="flex items-start space-x-3">
        <button
          onClick={onToggleComplete}
          className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center ${
            reminder.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 hover:border-blue-500'
          }`}
        >
          {reminder.completed && <Check size={12} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${reminder.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
            {reminder.title}
          </p>
          {reminder.description && (
            <p className={`text-xs mt-1 ${reminder.completed ? 'text-gray-400' : 'text-gray-600'}`}>
              {reminder.description}
            </p>
          )}
          {reminder.time && (
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <Clock size={12} className="mr-1" />
              {formatTime(reminder.dueDate)}
            </div>
          )}
          {reminder.priority && reminder.priority !== 'medium' && (
            <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
              reminder.priority === 'high' 
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {reminder.priority} priority
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
          >
            <Edit3 size={12} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ReminderModal = ({ reminder, selectedDate, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: reminder?.title || '',
    description: reminder?.description || '',
    dueDate: reminder?.dueDate ? new Date(reminder.dueDate).toISOString().split('T')[0] : 
             selectedDate.toISOString().split('T')[0],
    time: reminder?.dueDate ? new Date(reminder.dueDate).toTimeString().slice(0, 5) : '',
    priority: reminder?.priority || 'medium',
    category: reminder?.category || 'personal'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Combine date and time
    let dueDate = new Date(formData.dueDate);
    if (formData.time) {
      const [hours, minutes] = formData.time.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes));
    }

    onSave({
      ...formData,
      dueDate: dueDate.toISOString(),
      completed: reminder?.completed || false
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            {reminder ? 'Edit Reminder' : 'New Reminder'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="study">Study</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {reminder ? 'Update' : 'Create'} Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarView;