// server/controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const userController = {
  // @desc    Get current user profile
  // @route   GET /api/users/profile
  // @access  Private
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error while fetching profile' });
    }
  },

  // @desc    Update user profile
  // @route   PUT /api/users/profile
  // @access  Private
  updateProfile: async (req, res) => {
    try {
      const { name, email, avatar, bio, preferences } = req.body;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      // Update fields
      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      if (avatar !== undefined) user.avatar = avatar;
      if (bio !== undefined) user.bio = bio;
      if (preferences !== undefined) {
        user.preferences = { ...user.preferences, ...preferences };
      }

      await user.save();
      
      // Return user without password
      const updatedUser = await User.findById(user._id).select('-password');
      res.json(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ message: 'Server error while updating profile' });
    }
  },

  // @desc    Change password
  // @route   PUT /api/users/password
  // @access  Private
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }

      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      await user.save();
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Server error while changing password' });
    }
  },

  // @desc    Search users (for chat functionality)
  // @route   GET /api/users/search?q=query
  // @access  Private
  searchUsers: async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;
      
      if (!q || q.trim() === '') {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const searchQuery = q.trim();
      
      const users = await User.find({
        _id: { $ne: req.user._id }, // Exclude current user
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ]
      }).select('name email avatar isOnline lastSeen')
        .limit(parseInt(limit));

      res.json(users);
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ message: 'Server error while searching users' });
    }
  },

  // @desc    Get user by ID (public info)
  // @route   GET /api/users/:id
  // @access  Private
  getUserById: async (req, res) => {
    try {
      const user = await User.findById(req.params.id)
        .select('name email avatar bio isOnline lastSeen createdAt');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get user by ID error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(500).json({ message: 'Server error while fetching user' });
    }
  },

  // @desc    Get multiple users by IDs
  // @route   POST /api/users/batch
  // @access  Private
  getUsersByIds: async (req, res) => {
    try {
      const { userIds } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'User IDs are required' });
      }

      const users = await User.find({
        _id: { $in: userIds }
      }).select('name email avatar isOnline lastSeen');

      res.json(users);
    } catch (error) {
      console.error('Get users by IDs error:', error);
      res.status(500).json({ message: 'Server error while fetching users' });
    }
  },

  // @desc    Update user online status
  // @route   PUT /api/users/status
  // @access  Private
  updateOnlineStatus: async (req, res) => {
    try {
      const { isOnline } = req.body;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.isOnline = isOnline;
      if (!isOnline) {
        user.lastSeen = new Date();
      }

      await user.save();
      
      res.json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Update online status error:', error);
      res.status(500).json({ message: 'Server error while updating status' });
    }
  },

  // @desc    Get user settings/preferences
  // @route   GET /api/users/settings
  // @access  Private
  getSettings: async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .select('preferences notifications');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        preferences: user.preferences || {},
        notifications: user.notifications || {}
      });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ message: 'Server error while fetching settings' });
    }
  },

  // @desc    Update user settings/preferences
  // @route   PUT /api/users/settings
  // @access  Private
  updateSettings: async (req, res) => {
    try {
      const { preferences, notifications } = req.body;
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update preferences
      if (preferences !== undefined) {
        user.preferences = { ...user.preferences, ...preferences };
      }

      // Update notification settings
      if (notifications !== undefined) {
        user.notifications = { ...user.notifications, ...notifications };
      }

      await user.save();
      
      res.json({
        message: 'Settings updated successfully',
        preferences: user.preferences,
        notifications: user.notifications
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ message: 'Server error while updating settings' });
    }
  },

  // @desc    Delete user account
  // @route   DELETE /api/users/account
  // @access  Private
  deleteAccount: async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: 'Password confirmation is required' });
      }

      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Password is incorrect' });
      }

      // TODO: Clean up user data (notes, whiteboards, chats, etc.)
      // This would typically involve cascading deletions or anonymization
      
      await user.deleteOne();
      
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ message: 'Server error while deleting account' });
    }
  },

  // @desc    Get user activity statistics
  // @route   GET /api/users/stats
  // @access  Private
  getUserStats: async (req, res) => {
    try {
      const userId = req.user._id;
      
      // Import models to get stats
      const Note = require('../models/Note');
      const Whiteboard = require('../models/Whiteboard');
      const Reminder = require('../models/Reminder');
      const { Chat, Message } = require('../models/Chat');
      
      const stats = await Promise.all([
        Note.countDocuments({ user: userId }),
        Whiteboard.countDocuments({ user: userId }),
        Reminder.countDocuments({ user: userId }),
        Chat.countDocuments({ participants: userId }),
        Message.countDocuments({ sender: userId })
      ]);

      const [notes, whiteboards, reminders, chats, messages] = stats;

      res.json({
        notes,
        whiteboards,
        reminders,
        chats,
        messagesSent: messages,
        joinedAt: req.user.createdAt
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ message: 'Server error while fetching user statistics' });
    }
  },

  // @desc    Get online users (for chat)
  // @route   GET /api/users/online
  // @access  Private
  getOnlineUsers: async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      
      const onlineUsers = await User.find({
        _id: { $ne: req.user._id }, // Exclude current user
        isOnline: true
      }).select('name email avatar')
        .limit(parseInt(limit))
        .sort({ lastSeen: -1 });

      res.json(onlineUsers);
    } catch (error) {
      console.error('Get online users error:', error);
      res.status(500).json({ message: 'Server error while fetching online users' });
    }
  },

  // @desc    Block/Unblock user
  // @route   POST /api/users/:id/block
  // @access  Private
  toggleBlockUser: async (req, res) => {
    try {
      const { id: targetUserId } = req.params;
      const { block = true } = req.body;
      
      if (targetUserId === req.user._id.toString()) {
        return res.status(400).json({ message: 'Cannot block yourself' });
      }

      const user = await User.findById(req.user._id);
      const targetUser = await User.findById(targetUserId).select('name email');
      
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.blockedUsers) {
        user.blockedUsers = [];
      }

      const isBlocked = user.blockedUsers.includes(targetUserId);

      if (block && !isBlocked) {
        user.blockedUsers.push(targetUserId);
        await user.save();
        res.json({ message: `${targetUser.name} has been blocked` });
      } else if (!block && isBlocked) {
        user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetUserId);
        await user.save();
        res.json({ message: `${targetUser.name} has been unblocked` });
      } else {
        res.json({ message: `User is already ${block ? 'blocked' : 'unblocked'}` });
      }
    } catch (error) {
      console.error('Toggle block user error:', error);
      res.status(500).json({ message: 'Server error while updating block status' });
    }
  },

  // @desc    Get blocked users
  // @route   GET /api/users/blocked
  // @access  Private
  getBlockedUsers: async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .populate('blockedUsers', 'name email avatar');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user.blockedUsers || []);
    } catch (error) {
      console.error('Get blocked users error:', error);
      res.status(500).json({ message: 'Server error while fetching blocked users' });
    }
  }
};

module.exports = userController;