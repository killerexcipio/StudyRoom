const logger = require('../utils/logger');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// Store active users and their socket IDs
const activeUsers = new Map();
const userTyping = new Map();

const chatSocket = (io, socket) => {
  
  // Join a chat room
  socket.on('join_chat', async (data) => {
    try {
      const { chatId, userId } = data;
      
      if (!chatId || !userId) {
        socket.emit('error', { message: 'Chat ID and User ID are required' });
        return;
      }

      // Verify user has access to this chat
      const chat = await Chat.findById(chatId).populate('participants', 'username avatar');
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      const isParticipant = chat.participants.some(p => p._id.toString() === userId);
      if (!isParticipant) {
        socket.emit('error', { message: 'Access denied to this chat' });
        return;
      }

      // Join the chat room
      socket.join(`chat_${chatId}`);
      socket.currentChatId = chatId;
      socket.userId = userId;

      // Add user to active users
      activeUsers.set(userId, {
        socketId: socket.id,
        chatId: chatId,
        joinedAt: new Date()
      });

      // Get user info
      const user = await User.findById(userId).select('username avatar');
      
      // Notify other users in the chat
      socket.to(`chat_${chatId}`).emit('user_joined', {
        userId: userId,
        username: user.username,
        avatar: user.avatar,
        timestamp: new Date()
      });

      // Get recent messages for the user
      const messages = await Message.find({ chat: chatId })
        .populate('sender', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(50);

      socket.emit('chat_joined', {
        chatId: chatId,
        messages: messages.reverse(),
        participants: chat.participants,
        activeUsers: getActiveUsersInChat(chatId)
      });

      logger.logSocket('joined_chat', socket.id, userId);
      
    } catch (error) {
      logger.logError(error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  // Leave chat room
  socket.on('leave_chat', async (data) => {
    try {
      const { chatId, userId } = data;
      
      if (socket.currentChatId) {
        socket.leave(`chat_${socket.currentChatId}`);
        
        // Remove from active users
        activeUsers.delete(userId);
        
        // Stop typing if user was typing
        if (userTyping.has(userId)) {
          clearTimeout(userTyping.get(userId).timeout);
          userTyping.delete(userId);
          socket.to(`chat_${socket.currentChatId}`).emit('user_stopped_typing', { userId });
        }

        // Notify other users
        socket.to(`chat_${socket.currentChatId}`).emit('user_left', {
          userId: userId,
          timestamp: new Date()
        });

        socket.currentChatId = null;
        logger.logSocket('left_chat', socket.id, userId);
      }
    } catch (error) {
      logger.logError(error);
    }
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { chatId, content, type = 'text', metadata = null } = data;
      const userId = socket.userId;

      if (!chatId || !content || !userId) {
        socket.emit('error', { message: 'Missing required message data' });
        return;
      }

      // Verify user is in the chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(userId)) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Create new message
      const message = new Message({
        chat: chatId,
        sender: userId,
        content: content,
        type: type,
        metadata: metadata
      });

      await message.save();
      await message.populate('sender', 'username avatar');

      // Update chat's last message and activity
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        lastActivity: new Date()
      });

      // Emit message to all users in the chat
      io.to(`chat_${chatId}`).emit('new_message', {
        _id: message._id,
        content: message.content,
        type: message.type,
        metadata: message.metadata,
        sender: message.sender,
        chat: chatId,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      });

      // Clear typing indicator for sender
      if (userTyping.has(userId)) {
        clearTimeout(userTyping.get(userId).timeout);
        userTyping.delete(userId);
        socket.to(`chat_${chatId}`).emit('user_stopped_typing', { userId });
      }

      logger.logInfo(`Message sent in chat ${chatId} by user ${userId}`);

    } catch (error) {
      logger.logError(error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing_start', (data) => {
    try {
      const { chatId } = data;
      const userId = socket.userId;

      if (!chatId || !userId) return;

      // Clear existing timeout
      if (userTyping.has(userId)) {
        clearTimeout(userTyping.get(userId).timeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        userTyping.delete(userId);
        socket.to(`chat_${chatId}`).emit('user_stopped_typing', { userId });
      }, 3000); // Stop typing after 3 seconds of inactivity

      userTyping.set(userId, { chatId, timeout });

      // Notify other users
      socket.to(`chat_${chatId}`).emit('user_typing', { 
        userId,
        timestamp: new Date()
      });

    } catch (error) {
      logger.logError(error);
    }
  });

  // Stop typing
  socket.on('typing_stop', (data) => {
    try {
      const { chatId } = data;
      const userId = socket.userId;

      if (!userId) return;

      if (userTyping.has(userId)) {
        clearTimeout(userTyping.get(userId).timeout);
        userTyping.delete(userId);
        socket.to(`chat_${chatId}`).emit('user_stopped_typing', { userId });
      }

    } catch (error) {
      logger.logError(error);
    }
  });

  // Mark messages as read
  socket.on('mark_as_read', async (data) => {
    try {
      const { chatId, messageIds } = data;
      const userId = socket.userId;

      if (!chatId || !messageIds || !Array.isArray(messageIds) || !userId) {
        return;
      }

      // Update read status for messages
      await Message.updateMany(
        { 
          _id: { $in: messageIds },
          chat: chatId,
          sender: { $ne: userId }
        },
        { 
          $addToSet: { readBy: userId },
          $set: { updatedAt: new Date() }
        }
      );

      // Notify other users about read status
      socket.to(`chat_${chatId}`).emit('messages_read', {
        userId,
        messageIds,
        timestamp: new Date()
      });

      logger.logInfo(`Messages marked as read by user ${userId} in chat ${chatId}`);

    } catch (error) {
      logger.logError(error);
    }
  });

  // Get chat history
  socket.on('get_chat_history', async (data) => {
    try {
      const { chatId, page = 1, limit = 50 } = data;
      const userId = socket.userId;

      if (!chatId || !userId) return;

      // Verify access
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(userId)) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      const skip = (page - 1) * limit;
      const messages = await Message.find({ chat: chatId })
        .populate('sender', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      socket.emit('chat_history', {
        chatId,
        messages: messages.reverse(),
        page,
        hasMore: messages.length === limit
      });

    } catch (error) {
      logger.logError(error);
      socket.emit('error', { message: 'Failed to get chat history' });
    }
  });

  // Handle file/image sharing
  socket.on('share_file', async (data) => {
    try {
      const { chatId, fileUrl, fileName, fileType, fileSize } = data;
      const userId = socket.userId;

      if (!chatId || !fileUrl || !userId) {
        socket.emit('error', { message: 'Missing file data' });
        return;
      }

      // Create message with file
      const message = new Message({
        chat: chatId,
        sender: userId,
        content: fileName || 'File shared',
        type: 'file',
        metadata: {
          fileUrl,
          fileName,
          fileType,
          fileSize
        }
      });

      await message.save();
      await message.populate('sender', 'username avatar');

      // Update chat
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        lastActivity: new Date()
      });

      // Emit to all users
      io.to(`chat_${chatId}`).emit('new_message', message);

      logger.logInfo(`File shared in chat ${chatId} by user ${userId}`);

    } catch (error) {
      logger.logError(error);
      socket.emit('error', { message: 'Failed to share file' });
    }
  });

  // Handle emoji reactions
  socket.on('add_reaction', async (data) => {
    try {
      const { messageId, emoji } = data;
      const userId = socket.userId;

      if (!messageId || !emoji || !userId) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      // Initialize reactions if not exists
      if (!message.reactions) {
        message.reactions = new Map();
      }

      // Add or update reaction
      const currentReactions = message.reactions.get(emoji) || [];
      if (!currentReactions.includes(userId)) {
        currentReactions.push(userId);
        message.reactions.set(emoji, currentReactions);
        await message.save();

        // Emit reaction update
        io.to(`chat_${message.chat}`).emit('reaction_added', {
          messageId,
          emoji,
          userId,
          reactions: Object.fromEntries(message.reactions)
        });
      }

    } catch (error) {
      logger.logError(error);
    }
  });

  // Remove reaction
  socket.on('remove_reaction', async (data) => {
    try {
      const { messageId, emoji } = data;
      const userId = socket.userId;

      if (!messageId || !emoji || !userId) return;

      const message = await Message.findById(messageId);
      if (!message || !message.reactions) return;

      const currentReactions = message.reactions.get(emoji) || [];
      const updatedReactions = currentReactions.filter(id => id.toString() !== userId);
      
      if (updatedReactions.length === 0) {
        message.reactions.delete(emoji);
      } else {
        message.reactions.set(emoji, updatedReactions);
      }
      
      await message.save();

      // Emit reaction update
      io.to(`chat_${message.chat}`).emit('reaction_removed', {
        messageId,
        emoji,
        userId,
        reactions: Object.fromEntries(message.reactions)
      });

    } catch (error) {
      logger.logError(error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userId = socket.userId;
    
    if (userId) {
      // Remove from active users
      activeUsers.delete(userId);
      
      // Clear typing indicator
      if (userTyping.has(userId)) {
        const typingData = userTyping.get(userId);
        clearTimeout(typingData.timeout);
        userTyping.delete(userId);
        
        if (socket.currentChatId) {
          socket.to(`chat_${socket.currentChatId}`).emit('user_stopped_typing', { userId });
        }
      }
      
      // Notify chat room about user leaving
      if (socket.currentChatId) {
        socket.to(`chat_${socket.currentChatId}`).emit('user_left', {
          userId,
          timestamp: new Date()
        });
      }
    }
  });
};

// Helper function to get active users in a specific chat
function getActiveUsersInChat(chatId) {
  const users = [];
  for (const [userId, userData] of activeUsers.entries()) {
    if (userData.chatId === chatId) {
      users.push({
        userId,
        joinedAt: userData.joinedAt
      });
    }
  }
  return users;
}

module.exports = chatSocket;