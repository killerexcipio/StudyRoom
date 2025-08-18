// client/src/store/store.js (Note: Create client/src/store/ directory)
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import notesReducer from '../features/notes/notesSlice';
import whiteboardReducer from '../features/whiteboard/whiteboardSlice';
import chatReducer from '../features/chat/chatSlice';
import calendarReducer from '../features/calendar/calendarSlice';
import userReducer from '../features/user/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notes: notesReducer,
    whiteboard: whiteboardReducer,
    chat: chatReducer,
    calendar: calendarReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

