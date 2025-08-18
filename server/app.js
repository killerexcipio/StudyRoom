const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import utilities and middleware
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const chatRoutes = require('./routes/chatRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Import socket handlers
const chatSocket = require('./sockets/chatSocket');
const whiteboardSocket = require('./sockets/whiteboardSocket');

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Make io accessible to routes
app.set('io', io);

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true,
});

app.use('/api/auth', authLimiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Origin', 'Accept'],
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['tags', 'categories'] // Allow these parameters to be duplicated
}));

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined', { stream: logger.stream }));
} else {
  app.use(morgan('combined', { 
    stream: logger.stream,
    skip: (req, res) => res.statusCode < 400
  }));
}

// Custom request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.logSocket('connected', socket.id);
  
  // Handle authentication for socket connection
  socket.on('authenticate', (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.join(`user_${decoded.id}`);
      logger.logSocket('authenticated', socket.id, decoded.id);
    } catch (error) {
      logger.logError(error);
      socket.emit('auth_error', 'Invalid token');
    }
  });
  
  // Initialize chat socket handlers
  chatSocket(io, socket);
  
  // Initialize whiteboard socket handlers
  whiteboardSocket(io, socket);
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    logger.logSocket('disconnected', socket.id, socket.userId);
    logger.logInfo(`Socket disconnected: ${reason}`);
  });
  
  // Handle socket errors
  socket.on('error', (error) => {
    logger.logError(error, null);
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing - return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Handle 404 errors for API routes
app.use('/api/*', (req, res) => {
  logger.logWarn(`API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.logError(err);
  logger.error('Unhandled Promise Rejection. Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.logError(err);
  logger.error('Uncaught Exception. Shutting down...');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Export both app and server for testing and starting
module.exports = { app, server, io };