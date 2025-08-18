// client/src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FileText, 
  PenTool, 
  MessageCircle, 
  Calendar,
  Settings,
  Home
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Notes',
      href: '/notes',
      icon: FileText,
      current: location.pathname.startsWith('/notes') && location.pathname !== '/notes'
    },
    {
      name: 'Whiteboard',
      href: '/whiteboard',
      icon: PenTool,
      current: location.pathname.startsWith('/whiteboard')
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: MessageCircle,
      current: location.pathname.startsWith('/chat')
    },
    {
      name: 'Calendar',
      href: '/calendar',
      icon: Calendar,
      current: location.pathname.startsWith('/calendar')
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings'
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive || item.current
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    item.current
                      ? 'text-blue-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;