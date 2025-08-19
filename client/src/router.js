// client/src/router.js
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import NoteEditor from './pages/NoteEditor';
import SettingsPage from './pages/SettingsPage';
import Whiteboard from './pages/Whiteboard';
import WhiteboardCanvas from './pages/Whiteboard/WhiteboardCanvas';
import ChatDashboard from './pages/Chat/ChatDashboard';
import ChatRoom from './pages/Chat/ChatRoom';
import GroupChat from './pages/Chat/GroupChat';
import CalendarView from './pages/Calendar/CalendarView';
import PublicNotes from './pages/Notes/PublicNotes';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Public routes
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'login',
        element: <LoginPage />
      },
      {
        path: 'signup',
        element: <SignupPage />
      },
      
      // Protected routes with layout
      {
        path: '',
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          // Dashboard/Notes routes
          {
            path: 'dashboard',
            element: <Dashboard />
          },
          {
            path: 'notes',
            children: [
              {
                index: true,
                element: <Dashboard />
              },
              {
                path: 'new',
                element: <NoteEditor />
              },
              {
                path: 'public',
                element: <PublicNotes />
              },
              {
                path: ':id',
                element: <NoteEditor />
              }
            ]
          },
          {
            path: 'note/:id?',
            element: <NoteEditor />
          },
          
          // Whiteboard routes
          {
            path: 'whiteboard',
            children: [
              {
                index: true,
                element: <Whiteboard />
              },
              {
                path: 'new',
                element: <WhiteboardCanvas />
              },
              {
                path: ':id',
                element: <WhiteboardCanvas />
              }
            ]
          },
          
          // Chat routes
          {
            path: 'chat',
            children: [
              {
                index: true,
                element: <ChatDashboard />
              },
              {
                path: ':chatId',
                element: <ChatRoom />
              },
              {
                path: 'group/:chatId',
                element: <GroupChat />
              }
            ]
          },
          
          // Calendar routes
          {
            path: 'calendar',
            element: <CalendarView />
          },
          
          // Settings
          {
            path: 'settings',
            element: <SettingsPage />
          }
        ]
      }
    ]
  }
]);

export default router;
