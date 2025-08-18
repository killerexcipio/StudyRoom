// server/services/jwtService.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
    this.accessTokenExpiry = process.env.JWT_EXPIRE || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRE || '7d';
    this.resetTokenExpiry = process.env.JWT_RESET_EXPIRE || '1h';
    this.verificationTokenExpiry = process.env.JWT_VERIFICATION_EXPIRE || '24h';
    
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  // Generate access token
  generateAccessToken(payload) {
    try {
      const token = jwt.sign(
        payload,
        this.secret,
        {
          expiresIn: this.accessTokenExpiry,
          issuer: process.env.APP_NAME || 'StudyRoom',
          audience: process.env.CLIENT_URL || 'http://localhost:3000'
        }
      );

      logger.info('Access token generated', { 
        userId: payload.id || payload._id,
        expiresIn: this.accessTokenExpiry 
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate access token:', error);
      throw new Error('Token generation failed');
    }
  }

  // Generate refresh token
  generateRefreshToken(payload) {
    try {
      const token = jwt.sign(
        payload,
        this.refreshSecret,
        {
          expiresIn: this.refreshTokenExpiry,
          issuer: process.env.APP_NAME || 'StudyRoom',
          audience: process.env.CLIENT_URL || 'http://localhost:3000'
        }
      );

      logger.info('Refresh token generated', { 
        userId: payload.id || payload._id,
        expiresIn: this.refreshTokenExpiry 
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate refresh token:', error);
      throw new Error('Refresh token generation failed');
    }
  }

  // Generate token pair (access + refresh)
  generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiry
    };
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: process.env.APP_NAME || 'StudyRoom',
        audience: process.env.CLIENT_URL || 'http://localhost:3000'
      });

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          decoded: null,
          expired: true,
          error: 'Token expired'
        };
      } else if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          decoded: null,
          expired: false,
          error: 'Invalid token'
        };
      } else {
        logger.error('Token verification error:', error);
        return {
          valid: false,
          decoded: null,
          expired: false,
          error: 'Token verification failed'
        };
      }
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshSecret, {
        issuer: process.env.APP_NAME || 'StudyRoom',
        audience: process.env.CLIENT_URL || 'http://localhost:3000'
      });

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          decoded: null,
          expired: true,
          error: 'Refresh token expired'
        };
      } else {
        return {
          valid: false,
          decoded: null,
          expired: false,
          error: 'Invalid refresh token'
        };
      }
    }
  }

  // Generate password reset token
  generateResetToken(payload) {
    try {
      const token = jwt.sign(
        payload,
        this.secret,
        {
          expiresIn: this.resetTokenExpiry,
          issuer: process.env.APP_NAME || 'StudyRoom',
          audience: 'password-reset'
        }
      );

      logger.info('Reset token generated', { 
        userId: payload.id || payload._id,
        expiresIn: this.resetTokenExpiry 
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate reset token:', error);
      throw new Error('Reset token generation failed');
    }
  }

  // Verify password reset token
  verifyResetToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: process.env.APP_NAME || 'StudyRoom',
        audience: 'password-reset'
      });

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          decoded: null,
          expired: true,
          error: 'Reset token expired'
        };
      } else {
        return {
          valid: false,
          decoded: null,
          expired: false,
          error: 'Invalid reset token'
        };
      }
    }
  }

  // Generate email verification token
  generateVerificationToken(payload) {
    try {
      const token = jwt.sign(
        payload,
        this.secret,
        {
          expiresIn: this.verificationTokenExpiry,
          issuer: process.env.APP_NAME || 'StudyRoom',
          audience: 'email-verification'
        }
      );

      logger.info('Verification token generated', { 
        userId: payload.id || payload._id,
        expiresIn: this.verificationTokenExpiry 
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate verification token:', error);
      throw new Error('Verification token generation failed');
    }
  }

  // Verify email verification token
  verifyVerificationToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: process.env.APP_NAME || 'StudyRoom',
        audience: 'email-verification'
      });

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          decoded: null,
          expired: true,
          error: 'Verification token expired'
        };
      } else {
        return {
          valid: false,
          decoded: null,
          expired: false,
          error: 'Invalid verification token'
        };
      }
    }
  }

  // Generate API key for external integrations
  generateApiKey(payload) {
    try {
      const token = jwt.sign(
        payload,
        this.secret,
        {
          expiresIn: '365d', // API keys last longer
          issuer: process.env.APP_NAME || 'StudyRoom',
          audience: 'api-access'
        }
      );

      logger.info('API key generated', { 
        userId: payload.id || payload._id 
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate API key:', error);
      throw new Error('API key generation failed');
    }
  }

  // Verify API key
  verifyApiKey(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: process.env.APP_NAME || 'StudyRoom',
        audience: 'api-access'
      });

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          decoded: null,
          expired: true,
          error: 'API key expired'
        };
      } else {
        return {
          valid: false,
          decoded: null,
          expired: false,
          error: 'Invalid API key'
        };
      }
    }
  }

  // Decode token without verification (for debugging)
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error('Failed to decode token:', error);
      return null;
    }
  }

  // Get token expiration time
  getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get token expiration:', error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        return Date.now() >= decoded.exp * 1000;
      }
      return true; // Consider invalid tokens as expired
    } catch (error) {
      return true;
    }
  }

  // Generate secure random token (for non-JWT purposes)
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate invitation token for sharing
  generateInvitationToken(payload) {
    try {
      const token = jwt.sign(
        payload,
        this.secret,
        {
          expiresIn: '72h', // Invitations expire in 3 days
          issuer: process.env.APP_NAME || 'StudyRoom',
          audience: 'invitation'
        }
      );

      logger.info('Invitation token generated', { 
        invitedBy: payload.invitedBy,
        resourceType: payload.resourceType 
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate invitation token:', error);
      throw new Error('Invitation token generation failed');
    }
  }

  // Verify invitation token
  verifyInvitationToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: process.env.APP_NAME || 'StudyRoom',
        audience: 'invitation'
      });

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          decoded: null,
          expired: true,
          error: 'Invitation token expired'
        };
      } else {
        return {
          valid: false,
          decoded: null,
          expired: false,
          error: 'Invalid invitation token'
        };
      }
    }
  }

  // Refresh access token using refresh token
  refreshAccessToken(refreshToken) {
    try {
      const verification = this.verifyRefreshToken(refreshToken);
      
      if (!verification.valid) {
        throw new Error(verification.error);
      }

      // Generate new access token with same payload
      const newAccessToken = this.generateAccessToken({
        id: verification.decoded.id,
        email: verification.decoded.email
      });

      logger.info('Access token refreshed', { 
        userId: verification.decoded.id 
      });

      return {
        accessToken: newAccessToken,
        expiresIn: this.accessTokenExpiry
      };
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      throw new Error('Token refresh failed');
    }
  }

  // Blacklist token (for logout)
  // Note: In production, you'd store blacklisted tokens in Redis or database
  blacklistToken(token) {
    try {
      const decoded = this.decodeToken(token);
      if (decoded) {
        logger.info('Token blacklisted', { 
          jti: decoded.payload.jti,
          userId: decoded.payload.id 
        });
        // In production: store token ID in blacklist database
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to blacklist token:', error);
      return false;
    }
  }

  // Check if token is blacklisted
  // Note: In production, you'd check against Redis or database
  isTokenBlacklisted(token) {
    try {
      // In production: check if token ID exists in blacklist database
      return false;
    } catch (error) {
      logger.error('Failed to check token blacklist:', error);
      return true; // Fail secure - consider it blacklisted if we can't check
    }
  }

  // Generate session token for real-time connections
  generateSessionToken(payload) {
    try {
      const token = jwt.sign(
        payload,
        this.secret,
        {
          expiresIn: '24h',
          issuer: process.env.APP_NAME || 'StudyRoom',
          audience: 'websocket-session'
        }
      );

      return token;
    } catch (error) {
      logger.error('Failed to generate session token:', error);
      throw new Error('Session token generation failed');
    }
  }

  // Verify session token
  verifySessionToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: process.env.APP_NAME || 'StudyRoom',
        audience: 'websocket-session'
      });

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          decoded: null,
          expired: true,
          error: 'Session token expired'
        };
      } else {
        return {
          valid: false,
          decoded: null,
          expired: false,
          error: 'Invalid session token'
        };
      }
    }
  }
}

// Create singleton instance
const jwtService = new JWTService();

module.exports = jwtService;