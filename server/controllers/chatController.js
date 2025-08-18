// server/controllers/chatController.js
const { Chat, Message } = require('../models/Chat');
const User = require('../models/User');

const chatController = {
  // @desc    Get all chats for authenticated user
  // @route   GET /api/chats
  // @access  Private
  getChats: async (req, res) => {
    try {
      const chats = await Chat.findByUser(req.user._id);
      res.json(chats);
    } catch (error) {
      console.error('Get chats error:', error);
      res.status(500).json({ message: 'Server error while fetching chats' });
    }
  },

  // @desc    Get single chat by ID
  // @route   GET /api/chats/:id
  // @access  Private
  getChat: async (req, res) => {
    try {
      const chat = await Chat.findById(req.params.id)
        .populate('participants', 'name email avatar isOnline')
        .populate('admin', 'name email')
        .populate({
          path: 'lastMessage',
          populate: {
            path: 'sender',
            select: 'name email'
          }
        });
      
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Check if user is participant
      const isParticipant = chat.participants.some(
        participant => participant._id.toString() === req.user._id.toString()
      );

      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied to this chat' });
      }

      res.json(chat);
    } catch (error) {
      console.error('Get chat error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Chat not found' });
      }
      res.status(500).json({ message: 'Server error while fetching chat' });
    }
  },

  // @desc    Create new chat
  // @route   POST /api/chats
  // @access  Private
  createChat: async (req, res) => {
    try {
      const { participants, isGroupChat, chatName, description } = req.body;

      if (!participants || participants.length === 0) {
        return res.status(400).json({ message: 'Participants are required' });
      }

      // Add current user to participants if not already included
      const allParticipants = [...new Set([...participants, req.user._id])];

      // For direct chats, check if chat already exists
      if (!isGroupChat && allParticipants.length === 2) {
        const existingChat = await Chat.findOne({
          isGroupChat: false,
          participants: { $all: allParticipants, $size: 2 }
        }).populate('participants', 'name email avatar isOnline');

        if (existingChat) {
          return res.json(existingChat);
        }
      }

      // Validate participants exist
      const validParticipants = await User.find({
        _id: { $in: allParticipants }
      });

      if (validParticipants.length !== allParticipants.length) {
        return res.status(400).json({ message: 'One or more participants not found' });
      }

      const chat = new Chat({
        participants: allParticipants,
        isGroupChat: isGroupChat || false,
        chatName: isGroupChat ? chatName : null,
        description,
        admin: isGroupChat ? req.user._id : null
      });
      
      await chat.save();
      await chat.populate('participants', 'name email avatar isOnline');
      await chat.populate('admin', 'name email');
      
      res.status(201).json(chat);
    } catch (error) {
      console.error('Create chat error:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ message: 'Server error while creating chat' });
    }
  },

  // @desc    Update chat (group chats only)
  // @route   PUT /api/chats/:id
  // @access  Private
  updateChat: async (req, res) => {
    try {
      const chat = await Chat.findById(req.params.id);
      
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      if (!chat.isGroupChat) {
        return res.status(400).json({ message: 'Cannot update direct message chat' });
      }

      // Check if user is admin
      if (chat.admin.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only admin can update group chat' });
      }

      const { chatName, description, chatImage } = req.body;

      if (chatName !== undefined) chat.chatName = chatName;
      if (description !== undefined) chat.description = description;
      if (chatImage !== undefined) chat.chatImage = chatImage;

      await chat.save();
      await chat.populate('participants', 'name email avatar isOnline');
      await chat.populate('admin', 'name email');
      
      res.json(chat);
    } catch (error) {
      console.error('Update chat error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Chat not found' });
      }
      res.status(500).json({ message: 'Server error while updating chat' });
    }
  },

  // @desc    Delete chat
  // @route   DELETE /api/chats/:id
  // @access  Private
  deleteChat: async (req, res) => {
    try {
      const chat = await Chat.findById(req.params.id);
      
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // For group chats, only admin can delete
      // For direct chats, any participant can delete
      if (chat.isGroupChat) {
        if (chat.admin.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Only admin can delete group chat' });
        }
      } else {
        const isParticipant = chat.participants.some(
          participant => participant.toString() === req.user._id.toString()
        );
        if (!isParticipant) {
          return res.status(403).json({ message: 'Not authorized to delete this chat' });
        }
      }

      // Delete all messages in the chat
      await Message.deleteMany({ chat: req.params.id });
      
      // Delete the chat
      await chat.deleteOne();
      
      res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
      console.error('Delete chat error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Chat not found' });
      }
      res.status(500).json({ message: 'Server error while deleting chat' });
    }
  },

  // @desc    Add participants to group chat
  // @route   POST /api/chats/:id/participants
  // @access  Private
  addParticipants: async (req, res) => {
    try {
      const { userIds } = req.body;
      const chat = await Chat.findById(req.params.id);
      
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      if (!chat.isGroupChat) {
        return res.status(400).json({ message: 'Cannot add participants to direct message' });
      }

      // Check if user is admin
      if (chat.admin.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only admin can add participants' });
      }

      // Validate new participants exist
      const validUsers = await User.find({ _id: { $in: userIds } });
      if (validUsers.length !== userIds.length) {
        return res.status(400).json({ message: 'One or more users not found' });
      }

      // Add participants
      for (const userId of userIds) {
        await chat.addParticipant(userId);
      }

      await chat.populate('participants', 'name email avatar isOnline');
      res.json(chat);
    } catch (error) {
      console.error('Add participants error:', error);
      res.status(500).json({ message: 'Server error while adding participants' });
    }
  },

  // @desc    Remove participant from group chat
  // @route   DELETE /api/chats/:id/participants/:userId
  // @access  Private
  removeParticipant: async (req, res) => {
    try {
      const { userId } = req.params;
      const chat = await Chat.findById(req.params.id);
      
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      if (!chat.isGroupChat) {
        return res.status(400).json({ message: 'Cannot remove participants from direct message' });
      }

      // Check if user is admin or removing themselves
      const isAdmin = chat.admin.toString() === req.user._id.toString();
      const removingSelf = userId === req.user._id.toString();

      if (!isAdmin && !removingSelf) {
        return res.status(403).json({ message: 'Only admin can remove other participants' });
      }

      await chat.removeParticipant(userId);
      await chat.populate('participants', 'name email avatar isOnline');
      
      res.json(chat);
    } catch (error) {
      console.error('Remove participant error:', error);
      res.status(500).json({ message: 'Server error while removing participant' });
    }
  },

  // @desc    Get messages for a chat
  // @route   GET /api/chats/:id/messages
  // @access  Private
  getMessages: async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const chat = await Chat.findById(req.params.id);
      
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Check if user is participant
      const isParticipant = chat.participants.some(
        participant => participant.toString() === req.user._id.toString()
      );

      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied to this chat' });
      }

      const messages = await Message.getByChatId(req.params.id, parseInt(page), parseInt(limit));
      res.json(messages.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Server error while fetching messages' });
    }
  },

  // @desc    Send message
  // @route   POST /api/messages
  // @access  Private
  sendMessage: async (req, res) => {
    try {
      const { chatId, content, messageType, fileUrl, fileName, fileSize, replyTo } = req.body;

      if (!chatId || !content) {
        return res.status(400).json({ message: 'Chat ID and content are required' });
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Check if user is participant
      const isParticipant = chat.participants.some(
        participant => participant.toString() === req.user._id.toString()
      );

      if (!isParticipant) {
        return res.status(403).json({ message: 'Not a participant of this chat' });
      }

      const message = new Message({
        content,
        sender: req.user._id,
        chat: chatId,
        messageType: messageType || 'text',
        fileUrl,
        fileName,
        fileSize,
        replyTo
      });

      await message.save();
      await message.populate('sender', 'name email avatar');
      
      if (replyTo) {
        await message.populate('replyTo');
      }

      res.status(201).json(message);
    } catch (error) {
      console.error('Send message error:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ message: 'Server error while sending message' });
    }
  },

  // @desc    Update message
  // @route   PUT /api/messages/:id
  // @access  Private
  updateMessage: async (req, res) => {
    try {
      const { content } = req.body;
      const message = await Message.findById(req.params.id);
      
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      // Only sender can edit message
      if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to edit this message' });
      }

      message.content = content;
      message.editedAt = new Date();
      
      await message.save();
      await message.populate('sender', 'name email avatar');
      
      res.json(message);
    } catch (error) {
      console.error('Update message error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Message not found' });
      }
      res.status(500).json({ message: 'Server error while updating message' });
    }
  },

  // @desc    Delete message
  // @route   DELETE /api/chats/:chatId/messages/:messageId
  // @access  Private
  deleteMessage: async (req, res) => {
    try {
      const { chatId, messageId } = req.params;
      const message = await Message.findById(messageId);
      
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      // Check if message belongs to chat
      if (message.chat.toString() !== chatId) {
        return res.status(400).json({ message: 'Message does not belong to this chat' });
      }

      // Only sender can delete message
      if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this message' });
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      message.content = 'This message has been deleted';
      
      await message.save();
      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Delete message error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Message not found' });
      }
      res.status(500).json({ message: 'Server error while deleting message' });
    }
  },

  // @desc    Mark message as read
  // @route   PUT /api/chats/:chatId/messages/:messageId/read
  // @access  Private
  markMessageAsRead: async (req, res) => {
    try {
      const { messageId } = req.params;
      const message = await Message.findById(messageId);
      
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      await message.markAsRead(req.user._id);
      res.json({ message: 'Message marked as read' });
    } catch (error) {
      console.error('Mark message as read error:', error);
      res.status(500).json({ message: 'Server error while marking message as read' });
    }
  },

  // @desc    Add reaction to message
  // @route   POST /api/messages/:id/reactions
  // @access  Private
  addReaction: async (req, res) => {
    try {
      const { emoji } = req.body;
      const message = await Message.findById(req.params.id);
      
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      await message.addReaction(req.user._id, emoji);
      await message.populate('reactions.user', 'name');
      
      res.json(message);
    } catch (error) {
      console.error('Add reaction error:', error);
      res.status(500).json({ message: 'Server error while adding reaction' });
    }
  },

  // @desc    Remove reaction from message
  // @route   DELETE /api/messages/:id/reactions
  // @access  Private
  removeReaction: async (req, res) => {
    try {
      const message = await Message.findById(req.params.id);
      
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      await message.removeReaction(req.user._id);
      await message.populate('reactions.user', 'name');
      
      res.json(message);
    } catch (error) {
      console.error('Remove reaction error:', error);
      res.status(500).json({ message: 'Server error while removing reaction' });
    }
  }
};

module.exports = chatController;