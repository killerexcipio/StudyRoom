// client/src/utils/constants.js
// Application Constants

// API Configuration
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  NOTES: '/api/notes',
  USERS: '/api/users',
  CHATS: '/api/chats',
  WHITEBOARDS: '/api/whiteboards',
  CALENDAR: '/api/reminders',
  UPLOAD: '/api/upload'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'studyroom_token',
  USER: 'studyroom_user',
  THEME: 'studyroom_theme',
  LANGUAGE: 'studyroom_language',
  SIDEBAR_COLLAPSED: 'studyroom_sidebar_collapsed'
};

// Application Limits
export const LIMITS = {
  NOTE_TITLE_MAX_LENGTH: 200,
  NOTE_CONTENT_MAX_LENGTH: 50000,
  TAG_MAX_LENGTH: 30,
  MAX_TAGS_PER_NOTE: 10,
  MESSAGE_MAX_LENGTH: 2000,
  WHITEBOARD_TITLE_MAX_LENGTH: 100,
  CHAT_NAME_MAX_LENGTH: 100,
  FILE_MAX_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES_PER_UPLOAD: 10
};

// File Types
export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEOS: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
  AUDIO: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf'
  ]
};

// File Extensions
export const FILE_EXTENSIONS = {
  IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  VIDEOS: ['mp4', 'webm', 'avi', 'mov'],
  AUDIO: ['mp3', 'wav', 'ogg', 'm4a'],
  DOCUMENTS: ['pdf', 'doc', 'docx', 'txt', 'rtf']
};

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#64748B',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#06B6D4'
};

// Note Colors
export const NOTE_COLORS = [
  '#FFFFFF', // White
  '#FEF3C7', // Yellow
  '#DBEAFE', // Blue
  '#D1FAE5', // Green
  '#FCE7F3', // Pink
  '#E0E7FF', // Indigo
  '#FED7D7', // Red
  '#F3E8FF', // Purple
  '#FECACA', // Light Red
  '#BFDBFE'  // Light Blue
];

// Default User Preferences
export const DEFAULT_PREFERENCES = {
  theme: 'light',
  language: 'en',
  emailNotifications: true,
  pushNotifications: true,
  autoSave: true,
  sidebarCollapsed: false,
  defaultNoteColor: '#FFFFFF',
  fontSize: 'medium',
  editorMode: 'visual'
};

// Reminder Categories
export const REMINDER_CATEGORIES = [
  { value: 'personal', label: 'Personal', color: '#3B82F6' },
  { value: 'work', label: 'Work', color: '#10B981' },
  { value: 'study', label: 'Study', color: '#F59E0B' },
  { value: 'health', label: 'Health', color: '#EF4444' },
  { value: 'other', label: 'Other', color: '#64748B' }
];

// Reminder Priorities
export const REMINDER_PRIORITIES = [
  { value: 'low', label: 'Low', color: '#10B981' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#EF4444' }
];

// Chat Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  VOICE: 'voice',
  VIDEO: 'video'
};

// Socket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_CHAT: 'join_chat',
  LEAVE_CHAT: 'leave_chat',
  NEW_MESSAGE: 'new_message',
  MESSAGE_STATUS: 'message_status',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd',
  MEDIUM: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  FULL: 'EEEE, MMMM dd, yyyy',
  TIME: 'h:mm a',
  DATETIME: 'MMM dd, yyyy h:mm a'
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  URL: /^https?:\/\/.+/
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access forbidden.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'Invalid file type.',
  UPLOAD_FAILED: 'File upload failed. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  NOTE_CREATED: 'Note created successfully!',
  NOTE_UPDATED: 'Note updated successfully!',
  NOTE_DELETED: 'Note deleted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
  REMINDER_CREATED: 'Reminder created successfully!',
  WHITEBOARD_SAVED: 'Whiteboard saved successfully!'
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  NOTES: '/notes',
  WHITEBOARD: '/whiteboard',
  CHAT: '/chat',
  CALENDAR: '/calendar',
  SETTINGS: '/settings'
};

// Feature Flags (for enabling/disabling features)
export const FEATURES = {
  REAL_TIME_COLLABORATION: false,
  VOICE_MESSAGES: false,
  VIDEO_CALLS: false,
  PUBLIC_NOTES: true,
  WHITEBOARD_COLLABORATION: false,
  EMAIL_NOTIFICATIONS: true,
  PUSH_NOTIFICATIONS: true,
  DARK_MODE: true,
  EXPORT_NOTES: true,
  IMPORT_NOTES: true
};

export default {
  API_ENDPOINTS,
  STORAGE_KEYS,
  LIMITS,
  FILE_TYPES,
  FILE_EXTENSIONS,
  THEME_COLORS,
  NOTE_COLORS,
  DEFAULT_PREFERENCES,
  REMINDER_CATEGORIES,
  REMINDER_PRIORITIES,
  MESSAGE_TYPES,
  SOCKET_EVENTS,
  NOTIFICATION_TYPES,
  DATE_FORMATS,
  PAGINATION,
  VALIDATION_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  FEATURES
};