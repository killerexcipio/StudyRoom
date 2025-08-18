// server/utils/dateUtils.js

class DateUtils {
  // Format date to various formats
  static formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    const formats = {
      'YYYY-MM-DD': `${year}-${month}-${day}`,
      'MM/DD/YYYY': `${month}/${day}/${year}`,
      'DD/MM/YYYY': `${day}/${month}/${year}`,
      'YYYY-MM-DD HH:mm': `${year}-${month}-${day} ${hours}:${minutes}`,
      'YYYY-MM-DD HH:mm:ss': `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
      'ISO': d.toISOString(),
      'UTC': d.toUTCString(),
      'locale': d.toLocaleDateString(),
      'localeTime': d.toLocaleString()
    };

    return formats[format] || d.toString();
  }

  // Get relative time (e.g., "2 hours ago", "in 3 days")
  static getRelativeTime(date) {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    const isPast = diffMs < 0;
    const suffix = isPast ? 'ago' : 'from now';
    const prefix = isPast ? '' : 'in ';

    if (diffSeconds < 60) {
      return isPast ? 'just now' : 'in a moment';
    } else if (diffMinutes < 60) {
      return `${prefix}${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ${suffix}`;
    } else if (diffHours < 24) {
      return `${prefix}${diffHours} hour${diffHours > 1 ? 's' : ''} ${suffix}`;
    } else if (diffDays < 7) {
      return `${prefix}${diffDays} day${diffDays > 1 ? 's' : ''} ${suffix}`;
    } else if (diffWeeks < 4) {
      return `${prefix}${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ${suffix}`;
    } else if (diffMonths < 12) {
      return `${prefix}${diffMonths} month${diffMonths > 1 ? 's' : ''} ${suffix}`;
    } else {
      return `${prefix}${diffYears} year${diffYears > 1 ? 's' : ''} ${suffix}`;
    }
  }

  // Get start of day
  static getStartOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Get end of day
  static getEndOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  // Get start of week (Monday)
  static getStartOfWeek(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    const startOfWeek = new Date(d.setDate(diff));
    return this.getStartOfDay(startOfWeek);
  }

  // Get end of week (Sunday)
  static getEndOfWeek(date = new Date()) {
    const startOfWeek = this.getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return this.getEndOfDay(endOfWeek);
  }

  // Get start of month
  static getStartOfMonth(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  // Get end of month
  static getEndOfMonth(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // Get start of year
  static getStartOfYear(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), 0, 1);
  }

  // Get end of year
  static getEndOfYear(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  // Add time to date
  static addTime(date, amount, unit) {
    const d = new Date(date);
    
    switch (unit) {
      case 'seconds':
        d.setSeconds(d.getSeconds() + amount);
        break;
      case 'minutes':
        d.setMinutes(d.getMinutes() + amount);
        break;
      case 'hours':
        d.setHours(d.getHours() + amount);
        break;
      case 'days':
        d.setDate(d.getDate() + amount);
        break;
      case 'weeks':
        d.setDate(d.getDate() + (amount * 7));
        break;
      case 'months':
        d.setMonth(d.getMonth() + amount);
        break;
      case 'years':
        d.setFullYear(d.getFullYear() + amount);
        break;
      default:
        throw new Error(`Invalid time unit: ${unit}`);
    }
    
    return d;
  }

  // Subtract time from date
  static subtractTime(date, amount, unit) {
    return this.addTime(date, -amount, unit);
  }

  // Check if date is today
  static isToday(date) {
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }

  // Check if date is yesterday
  static isYesterday(date) {
    const d = new Date(date);
    const yesterday = this.subtractTime(new Date(), 1, 'days');
    return d.toDateString() === yesterday.toDateString();
  }

  // Check if date is tomorrow
  static isTomorrow(date) {
    const d = new Date(date);
    const tomorrow = this.addTime(new Date(), 1, 'days');
    return d.toDateString() === tomorrow.toDateString();
  }

  // Check if date is this week
  static isThisWeek(date) {
    const d = new Date(date);
    const startOfWeek = this.getStartOfWeek();
    const endOfWeek = this.getEndOfWeek();
    return d >= startOfWeek && d <= endOfWeek;
  }

  // Check if date is this month
  static isThisMonth(date) {
    const d = new Date(date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  // Check if date is this year
  static isThisYear(date) {
    const d = new Date(date);
    const now = new Date();
    return d.getFullYear() === now.getFullYear();
  }

  // Get difference between two dates
  static getDifference(date1, date2, unit = 'days') {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    
    switch (unit) {
      case 'milliseconds':
        return diffMs;
      case 'seconds':
        return Math.floor(diffMs / 1000);
      case 'minutes':
        return Math.floor(diffMs / (1000 * 60));
      case 'hours':
        return Math.floor(diffMs / (1000 * 60 * 60));
      case 'days':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      case 'weeks':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
      case 'months':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
      case 'years':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
      default:
        throw new Error(`Invalid unit: ${unit}`);
    }
  }

  // Check if date is between two dates
  static isBetween(date, startDate, endDate) {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return d >= start && d <= end;
  }

  // Get age from birthdate
  static getAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Get timezone offset
  static getTimezoneOffset(date = new Date()) {
    return date.getTimezoneOffset();
  }

  // Convert to timezone
  static toTimezone(date, timezone) {
    return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  }

  // Check if year is leap year
  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  // Get days in month
  static getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  // Get week number
  static getWeekNumber(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  // Get quarter
  static getQuarter(date = new Date()) {
    const month = new Date(date).getMonth();
    return Math.floor(month / 3) + 1;
  }

  // Parse date string with various formats
  static parseDate(dateString) {
    if (!dateString) return null;
    
    // Try common formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    ];
    
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  }

  // Get business days between two dates
  static getBusinessDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let businessDays = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        businessDays++;
      }
    }
    
    return businessDays;
  }

  // Check if date is weekend
  static isWeekend(date) {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  }

  // Get next business day
  static getNextBusinessDay(date = new Date()) {
    const nextDay = this.addTime(date, 1, 'days');
    if (this.isWeekend(nextDay)) {
      return this.getNextBusinessDay(nextDay);
    }
    return nextDay;
  }

  // Get previous business day
  static getPreviousBusinessDay(date = new Date()) {
    const prevDay = this.subtractTime(date, 1, 'days');
    if (this.isWeekend(prevDay)) {
      return this.getPreviousBusinessDay(prevDay);
    }
    return prevDay;
  }

  // Get date range
  static getDateRange(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    
    return dates;
  }

  // Validate date
  static isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  // Get time remaining until date
  static getTimeRemaining(targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    const remaining = target.getTime() - now.getTime();
    
    if (remaining <= 0) {
      return {
        expired: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      };
    }
    
    return {
      expired: false,
      days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
      hours: Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((remaining % (1000 * 60)) / 1000),
      totalMilliseconds: remaining
    };
  }

  // Get time ago in words
  static timeAgo(date) {
    return this.getRelativeTime(date);
  }

  // Format duration in milliseconds
  static formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

module.exports = DateUtils;