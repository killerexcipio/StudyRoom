// client/src/components/UserAvatar.jsx
import React from 'react';
import { User } from 'lucide-react';

const UserAvatar = ({ 
  user, 
  size = 'md', 
  showOnlineStatus = false, 
  className = "",
  onClick = null 
}) => {
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-20 w-20 text-2xl'
  };

  const onlineIndicatorSizes = {
    xs: 'h-2 w-2',
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5',
    xl: 'h-4 w-4',
    '2xl': 'h-5 w-5'
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarElement = (
    <div className={`relative ${onClick ? 'cursor-pointer' : ''}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          flex 
          items-center 
          justify-center 
          font-semibold 
          transition-colors
          ${user?.avatar 
            ? 'overflow-hidden' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
          }
          ${onClick ? 'hover:opacity-80' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user?.name || 'User'}
            className="h-full w-full object-cover"
          />
        ) : user?.name ? (
          getInitials(user.name)
        ) : (
          <User size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : size === 'lg' ? 18 : size === 'xl' ? 20 : 24} />
        )}
      </div>
      
      {showOnlineStatus && (
        <div
          className={`
            absolute 
            -bottom-0.5 
            -right-0.5 
            ${onlineIndicatorSizes[size]}
            rounded-full 
            border-2 
            border-white
            ${user?.isOnline ? 'bg-green-500' : 'bg-gray-400'}
          `}
        />
      )}
    </div>
  );

  return avatarElement;
};

export default UserAvatar;
