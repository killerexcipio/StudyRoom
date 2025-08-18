// Main App Component// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Import existing pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import NoteEditor from './pages/NoteEditor';
import SettingsPage from './pages/SettingsPage';

// Import new pages - Whiteboard
import Whiteboard from './pages/Whiteboard';
import WhiteboardCanvas from './pages/Whiteboard/WhiteboardCanvas';

// Import new pages - Chat
import ChatDashboard from './pages/Chat/ChatDashboard';
import ChatRoom from './pages/Chat/ChatRoom';

// Import new pages - Calendar
import CalendarView from './pages/Calendar/CalendarView';

import './App.css';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* Protected routes with layout */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                {/* Dashboard/Notes routes */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="notes" element={<Dashboard />} />
                <Route path="notes/new" element={<NoteEditor />} />
                <Route path="notes/:id" element={<NoteEditor />} />
                
                {/* Whiteboard routes */}
                <Route path="whiteboard" element={<Whiteboard />} />
                <Route path="whiteboard/new" element={<WhiteboardCanvas />} />
                <Route path="whiteboard/:id" element={<WhiteboardCanvas />} />
                
                {/* Chat routes */}
                <Route path="chat" element={<ChatDashboard />} />
                <Route path="chat/:chatId" element={<ChatRoom />} />
                
                {/* Calendar routes */}
                <Route path="calendar" element={<CalendarView />} />
                
                {/* Settings */}
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;