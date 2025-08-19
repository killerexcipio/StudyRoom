// client/src/features/chat/chatSocket.js
import { io } from 'socket.io-client';
import { store } from '../../store/store';
import { addMessage, updateMessageStatus, setTyping, setOnlineUsers } from './chatSlice';

class ChatSocket {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      this.isConnected = false;
    });

    // Listen for new messages
    this.socket.on('new_message', (message) => {
      store.dispatch(addMessage(message));
    });

    // Listen for message status updates
    this.socket.on('message_status', (data) => {
      store.dispatch(updateMessageStatus(data));
    });

    // Listen for typing indicators
    this.socket.on('user_typing', (data) => {
      store.dispatch(setTyping(data));
    });

    // Listen for online users updates
    this.socket.on('online_users', (users) => {
      store.dispatch(setOnlineUsers(users));
    });

    // Handle connection errors
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat', { chatId });
    }
  }

  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat', { chatId });
    }
  }

  sendMessage(messageData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', messageData);
    }
  }

  startTyping(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('start_typing', { chatId });
    }
  }

  stopTyping(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('stop_typing', { chatId });
    }
  }

  markMessageAsRead(messageId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_read', { messageId });
    }
  }

  updateOnlineStatus(isOnline) {
    if (this.socket && this.isConnected) {
      this.socket.emit('update_status', { isOnline });
    }
  }
}

const chatSocket = new ChatSocket();
export default chatSocket;

