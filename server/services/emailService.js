// server/services/emailService.js
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  async init() {
    try {
      // Configure email transporter based on environment
      if (process.env.EMAIL_SERVICE === 'gmail') {
        this.transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
          }
        });
      } else if (process.env.EMAIL_SERVICE === 'sendgrid') {
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
      } else if (process.env.EMAIL_SERVICE === 'smtp') {
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } else {
        // Development mode - use Ethereal Email for testing
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        
        logger.info('Email service initialized with test account', {
          user: testAccount.user,
          pass: testAccount.pass
        });
      }

      // Verify transporter configuration
      if (this.transporter) {
        await this.transporter.verify();
        logger.info('Email service initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  async sendEmail({ to, subject, text, html, attachments = [] }) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'StudyRoom'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text,
        html,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to: mailOptions.to,
        subject,
        messageId: result.messageId
      });

      // Log preview URL for development
      if (process.env.NODE_ENV === 'development') {
        const previewURL = nodemailer.getTestMessageUrl(result);
        if (previewURL) {
          logger.info('Email preview URL:', previewURL);
        }
      }

      return {
        success: true,
        messageId: result.messageId,
        previewURL: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(result) : null
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  // Welcome email for new users
  async sendWelcomeEmail(user) {
    const subject = `Welcome to ${process.env.APP_NAME || 'StudyRoom'}!`;
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #2563eb; text-align: center;">Welcome to StudyRoom!</h1>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>Hi ${user.name}!</h2>
          <p>Thank you for joining StudyRoom. We're excited to have you on board!</p>
          <p>Here's what you can do with your account:</p>
          <ul>
            <li>Create and organize notes with tags</li>
            <li>Draw and collaborate on whiteboards</li>
            <li>Chat with other users</li>
            <li>Set reminders and manage your calendar</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Get Started
            </a>
          </div>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          If you have any questions, feel free to reach out to our support team.
        </p>
      </div>
    `;
    
    const text = `
      Welcome to StudyRoom!
      
      Hi ${user.name}!
      
      Thank you for joining StudyRoom. We're excited to have you on board!
      
      Here's what you can do with your account:
      - Create and organize notes with tags
      - Draw and collaborate on whiteboards
      - Chat with other users
      - Set reminders and manage your calendar
      
      Get started: ${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard
      
      If you have any questions, feel free to reach out to our support team.
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  // Password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const resetURL = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your Password';
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #dc2626; text-align: center;">Password Reset Request</h1>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h2>Hi ${user.name},</h2>
          <p>You requested to reset your password for your StudyRoom account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #7f1d1d; font-size: 14px;">
            This link will expire in 1 hour for security reasons.
          </p>
          <p style="color: #7f1d1d; font-size: 14px;">
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      </div>
    `;
    
    const text = `
      Password Reset Request
      
      Hi ${user.name},
      
      You requested to reset your password for your StudyRoom account.
      
      Click the link below to reset your password:
      ${resetURL}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this password reset, please ignore this email.
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  // Email verification
  async sendVerificationEmail(user, verificationToken) {
    const verifyURL = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    const subject = 'Verify Your Email Address';
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #2563eb; text-align: center;">Verify Your Email</h1>
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h2>Hi ${user.name},</h2>
          <p>Please verify your email address to complete your StudyRoom account setup.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyURL}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color: #1e40af; font-size: 14px;">
            This verification link will expire in 24 hours.
          </p>
        </div>
      </div>
    `;
    
    const text = `
      Verify Your Email
      
      Hi ${user.name},
      
      Please verify your email address to complete your StudyRoom account setup.
      
      Click the link below to verify your email:
      ${verifyURL}
      
      This verification link will expire in 24 hours.
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  // Reminder notification email
  async sendReminderNotification(user, reminder) {
    const subject = `Reminder: ${reminder.title}`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #f59e0b; text-align: center;">⏰ Reminder</h1>
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h2>${reminder.title}</h2>
          ${reminder.description ? `<p><strong>Description:</strong> ${reminder.description}</p>` : ''}
          <p><strong>Due:</strong> ${new Date(reminder.dueDate).toLocaleString()}</p>
          <p><strong>Priority:</strong> ${reminder.priority}</p>
          <p><strong>Category:</strong> ${reminder.category}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/calendar" 
               style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Calendar
            </a>
          </div>
        </div>
      </div>
    `;
    
    const text = `
      ⏰ Reminder: ${reminder.title}
      
      ${reminder.description ? `Description: ${reminder.description}` : ''}
      Due: ${new Date(reminder.dueDate).toLocaleString()}
      Priority: ${reminder.priority}
      Category: ${reminder.category}
      
      View your calendar: ${process.env.CLIENT_URL || 'http://localhost:3000'}/calendar
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  // Shared content notification
  async sendShareNotification(user, sharedBy, content) {
    const subject = `${sharedBy.name} shared content with you`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #10b981; text-align: center;">📤 Content Shared</h1>
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h2>Hi ${user.name},</h2>
          <p><strong>${sharedBy.name}</strong> has shared content with you on StudyRoom.</p>
          <p><strong>Content:</strong> ${content.title || content.name}</p>
          <p><strong>Type:</strong> ${content.type}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/${content.type}/${content._id}" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Content
            </a>
          </div>
        </div>
      </div>
    `;
    
    const text = `
      📤 Content Shared
      
      Hi ${user.name},
      
      ${sharedBy.name} has shared content with you on StudyRoom.
      
      Content: ${content.title || content.name}
      Type: ${content.type}
      
      View content: ${process.env.CLIENT_URL || 'http://localhost:3000'}/${content.type}/${content._id}
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  // Activity digest email
  async sendActivityDigest(user, activities) {
    const subject = 'Your Weekly StudyRoom Activity';
    
    const activityHtml = activities.map(activity => `
      <li style="margin: 10px 0;">
        <strong>${activity.type}:</strong> ${activity.description}
        <span style="color: #6b7280; font-size: 12px; display: block;">
          ${new Date(activity.date).toLocaleDateString()}
        </span>
      </li>
    `).join('');
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #7c3aed; text-align: center;">📊 Your Weekly Activity</h1>
        <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
          <h2>Hi ${user.name},</h2>
          <p>Here's a summary of your activity this week:</p>
          <ul style="list-style-type: none; padding: 0;">
            ${activityHtml}
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" 
               style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Dashboard
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  // Test email connection
  async testConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      await this.transporter.verify();
      logger.info('Email service connection test successful');
      return { success: true, message: 'Email service is working correctly' };
    } catch (error) {
      logger.error('Email service connection test failed:', error);
      return { success: false, message: error.message };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;