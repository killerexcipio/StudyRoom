// client/src/pages/Chat/ChatDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus, Users, User, MessageCircle, MoreVertical } from 'lucide-react';
import { getChats, createChat } from '../../features/chat/chatSlice';

const ChatItem = ({ chat, onClick, currentUserId }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getChatName = () => {
    if (chat.isGroupChat) {
      return chat.chatName || 'Group Chat';
    } else {
      // For direct messages, show the other participant's name
      const otherParticipant = chat.participants.find(p => p._id !== currentUserId);
      return otherParticipant?.name || 'Unknown User';
    }
  };

  const getChatAvatar = () => {
    if (chat.isGroupChat) {
      return (
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Users size={20} className="text-blue-600" />
        </div>
      );
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== currentUserId);
      return (
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          {otherParticipant?.avatar ? (
            <img 
              src={otherParticipant.avatar} 
              alt={otherParticipant.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User size={20} className="text-gray-600" />
          )}
        </div>
      );
    }
  };

  const getLastMessage = () => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const message = chat.lastMessage.content;
    const sender = chat.lastMessage.sender;
    
    if (chat.isGroupChat && sender._id !== currentUserId) {
      return `${sender.name}: ${message}`;
    }
    
    return message;
  };

  return (
    <div 
      className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 group"
      onClick={() => onClick(chat._id)}
    >
      <div className="relative">
        {getChatAvatar()}
        {/* Online status indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
      </div>
      
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {getChatName()}
          </p>
          <div className="flex items-center space-x-2">
            {chat.lastMessage && (
              <p className="text-xs text-gray-500">
                {formatTime(chat.lastMessage.createdAt)}
              </p>
            )}
            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded">
              <MoreVertical size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-600 truncate">
            {getLastMessage()}
          </p>
          {chat.unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-5 text-center">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const NewChatModal = ({ isOpen, onClose, onCreateChat }) => {
  const [chatType, setChatType] = useState('direct'); // 'direct' or 'group'
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // This would typically come from a users API endpoint
  const [availableUsers] = useState([
    { _id: 'user1', name: 'Alice Johnson', email: 'alice@example.com' },
    { _id: 'user2', name: 'Bob Smith', email: 'bob@example.com' },
    { _id: 'user3', name: 'Carol Davis', email: 'carol@example.com' },
    { _id: 'user4', name: 'David Wilson', email: 'david@example.com' },
  ]);

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserToggle = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    const chatData = {
      isGroupChat: chatType === 'group',
      participants: selectedUsers.map(u => u._id),
      ...(chatType === 'group' && { chatName: groupName })
    };

    onCreateChat(chatData);
    onClose();
    
    // Reset form
    setSelectedUsers([]);
    setGroupName('');
    setSearchTerm('');
    setChatType('direct');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">New Chat</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {/* Chat Type Toggle */}
          <div className="flex mb-4">
            <button
              type="button"
              onClick={() => setChatType('direct')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg ${
                chatType === 'direct' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Direct Message
            </button>
            <button
              type="button"
              onClick={() => setChatType('group')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg ${
                chatType === 'group' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Group Chat
            </button>
          </div>

          {/* Group Name (if group chat) */}
          {chatType === 'group' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* User Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Selected:</p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <span
                    key={user._id}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                  >
                    {user.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="max-h-48 overflow-y-auto mb-4">
            {filteredUsers.map(user => (
              <div
                key={user._id}
                className={`flex items-center p-2 rounded cursor-pointer ${
                  selectedUsers.find(u => u._id === user._id)
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleUserToggle(user)}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <User size={16} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                {selectedUsers.find(u => u._id === user._id) && (
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                )}
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedUsers.length === 0}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChatDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { chats, loading, error } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(getChats());
  }, [dispatch]);

  const handleChatClick = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  const handleCreateChat = async (chatData) => {
    await dispatch(createChat(chatData));
    dispatch(getChats()); // Refresh chats list
  };

  // Filter chats based on search
  const filteredChats = chats.filter(chat => {
    if (chat.isGroupChat) {
      return chat.chatName?.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-800">Messages</h1>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            <Plus size={20} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {chats.length === 0 ? 'No conversations yet' : 'No conversations found'}
            </h3>
            <p className="text-gray-500 mb-4">
              {chats.length === 0 
                ? 'Start a new conversation to get started.' 
                : 'Try adjusting your search criteria.'
              }
            </p>
            {chats.length === 0 && (
              <button
                onClick={() => setShowNewChatModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} />
                <span>Start New Chat</span>
              </button>
            )}
          </div>
        ) : (
          filteredChats.map(chat => (
            <ChatItem
              key={chat._id}
              chat={chat}
              onClick={handleChatClick}
              currentUserId={user._id}
            />
          ))
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onCreateChat={handleCreateChat}
      />
    </div>
  );
};

export default ChatDashboard;