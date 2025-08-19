// client/src/pages/Chat/ChatRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Send, Paperclip, Smile, MoreVertical, ArrowLeft, Phone, Video } from 'lucide-react';
import ChatBubble from '../../components/ChatBubble';
import UserAvatar from '../../components/UserAvatar';
import FileUpload from '../../components/FileUpload';
import { getChat, getMessages, sendMessage, markChatAsRead } from '../../features/chat/chatSlice';
import chatSocket from '../../features/chat/chatSocket';

const ChatRoom = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [message, setMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { currentChat, messages, messagesLoading, typing: typingUsers } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    if (chatId) {
      dispatch(getChat(chatId));
      dispatch(getMessages(chatId));
      chatSocket.joinChat(chatId);
      
      // Mark chat as read when entering
      dispatch(markChatAsRead(chatId));
    }

    return () => {
      if (chatId) {
        chatSocket.leaveChat(chatId);
        if (typing) {
          chatSocket.stopTyping(chatId);
        }
      }
    };
  }, [chatId, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    if (!typing) {
      setTyping(true);
      chatSocket.startTyping(chatId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      chatSocket.stopTyping(chatId);
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    const messageData = {
      chatId,
      content: message.trim(),
      messageType: 'text'
    };

    try {
      await dispatch(sendMessage(messageData));
      setMessage('');
      
      // Stop typing indicator
      if (typing) {
        setTyping(false);
        chatSocket.stopTyping(chatId);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileUpload = (files) => {
    // Handle file upload logic here
    console.log('Files to upload:', files);
    setShowFileUpload(false);
  };

  const getChatTitle = () => {
    if (!currentChat) return 'Loading...';
    
    if (currentChat.isGroupChat) {
      return currentChat.chatName || 'Group Chat';
    } else {
      const otherParticipant = currentChat.participants.find(p => p._id !== user._id);
      return otherParticipant?.name || 'Unknown User';
    }
  };

  const getChatSubtitle = () => {
    if (!currentChat) return '';
    
    if (currentChat.isGroupChat) {
      return `${currentChat.participants.length} members`;
    } else {
      const otherParticipant = currentChat.participants.find(p => p._id !== user._id);
      return otherParticipant?.isOnline ? 'Online' : 'Last seen recently';
    }
  };

  const getTypingText = () => {
    const typingInThisChat = typingUsers.filter(t => t.chatId === chatId);
    if (typingInThisChat.length === 0) return '';
    
    if (typingInThisChat.length === 1) {
      return 'Someone is typing...';
    } else {
      return `${typingInThisChat.length} people are typing...`;
    }
  };

  if (messagesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/chat')}
            className="p-2 hover:bg-gray-100 rounded-full md:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          
          <UserAvatar 
            user={currentChat?.isGroupChat ? null : currentChat?.participants?.find(p => p._id !== user._id)}
            size="md"
            showOnlineStatus={!currentChat?.isGroupChat}
          />
          
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {getChatTitle()}
            </h2>
            <p className="text-sm text-gray-500">
              {getChatSubtitle()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full">
            <Phone size={20} />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full">
            <Video size={20} />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const showAvatar = index === 0 || messages[index - 1].sender._id !== msg.sender._id;
          const showTimestamp = index === messages.length - 1 || 
                               new Date(messages[index + 1].createdAt).getTime() - new Date(msg.createdAt).getTime() > 300000; // 5 minutes
          
          return (
            <ChatBubble
              key={msg._id}
              message={msg}
              isOwnMessage={msg.sender._id === user._id}
              showAvatar={showAvatar}
              showTimestamp={showTimestamp}
            />
          );
        })}
        
        {/* Typing indicator */}
        {getTypingText() && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>{getTypingText()}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Upload File</h3>
            <FileUpload
              onFileSelect={handleFileUpload}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              maxSize={50 * 1024 * 1024} // 50MB
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowFileUpload(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowFileUpload(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
            >
              <Paperclip size={20} />
            </button>
          </div>
          
          <div className="flex-1 relative">
            <textarea
              ref={messageInputRef}
              value={message}
              onChange={handleTyping}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="1"
              style={{ maxHeight: '100px' }}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-600 hover:text-gray-800 rounded"
            >
              <Smile size={16} />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
