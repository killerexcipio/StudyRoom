const logger = require('../utils/logger');
const User = require('../models/User');

// Store active whiteboard sessions and their states
const whiteboardSessions = new Map();
const userCursors = new Map();
const drawingHistory = new Map();

const whiteboardSocket = (io, socket) => {

  // Join whiteboard session
  socket.on('join_whiteboard', async (data) => {
    try {
      const { whiteboardId, userId } = data;
      
      if (!whiteboardId || !userId) {
        socket.emit('error', { message: 'Whiteboard ID and User ID are required' });
        return;
      }

      // Get user info
      const user = await User.findById(userId).select('username avatar');
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      // Join whiteboard room
      socket.join(`whiteboard_${whiteboardId}`);
      socket.currentWhiteboardId = whiteboardId;
      socket.userId = userId;

      // Initialize session if it doesn't exist
      if (!whiteboardSessions.has(whiteboardId)) {
        whiteboardSessions.set(whiteboardId, {
          participants: new Map(),
          canvasState: [],
          createdAt: new Date(),
          lastActivity: new Date()
        });
        drawingHistory.set(whiteboardId, {
          undoStack: [],
          redoStack: [],
          currentVersion: 0
        });
      }

      const session = whiteboardSessions.get(whiteboardId);
      
      // Add user to session
      session.participants.set(userId, {
        socketId: socket.id,
        username: user.username,
        avatar: user.avatar,
        joinedAt: new Date(),
        isActive: true,
        currentTool: 'pen',
        color: '#000000'
      });

      // Notify other users
      socket.to(`whiteboard_${whiteboardId}`).emit('user_joined_whiteboard', {
        userId,
        username: user.username,
        avatar: user.avatar,
        timestamp: new Date()
      });

      // Send current canvas state to the new user
      socket.emit('whiteboard_joined', {
        whiteboardId,
        canvasState: session.canvasState,
        participants: Array.from(session.participants.values()).map(p => ({
          userId: p.userId,
          username: p.username,
          avatar: p.avatar,
          isActive: p.isActive,
          currentTool: p.currentTool,
          color: p.color
        })),
        cursors: getActiveCursors(whiteboardId)
      });

      logger.logSocket('joined_whiteboard', socket.id, userId);

    } catch (error) {
      logger.logError(error);
      socket.emit('error', { message: 'Failed to join whiteboard' });
    }
  });

  // Leave whiteboard
  socket.on('leave_whiteboard', (data) => {
    try {
      const { whiteboardId, userId } = data;
      
      if (socket.currentWhiteboardId) {
        const session = whiteboardSessions.get(socket.currentWhiteboardId);
        
        if (session && session.participants.has(userId)) {
          session.participants.delete(userId);
          
          // Remove cursor
          userCursors.delete(userId);
          
          // Clean up empty sessions
          if (session.participants.size === 0) {
            whiteboardSessions.delete(socket.currentWhiteboardId);
            drawingHistory.delete(socket.currentWhiteboardId);
          }
        }

        socket.leave(`whiteboard_${socket.currentWhiteboardId}`);
        
        // Notify other users
        socket.to(`whiteboard_${socket.currentWhiteboardId}`).emit('user_left_whiteboard', {
          userId,
          timestamp: new Date()
        });

        socket.currentWhiteboardId = null;
        logger.logSocket('left_whiteboard', socket.id, userId);
      }
    } catch (error) {
      logger.logError(error);
    }
  });

  // Handle drawing events
  socket.on('drawing_start', (data) => {
    try {
      const { whiteboardId, x, y, tool, color, strokeWidth, userId } = data;
      
      if (!whiteboardId || !userId) return;

      const drawingData = {
        type: 'drawing_start',
        userId,
        x,
        y,
        tool,
        color,
        strokeWidth,
        timestamp: Date.now(),
        id: generateDrawingId()
      };

      // Broadcast to other users
      socket.to(`whiteboard_${whiteboardId}`).emit('drawing_start', drawingData);

      // Update session
      const session = whiteboardSessions.get(whiteboardId);
      if (session) {
        session.lastActivity = new Date();
      }

    } catch (error) {
      logger.logError(error);
    }
  });

  socket.on('drawing_move', (data) => {
    try {
      const { whiteboardId, x, y, userId, id } = data;
      
      if (!whiteboardId || !userId) return;

      const drawingData = {
        type: 'drawing_move',
        userId,
        x,
        y,
        id,
        timestamp: Date.now()
      };

      // Broadcast to other users
      socket.to(`whiteboard_${whiteboardId}`).emit('drawing_move', drawingData);

    } catch (error) {
      logger.logError(error);
    }
  });

  socket.on('drawing_end', (data) => {
    try {
      const { whiteboardId, userId, id, path } = data;
      
      if (!whiteboardId || !userId) return;

      const drawingData = {
        type: 'drawing_end',
        userId,
        id,
        path,
        timestamp: Date.now()
      };

      // Broadcast to other users
      socket.to(`whiteboard_${whiteboardId}`).emit('drawing_end', drawingData);

      // Save to canvas state
      const session = whiteboardSessions.get(whiteboardId);
      if (session) {
        session.canvasState.push(drawingData);
        session.lastActivity = new Date();
        
        // Add to history for undo/redo
        const history = drawingHistory.get(whiteboardId);
        if (history) {
          history.undoStack.push({
            action: 'add',
            data: drawingData
          });
          history.redoStack = []; // Clear redo stack
          history.currentVersion++;
        }
      }

    } catch (error) {
      logger.logError(error);
    }
  });

  // Handle shape drawing
  socket.on('shape_draw', (data) => {
    try {
      const { whiteboardId, shape, startX, startY, endX, endY, tool, color, strokeWidth, userId } = data;
      
      if (!whiteboardId || !userId) return;

      const shapeData = {
        type: 'shape',
        userId,
        shape,
        startX,
        startY,
        endX,
        endY,
        tool,
        color,
        strokeWidth,
        timestamp: Date.now(),
        id: generateDrawingId()
      };

      // Broadcast to all users including sender
      io.to(`whiteboard_${whiteboardId}`).emit('shape_drawn', shapeData);

      // Save to canvas state
      const session = whiteboardSessions.get(whiteboardId);
      if (session) {
        session.canvasState.push(shapeData);
        session.lastActivity = new Date();
        
        // Add to history
        const history = drawingHistory.get(whiteboardId);
        if (history) {
          history.undoStack.push({
            action: 'add',
            data: shapeData
          });
          history.redoStack = [];
          history.currentVersion++;
        }
      }

    } catch (error) {
      logger.logError(error);
    }
  });

  // Handle text insertion
  socket.on('text_add', (data) => {
    try {
      const { whiteboardId, text, x, y, fontSize, color, fontFamily, userId } = data;
      
      if (!whiteboardId || !userId || !text) return;

      const textData = {
        type: 'text',
        userId,
        text,
        x,
        y,
        fontSize,
        color,
        fontFamily,
        timestamp: Date.now(),
        id: generateDrawingId()
      };

      // Broadcast to all users
      io.to(`whiteboard_${whiteboardId}`).emit('text_added', textData);

      // Save to canvas state
      const session = whiteboardSessions.get(whiteboardId);
      if (session) {
        session.canvasState.push(textData);
        session.lastActivity = new Date();
        
        // Add to history
        const history = drawingHistory.get(whiteboardId);
        if (history) {
          history.undoStack.push({
            action: 'add',
            data: textData
          });
          history.redoStack = [];
          history.currentVersion++;
        }
      }

    } catch (error) {
      logger.logError(error);
    }
  });

  // Handle eraser
  socket.on('erase_element', (data) => {
    try {
      const { whiteboardId, elementId, userId } = data;
      
      if (!whiteboardId || !elementId || !userId) return;

      const session = whiteboardSessions.get(whiteboardId);
      if (!session) return;

      // Find and remove element
      const elementIndex = session.canvasState.findIndex(el => el.id === elementId);
      if (elementIndex !== -1) {
        const removedElement = session.canvasState.splice(elementIndex, 1)[0];
        
        // Broadcast removal
        io.to(`whiteboard_${whiteboardId}`).emit('element_erased', {
          elementId,
          userId,
          timestamp: Date.now()
        });

        // Add to history
        const history = drawingHistory.get(whiteboardId);
        if (history) {
          history.undoStack.push({
            action: 'remove',
            data: removedElement,
            index: elementIndex
          });
          history.redoStack = [];
          history.currentVersion++;
        }

        session.lastActivity = new Date();
      }

    } catch (error) {
      logger.logError(error);
    }
  });

  // Handle cursor movement
  socket.on('cursor_move', (data) => {
    try {
      const { whiteboardId, x, y, userId } = data;
      
      if (!whiteboardId || !userId) return;

      userCursors.set(userId, {
        whiteboardId,
        x,
        y,
        timestamp: Date.now()
      });

      // Broadcast cursor position to other users
      socket.to(`whiteboard_${whiteboardId}`).emit('cursor_moved', {
        userId,
        x,
        y,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.logError(error);
    }
  });

  // Handle tool change
  socket.on('tool_change', (data) => {
    try {
      const { whiteboardId, tool, color, strokeWidth, userId } = data;
      
      if (!whiteboardId || !userId) return;

      const session = whiteboardSessions.get(whiteboardId);
      if (session && session.participants.has(userId)) {
        const participant = session.participants.get(userId);
        participant.currentTool = tool;
        if (color) participant.color = color;
        if (strokeWidth) participant.strokeWidth = strokeWidth;

        // Broadcast tool change
        socket.to(`whiteboard_${whiteboardId}`).emit('user_tool_changed', {
          userId,
          tool,
          color,
          strokeWidth,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      logger.logError(error);
    }
  });

  // Handle undo
  socket.on('undo', (data) => {
    try {
      const { whiteboardId, userId } = data;
      
      if (!whiteboardId || !userId) return;

      const history = drawingHistory.get(whiteboardId);
      const session = whiteboardSessions.get(whiteboardId);
      
      if (!history || !session || history.undoStack.length === 0) return;

      const lastAction = history.undoStack.pop();
      history.redoStack.push(lastAction);

      if (lastAction.action === 'add') {
        // Remove the last added element
        const elementIndex = session.canvasState.findIndex(el => el.id === lastAction.data.id);
        if (elementIndex !== -1) {
          session.canvasState.splice(elementIndex, 1);
        }
      } else if (lastAction.action === 'remove') {
        // Re-add the removed element
        session.canvasState.splice(lastAction.index, 0, lastAction.data);
      }

      // Broadcast undo action
      io.to(`whiteboard_${whiteboardId}`).emit('canvas_updated', {
        canvasState: session.canvasState,
        action: 'undo',
        userId,
        timestamp: Date.now()
      });

      history.currentVersion--;

    } catch (error) {
      logger.logError(error);
    }
  });

  // Handle redo
  socket.on('redo', (data) => {
    try {
      const { whiteboardId, userId } = data;
      
      if (!whiteboardId || !userId) return;

      const history = drawingHistory.get(whiteboardId);
      const session = whiteboardSessions.get(whiteboardId);
      
      if (!history || !session || history.redoStack.length === 0) return;

      const redoAction = history.redoStack.pop();
      history.undoStack.push(redoAction);

      if (redoAction.action === 'add') {
        // Re-add the element
        session.canvasState.push(redoAction.data);
      } else if (redoAction.action === 'remove') {
        // Remove the element again
        const elementIndex = session.canvasState.findIndex(el => el.id === redoAction.data.id);
        if (elementIndex !== -1) {
          session.canvasState.splice(elementIndex, 1);
        }
      }

      // Broadcast redo action
      io.to(`whiteboard_${whiteboardId}`).emit('canvas_updated', {
        canvasState: session.canvasState,
        action: 'redo',
        userId,
        timestamp: Date.now()
      });

      history.currentVersion++;

    } catch (error) {
      logger.logError(error);
    }
  });

  // Handle clear canvas
  socket.on('clear_canvas', (data) => {
    try {
      const { whiteboardId, userId } = data;
      
      if (!whiteboardId || !userId) return;

      const session = whiteboardSessions.get(whiteboardId);
      if (!session) return;

      // Save current state for undo
      const history = drawingHistory.get(whiteboardId);
      if (history) {
        history.undoStack.push({
          action: 'clear',
          data: [...session.canvasState]
        });
        history.redoStack = [];
      }

      // Clear canvas
      session.canvasState = [];
      session.lastActivity = new Date();

      // Broadcast clear action
      io.to(`whiteboard_${whiteboardId}`).emit('canvas_cleared', {
        userId,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.logError(error);
    }
  });

  // Handle save whiteboard
  socket.on('save_whiteboard', async (data) => {
    try {
      const { whiteboardId, name, userId } = data;
      
      if (!whiteboardId || !userId) return;

      const session = whiteboardSessions.get(whiteboardId);
      if (!session) return;

      // Here you would typically save to your database
      // For now, we'll just emit a success message
      socket.emit('whiteboard_saved', {
        whiteboardId,
        name: name || `Whiteboard ${Date.now()}`,
        timestamp: new Date(),
        elementCount: session.canvasState.length
      });

      logger.logInfo(`Whiteboard ${whiteboardId} saved by user ${userId}`);

    } catch (error) {
      logger.logError(error);
      socket.emit('error', { message: 'Failed to save whiteboard' });
    }
  });

  // Handle load whiteboard
  socket.on('load_whiteboard', async (data) => {
    try {
      const { whiteboardId, savedWhiteboardId, userId } = data;
      
      if (!whiteboardId || !savedWhiteboardId || !userId) return;

      // Here you would load from your database
      // For now, we'll simulate loading
      const session = whiteboardSessions.get(whiteboardId);
      if (session) {
        // Broadcast loaded canvas
        io.to(`whiteboard_${whiteboardId}`).emit('whiteboard_loaded', {
          canvasState: session.canvasState,
          loadedBy: userId,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      logger.logError(error);
      socket.emit('error', { message: 'Failed to load whiteboard' });
    }
  });

  // Handle zoom and pan
  socket.on('viewport_change', (data) => {
    try {
      const { whiteboardId, zoom, panX, panY, userId } = data;
      
      if (!whiteboardId || !userId) return;

      // Broadcast viewport change to other users (optional)
      socket.to(`whiteboard_${whiteboardId}`).emit('user_viewport_changed', {
        userId,
        zoom,
        panX,
        panY,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.logError(error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userId = socket.userId;
    const whiteboardId = socket.currentWhiteboardId;
    
    if (userId && whiteboardId) {
      const session = whiteboardSessions.get(whiteboardId);
      
      if (session && session.participants.has(userId)) {
        session.participants.delete(userId);
        
        // Remove cursor
        userCursors.delete(userId);
        
        // Clean up empty sessions
        if (session.participants.size === 0) {
          whiteboardSessions.delete(whiteboardId);
          drawingHistory.delete(whiteboardId);
        }
      }
      
      // Notify other users
      socket.to(`whiteboard_${whiteboardId}`).emit('user_left_whiteboard', {
        userId,
        timestamp: new Date()
      });
    }
  });
};

// Helper functions
function generateDrawingId() {
  return `draw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getActiveCursors(whiteboardId) {
  const cursors = [];
  const now = Date.now();
  
  for (const [userId, cursor] of userCursors.entries()) {
    if (cursor.whiteboardId === whiteboardId && (now - cursor.timestamp) < 5000) {
      cursors.push({
        userId,
        x: cursor.x,
        y: cursor.y
      });
    }
  }
  
  return cursors;
}

// Clean up old cursor data periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, cursor] of userCursors.entries()) {
    if (now - cursor.timestamp > 10000) { // 10 seconds old
      userCursors.delete(userId);
    }
  }
}, 30000); // Clean every 30 seconds

module.exports = whiteboardSocket;