// client/src/utils/dateUtils.js
import { format, parseISO, formatDistanceToNow, isToday, isYesterday, isTomorrow, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

const dateUtils = {
  // Format date to various formats
  format: (date, formatString = 'MMM dd, yyyy') => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  },

  // Format date for display in UI
  formatForDisplay: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (isToday(dateObj)) {
      return 'Today';
    } else if (isYesterday(dateObj)) {
      return 'Yesterday';
    } else if (isTomorrow(dateObj)) {
      return 'Tomorrow';
    } else {
      return format(dateObj, 'MMM dd, yyyy');
    }
  },

  // Format time
  formatTime: (date, format12Hour = true) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, format12Hour ? 'h:mm a' : 'HH:mm');
  },

  // Format date and time
  formatDateTime: (date, format12Hour = true) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const timeFormat = format12Hour ? 'h:mm a' : 'HH:mm';
    
    if (isToday(dateObj)) {
      return `Today at ${format(dateObj, timeFormat)}`;
    } else if (isYesterday(dateObj)) {
      return `Yesterday at ${format(dateObj, timeFormat)}`;
    } else if (isTomorrow(dateObj)) {
      return `Tomorrow at ${format(dateObj, timeFormat)}`;
    } else {
      return format(dateObj, `MMM dd, yyyy 'at' ${timeFormat}`);
    }
  },

  // Get relative time (e.g., "2 hours ago", "in 3 days")
  getRelativeTime: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  },

  // Get time ago (e.g., "2 hours ago")
  getTimeAgo: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    
    const minutes = differenceInMinutes(now, dateObj);
    const hours = differenceInHours(now, dateObj);
    const days = differenceInDays(now, dateObj);

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return format(dateObj, 'MMM dd');
    }
  },

  // Check if date is today
  isToday: (date) => {
    if (!date) return false;
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isToday(dateObj);
  },

  // Check if date is yesterday
  isYesterday: (date) => {
    if (!date) return false;
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isYesterday(dateObj);
  },

  // Check if date is tomorrow
  isTomorrow: (date) => {
    if (!date) return false;
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isTomorrow(dateObj);
  },

  // Get start of day
  startOfDay: (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return startOfDay(dateObj);
  },

  // Get end of day
  endOfDay: (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return endOfDay(dateObj);
  },

  // Add days to date
  addDays: (date, amount) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return addDays(dateObj, amount);
  },

  // Subtract days from date
  subDays: (date, amount) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return subDays(dateObj, amount);
  },

  // Get start of week
  startOfWeek: (date, options = { weekStartsOn: 0 }) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return startOfWeek(dateObj, options);
  },

  // Get end of week
  endOfWeek: (date, options = { weekStartsOn: 0 }) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return endOfWeek(dateObj, options);
  },

  // Get start of month
  startOfMonth: (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return startOfMonth(dateObj);
  },

  // Get end of month
  endOfMonth: (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return endOfMonth(dateObj);
  },

  // Check if date is within interval
  isWithinInterval: (date, interval) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isWithinInterval(dateObj, interval);
  },

  // Get date difference in days
  getDaysDifference: (date1, date2) => {
    const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return differenceInDays(dateObj1, dateObj2);
  },

  // Get current timestamp
  now: () => new Date(),

  // Get current timestamp as ISO string
  nowISO: () => new Date().toISOString(),

  // Parse ISO string to date
  parseISO: (dateString) => {
    return parseISO(dateString);
  },

  // Convert date to ISO string
  toISO: (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateObj.toISOString();
  },

  // Get calendar weeks for month view
  getCalendarWeeks: (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const start = startOfWeek(startOfMonth(dateObj));
    const end = endOfWeek(endOfMonth(dateObj));
    
    const weeks = [];
    let current = start;
    
    while (current <= end) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current = addDays(current, 1);
      }
      weeks.push(week);
    }
    
    return weeks;
  },

  // Get days in current month
  getDaysInMonth: (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const start = startOfMonth(dateObj);
    const end = endOfMonth(dateObj);
    const days = [];
    
    let current = start;
    while (current <= end) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }
    
    return days;
  },

  // Format date for input[type="date"]
  formatForDateInput: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  },

  // Format date for input[type="datetime-local"]
  formatForDateTimeInput: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, "yyyy-MM-dd'T'HH:mm");
  },

  // Format date for input[type="time"]
  formatForTimeInput: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'HH:mm');
  },

  // Check if date is overdue
  isOverdue: (date) => {
    if (!date) return false;
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateObj < new Date();
  },

  // Check if date is upcoming (within next 7 days)
  isUpcoming: (date, days = 7) => {
    if (!date) return false;
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const future = addDays(now, days);
    return isWithinInterval(dateObj, { start: now, end: future });
  },

  // Get business days between two dates (excluding weekends)
  getBusinessDays: (startDate, endDate) => {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    let count = 0;
    let current = start;
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        count++;
      }
      current = addDays(current, 1);
    }
    
    return count;
  },

  // Format duration (e.g., "2h 30m")
  formatDuration: (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }
};

export default dateUtils;
