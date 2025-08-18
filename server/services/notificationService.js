// server/services/notificationService.js
const emailService = require('./emailService');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.providers = {
      email: emailService,
      push: null, // Will be initialized with push service
      sms: null   // Will be initialized with SMS service
    };
    
    // In-memory storage for demo (use Redis/Database in production)
    this.inAppNotifications = new Map();
    this.userPreferences = new Map();
  }

  // Send notification based on user preferences
  async sendNotification(userId, notification) {
    try {
      const { type, title, message, data = {}, channels = ['email', 'push'] } = notification;
      
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);
      const enabledChannels = channels.filter(channel => preferences[channel]);

      const results = [];

      // Send via enabled channels
      for (const channel of enabledChannels) {
        try {
          let result;
          
          switch (channel) {
            case 'email':
              result = await this.sendEmailNotification(userId, notification);
              break;
            case 'push':
              result = await this.sendPushNotification(userId, notification);
              break;
            case 'sms':
              result = await this.sendSMSNotification(userId, notification);
              break;
            case 'inapp':
              result = await this.sendInAppNotification(userId, notification);
              break;
            default:
              logger.warn(`Unknown notification channel: ${channel}`);
              continue;
          }

          results.push({ channel, success: true, result });
        } catch (error) {
          logger.error(`Failed to send ${channel} notification:`, error);
          results.push({ channel, success: false, error: error.message });
        }
      }

      // Always send in-app notification as fallback
      if (!enabledChannels.includes('inapp')) {
        try {
          const inAppResult = await this.sendInAppNotification(userId, notification);
          results.push({ channel: 'inapp', success: true, result: inAppResult });
        } catch (error) {
          logger.error('Failed to send in-app notification:', error);
        }
      }

      logger.info('Notification sent', {
        userId,
        type,
        channels: enabledChannels,
        results: results.map(r => ({ channel: r.channel, success: r.success }))
      });

      return {
        success: results.some(r => r.success),
        results
      };
    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(userId, notification) {
    try {
      const { type, title, message, data } = notification;
      
      // Get user email (in production, fetch from database)
      const user = await this.getUserById(userId);
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      // Choose appropriate email template based on type
      switch (type) {
        case 'reminder':
          return await emailService.sendReminderNotification(user, data.reminder);
        case 'share':
          return await emailService.sendShareNotification(user, data.sharedBy, data.content);
        case 'welcome':
          return await emailService.sendWelcomeEmail(user);
        case 'password_reset':
          return await emailService.sendPasswordResetEmail(user, data.resetToken);
        case 'email_verification':
          return await emailService.sendVerificationEmail(user, data.verificationToken);
        default:
          // Generic email notification
          return await emailService.sendEmail({
            to: user.email,
            subject: title,
            text: message,
            html: `
              <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <h2>${title}</h2>
                <p>${message}</p>
              </div>
            `
          });
      }
    } catch (error) {
      logger.error('Email notification failed:', error);
      throw error;
    }
  }

  // Send push notification
  async sendPushNotification(userId, notification) {
    try {
      // Placeholder for push notification service (Firebase, OneSignal, etc.)
      logger.info('Push notification would be sent', { userId, notification });
      
      // In production, implement with actual push service:
      /*
      const pushResult = await pushService.send({
        to: userDeviceTokens,
        title: notification.title,
        body: notification.message,
        data: notification.data
      });
      */
      
      return { success: true, message: 'Push notification sent (placeholder)' };
    } catch (error) {
      logger.error('Push notification failed:', error);
      throw error;
    }
  }

  // Send SMS notification
  async sendSMSNotification(userId, notification) {
    try {
      // Placeholder for SMS service (Twilio, AWS SNS, etc.)
      logger.info('SMS notification would be sent', { userId, notification });
      
      // In production, implement with actual SMS service:
      /*
      const smsResult = await smsService.send({
        to: user.phoneNumber,
        message: notification.message
      });
      */
      
      return { success: true, message: 'SMS notification sent (placeholder)' };
    } catch (error) {
      logger.error('SMS notification failed:', error);
      throw error;
    }
  }

  // Send in-app notification
  async sendInAppNotification(userId, notification) {
    try {
      const inAppNotification = {
        id: Date.now().toString(),
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        read: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      // Store notification (use database in production)
      if (!this.inAppNotifications.has(userId)) {
        this.inAppNotifications.set(userId, []);
      }
      
      const userNotifications = this.inAppNotifications.get(userId);
      userNotifications.unshift(inAppNotification);
      
      // Keep only last 100 notifications per user
      if (userNotifications.length > 100) {
        userNotifications.splice(100);
      }

      // Emit real-time notification via WebSocket
      this.emitRealTimeNotification(userId, inAppNotification);

      return inAppNotification;
    } catch (error) {
      logger.error('In-app notification failed:', error);
      throw error;
    }
  }

  // Get user's in-app notifications
  getInAppNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      
      let notifications = this.inAppNotifications.get(userId) || [];
      
      // Filter unread only if requested
      if (unreadOnly) {
        notifications = notifications.filter(n => !n.read);
      }
      
      // Remove expired notifications
      const now = new Date();
      notifications = notifications.filter(n => n.expiresAt > now);
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNotifications = notifications.slice(startIndex, endIndex);
      
      return {
        notifications: paginatedNotifications,
        total: notifications.length,
        unreadCount: notifications.filter(n => !n.read).length,
        page,
        limit,
        hasMore: endIndex < notifications.length
      };
    } catch (error) {
      logger.error('Failed to get in-app notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  markNotificationAsRead(userId, notificationId) {
    try {
      const notifications = this.inAppNotifications.get(userId) || [];
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.read = true;
        notification.readAt = new Date();
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  markAllNotificationsAsRead(userId) {
    try {
      const notifications = this.inAppNotifications.get(userId) || [];
      const now = new Date();
      
      notifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true;
          notification.readAt = now;
        }
      });
      
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  deleteNotification(userId, notificationId) {
    try {
      const notifications = this.inAppNotifications.get(userId) || [];
      const index = notifications.findIndex(n => n.id === notificationId);
      
      if (index !== -1) {
        notifications.splice(index, 1);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to delete notification:', error);
      throw error;
    }
  }

  // Get user notification preferences
  async getUserPreferences(userId) {
    try {
      // Default preferences
      const defaultPreferences = {
        email: true,
        push: true,
        sms: false,
        inapp: true,
        reminders: true,
        shares: true,
        mentions: true,
        updates: false,
        marketing: false
      };

      // Get stored preferences (use database in production)
      const storedPreferences = this.userPreferences.get(userId) || {};
      
      return { ...defaultPreferences, ...storedPreferences };
    } catch (error) {
      logger.error('Failed to get user preferences:', error);
      return {
        email: true,
        push: true,
        sms: false,
        inapp: true,
        reminders: true,
        shares: true,
        mentions: true,
        updates: false,
        marketing: false
      };
    }
  }

  // Update user notification preferences
  updateUserPreferences(userId, preferences) {
    try {
      const currentPreferences = this.userPreferences.get(userId) || {};
      const updatedPreferences = { ...currentPreferences, ...preferences };
      
      this.userPreferences.set(userId, updatedPreferences);
      
      logger.info('User notification preferences updated', { userId, preferences });
      
      return updatedPreferences;
    } catch (error) {
      logger.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  // Send bulk notifications
  async sendBulkNotifications(userIds, notification) {
    try {
      const results = [];
      
      // Send notifications in batches to avoid overwhelming the system
      const batchSize = 100;
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(userId => 
          this.sendNotification(userId, notification).catch(error => ({
            userId,
            success: false,
            error: error.message
          }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
      
      logger.info('Bulk notifications sent', {
        totalUsers: userIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
      
      return {
        total: userIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      logger.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  // Schedule notification for later
  scheduleNotification(userId, notification, scheduleTime) {
    try {
      const delay = new Date(scheduleTime).getTime() - Date.now();
      
      if (delay <= 0) {
        // Send immediately if scheduled time is in the past
        return this.sendNotification(userId, notification);
      }
      
      setTimeout(() => {
        this.sendNotification(userId, notification).catch(error => {
          logger.error('Scheduled notification failed:', error);
        });
      }, delay);
      
      logger.info('Notification scheduled', {
        userId,
        scheduleTime,
        delay: delay / 1000 / 60 // delay in minutes
      });
      
      return { scheduled: true, scheduleTime, delay };
    } catch (error) {
      logger.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  // Emit real-time notification via WebSocket
  emitRealTimeNotification(userId, notification) {
    try {
      // Placeholder for WebSocket emission
      // In production, integrate with Socket.io or similar
      logger.debug('Real-time notification emitted', { userId, notification });
      
      /*
      if (global.io) {
        global.io.to(`user_${userId}`).emit('notification', notification);
      }
      */
    } catch (error) {
      logger.error('Failed to emit real-time notification:', error);
    }
  }

  // Helper method to get user by ID (placeholder)
  async getUserById(userId) {
    try {
      // In production, fetch from database
      // const User = require('../models/User');
      // return await User.findById(userId);
      
      // Placeholder for demo
      return {
        _id: userId,
        email: 'user@example.com',
        name: 'User Name'
      };
    } catch (error) {
      logger.error('Failed to get user:', error);
      throw error;
    }
  }

  // Notification templates for common use cases
  getNotificationTemplate(type, data) {
    const templates = {
      reminder: {
        title: `Reminder: ${data.title}`,
        message: `Your reminder "${data.title}" is due ${data.isOverdue ? 'now' : 'soon'}.`,
        channels: ['email', 'push', 'inapp']
      },
      share: {
        title: 'Content Shared',
        message: `${data.sharedBy.name} shared "${data.content.title}" with you.`,
        channels: ['email', 'push', 'inapp']
      },
      mention: {
        title: 'You were mentioned',
        message: `${data.mentionedBy.name} mentioned you in "${data.content.title}".`,
        channels: ['push', 'inapp']
      },
      comment: {
        title: 'New Comment',
        message: `${data.commenter.name} commented on "${data.content.title}".`,
        channels: ['push', 'inapp']
      },
      welcome: {
        title: 'Welcome to StudyRoom!',
        message: 'Thanks for joining. Start by creating your first note or whiteboard.',
        channels: ['email', 'inapp']
      }
    };
    
    return templates[type] || {
      title: 'Notification',
      message: 'You have a new notification.',
      channels: ['inapp']
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;