// server/utils/generateToken.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate JWT token for user authentication
 * @param {Object} payload - User data to encode in token
 * @param {string} expiresIn - Token expiration time (default: '15m')
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = '15m') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    issuer: process.env.APP_NAME || 'StudyRoom',
    audience: process.env.CLIENT_URL || 'http://localhost:3000'
  });
};

/**
 * Generate refresh token for maintaining user sessions
 * @param {Object} payload - User data to encode in token
 * @param {string} expiresIn - Token expiration time (default: '7d')
 * @returns {string} Refresh JWT token
 */
const generateRefreshToken = (payload, expiresIn = '7d') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';

  return jwt.sign(payload, refreshSecret, {
    expiresIn,
    issuer: process.env.APP_NAME || 'StudyRoom',
    audience: process.env.CLIENT_URL || 'http://localhost:3000'
  });
};

/**
 * Generate password reset token
 * @param {Object} payload - User data to encode in token
 * @param {string} expiresIn - Token expiration time (default: '1h')
 * @returns {string} Password reset token
 */
const generatePasswordResetToken = (payload, expiresIn = '1h') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    issuer: process.env.APP_NAME || 'StudyRoom',
    audience: 'password-reset'
  });
};

/**
 * Generate email verification token
 * @param {Object} payload - User data to encode in token
 * @param {string} expiresIn - Token expiration time (default: '24h')
 * @returns {string} Email verification token
 */
const generateEmailVerificationToken = (payload, expiresIn = '24h') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    issuer: process.env.APP_NAME || 'StudyRoom',
    audience: 'email-verification'
  });
};

/**
 * Generate API key for external integrations
 * @param {Object} payload - User/service data to encode
 * @param {string} expiresIn - Token expiration time (default: '365d')
 * @returns {string} API key token
 */
const generateApiKey = (payload, expiresIn = '365d') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    issuer: process.env.APP_NAME || 'StudyRoom',
    audience: 'api-access'
  });
};

/**
 * Generate invitation token for sharing resources
 * @param {Object} payload - Invitation data
 * @param {string} expiresIn - Token expiration time (default: '72h')
 * @returns {string} Invitation token
 */
const generateInvitationToken = (payload, expiresIn = '72h') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    issuer: process.env.APP_NAME || 'StudyRoom',
    audience: 'invitation'
  });
};

/**
 * Generate session token for WebSocket connections
 * @param {Object} payload - Session data
 * @param {string} expiresIn - Token expiration time (default: '24h')
 * @returns {string} Session token
 */
const generateSessionToken = (payload, expiresIn = '24h') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    issuer: process.env.APP_NAME || 'StudyRoom',
    audience: 'websocket-session'
  });
};

/**
 * Generate secure random token (non-JWT)
 * @param {number} length - Token length in bytes (default: 32)
 * @param {string} encoding - Token encoding (default: 'hex')
 * @returns {string} Random token
 */
const generateSecureToken = (length = 32, encoding = 'hex') => {
  return crypto.randomBytes(length).toString(encoding);
};

/**
 * Generate UUID v4
 * @returns {string} UUID v4 string
 */
const generateUUID = () => {
  return crypto.randomUUID();
};

/**
 * Generate short unique ID (8 characters)
 * @returns {string} Short unique ID
 */
const generateShortId = () => {
  return crypto.randomBytes(4).toString('hex');
};

/**
 * Generate CSRF token
 * @returns {string} CSRF token
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('base64url');
};

/**
 * Generate one-time password (OTP)
 * @param {number} length - OTP length (default: 6)
 * @returns {string} Numeric OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  
  return otp;
};

/**
 * Generate alphanumeric code
 * @param {number} length - Code length (default: 8)
 * @param {boolean} includeUppercase - Include uppercase letters (default: true)
 * @param {boolean} includeNumbers - Include numbers (default: true)
 * @returns {string} Alphanumeric code
 */
const generateAlphanumericCode = (length = 8, includeUppercase = true, includeNumbers = true) => {
  let chars = 'abcdefghijklmnopqrstuvwxyz';
  
  if (includeUppercase) {
    chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  
  if (includeNumbers) {
    chars += '0123456789';
  }
  
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  
  return code;
};

/**
 * Generate token pair (access + refresh)
 * @param {Object} payload - User data to encode
 * @returns {Object} Token pair object
 */
const generateTokenPair = (payload) => {
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRE || '15m'
  };
};

/**
 * Generate file upload token
 * @param {Object} payload - Upload metadata
 * @param {string} expiresIn - Token expiration time (default: '1h')
 * @returns {string} Upload token
 */
const generateUploadToken = (payload, expiresIn = '1h') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    issuer: process.env.APP_NAME || 'StudyRoom',
    audience: 'file-upload'
  });
};

/**
 * Generate backup code (for 2FA backup)
 * @returns {string} 8-character backup code
 */
const generateBackupCode = () => {
  // Generate 8-character code with letters and numbers
  return generateAlphanumericCode(8, true, true);
};

/**
 * Generate room/channel ID for real-time features
 * @param {string} prefix - Optional prefix (default: 'room')
 * @returns {string} Room ID
 */
const generateRoomId = (prefix = 'room') => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Generate webhook signature
 * @param {string} payload - Payload to sign
 * @param {string} secret - Secret key for signing
 * @returns {string} HMAC signature
 */
const generateWebhookSignature = (payload, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
};

/**
 * Generate share link token
 * @param {Object} payload - Share data
 * @param {string} expiresIn - Token expiration time (default: '30d')
 * @returns {string} Share token
 */
const generateShareToken = (payload, expiresIn = '30d') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    issuer: process.env.APP_NAME || 'StudyRoom',
    audience: 'public-share'
  });
};

/**
 * Generate device fingerprint
 * @param {Object} deviceInfo - Device information
 * @returns {string} Device fingerprint hash
 */
const generateDeviceFingerprint = (deviceInfo) => {
  const fingerprint = JSON.stringify(deviceInfo);
  return crypto
    .createHash('sha256')
    .update(fingerprint)
    .digest('hex');
};

module.exports = {
  generateToken,
  generateRefreshToken,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  generateApiKey,
  generateInvitationToken,
  generateSessionToken,
  generateSecureToken,
  generateUUID,
  generateShortId,
  generateCSRFToken,
  generateOTP,
  generateAlphanumericCode,
  generateTokenPair,
  generateUploadToken,
  generateBackupCode,
  generateRoomId,
  generateWebhookSignature,
  generateShareToken,
  generateDeviceFingerprint
};