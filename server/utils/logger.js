const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which logs to show based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
];

// Only add debug file in development
if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/debug.log'),
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Add request logging middleware
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper functions for different log levels
logger.logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    ...(req && {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }),
  };
  logger.error(JSON.stringify(errorInfo));
};

logger.logInfo = (message, data = null) => {
  logger.info(data ? `${message} | Data: ${JSON.stringify(data)}` : message);
};

logger.logWarn = (message, data = null) => {
  logger.warn(data ? `${message} | Data: ${JSON.stringify(data)}` : message);
};

logger.logDebug = (message, data = null) => {
  logger.debug(data ? `${message} | Data: ${JSON.stringify(data)}` : message);
};

// API request logging
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : 'anonymous',
  };
  
  if (res.statusCode >= 400) {
    logger.warn(`Request completed | ${JSON.stringify(logData)}`);
  } else {
    logger.info(`Request completed | ${JSON.stringify(logData)}`);
  }
};

// Database operation logging
logger.logDB = (operation, collection, data = null) => {
  logger.debug(`DB Operation: ${operation} on ${collection}`, data);
};

// Authentication logging
logger.logAuth = (action, userId, ip, success = true) => {
  const logData = {
    action,
    userId,
    ip,
    success,
    timestamp: new Date().toISOString(),
  };
  
  if (success) {
    logger.info(`Auth Success | ${JSON.stringify(logData)}`);
  } else {
    logger.warn(`Auth Failed | ${JSON.stringify(logData)}`);
  }
};

// Socket connection logging
logger.logSocket = (event, socketId, userId = null) => {
  logger.info(`Socket ${event} | ID: ${socketId} | User: ${userId || 'anonymous'}`);
};

module.exports = logger;