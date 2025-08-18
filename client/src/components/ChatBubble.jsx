// client/src/components/ChatBubble.jsx
import React from 'react';
import { User, Check, CheckCheck } from 'lucide-react';

const ChatBubble = ({ message, isOwnMessage, showAvatar, showTimestamp }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getMessageStatus = () => {
    if (!isOwnMessage) return null;
    
    switch (message.status) {
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={14} className="text-blue-500" />;
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'image':
        return (
          <div className="max-w-xs">
            <img 
              src={message.content} 
              alt="Shared image"
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        );
      case 'file':
        return (
          <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                📎
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {message.fileName || 'File'}
                </p>
                <p className="text-xs text-gray-500">
                  {message.fileSize || 'Unknown size'}
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <p className="text-sm break-words whitespace-pre-wrap">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div className={`flex items-start space-x-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex flex-col items-center ${isOwnMessage ? 'order-2' : ''}`}>
        {showAvatar ? (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            {message.sender.avatar ? (
              <img 
                src={message.sender.avatar} 
                alt={message.sender.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={14} className="text-gray-600" />
            )}
          </div>
        ) : (
          <div className="w-8 h-8" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-xs lg:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Sender Name (for group chats and non-own messages) */}
        {showAvatar && !isOwnMessage && (
          <p className="text-xs text-gray-500 mb-1 px-3">
            {message.sender.name}
          </p>
        )}

        {/* Message Bubble */}
        <div className={`
          px-3 py-2 rounded-2xl max-w-full
          ${isOwnMessage 
            ? 'bg-blue-600 text-white rounded-br-md' 
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }
        `}>
          {renderMessageContent()}
        </div>

        {/* Timestamp and Status */}
        {showTimestamp && (
          <div className={`flex items-center space-x-1 mt-1 px-1 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <span className="text-xs text-gray-500">
              {formatTime(message.createdAt)}
            </span>
            {getMessageStatus()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;