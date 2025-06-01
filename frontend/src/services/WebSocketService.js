// WebSocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.token = null;
    this.userId = null;
    this.eventHandlers = new Map();
    this.activeRooms = new Set();
  }

  // Get the WebSocket server URL
  getServerUrl() {
    if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
      return process.env.REACT_APP_API_URL || 'http://localhost:5000';
    }
    
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    return `${protocol}://${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
  }

  // Connect with authentication
  connect(token, userId) {
    this.token = token;
    this.userId = userId;

    if (!token || !userId) {
      console.error('WebSocketService: Missing token or userId');
      return;
    }

    // Clean up existing socket completely
    if (this.socket) {
      console.log('Cleaning up existing socket');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    try {
      const serverUrl = this.getServerUrl();
      console.log(`Connecting to WebSocket server at ${serverUrl}`);
      
      this.socket = io(serverUrl, {
        withCredentials: true,
        transports: ['polling', 'websocket'],
        timeout: 15000,
        reconnection: false,
        forceNew: true,
        auth: { token }
      });
      
      this.socket.on('connect', () => {
        console.log('WebSocket connected successfully');
        this.isConnected = true;
        
        // Register stored event handlers after connection
        this.registerStoredEventHandlers();
        
        // Rejoin active rooms
        if (this.activeRooms.size > 0) {
          setTimeout(() => {
            this.activeRooms.forEach(roomId => {
              if (this.socket && this.isConnected) {
                console.log(`Rejoining room: ${roomId}`);
                this.socket.emit('join_room', { roomId, userId: this.userId });
              }
            });
          }, 1000);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log(`WebSocket disconnected: ${reason}`);
        this.isConnected = false;
      });
      
    } catch (error) {
      console.error('Error creating socket:', error);
      this.isConnected = false;
    }
  }

  // Disconnect from the server
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting WebSocket');
      
      try {
        // Leave all active rooms before disconnecting
        if (this.isConnected) {
          this.activeRooms.forEach(roomId => {
            this.socket.emit('leave_room', { roomId });
          });
        }
        
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      } catch (error) {
        console.error('Error during disconnect:', error);
        this.socket = null;
      }
      
      this.isConnected = false;
      this.activeRooms.clear();
    }
  }


  
  // Join a room
  joinRoom(roomId) {
    if (!roomId || !this.userId) {
      console.warn('Cannot join room: Missing room ID or user ID');
      return false;
    }
    
    // Always add to active rooms for reconnection scenarios
    this.activeRooms.add(roomId);
    
    if (this.socket && this.isConnected) {
      console.log(`Joining room ${roomId}`);
      try {
        this.socket.emit('join_room', { roomId, userId: this.userId });
        return true;
      } catch (error) {
        console.error('Error joining room:', error);
        return false;
      }
    } else {
      console.log(`Socket not connected, room ${roomId} will be joined when connected`);
      return false;
    }
  }
  
  // Leave a room
  leaveRoom(roomId) {
    if (!roomId) {
      console.warn('Cannot leave room: Missing room ID');
      return false;
    }
    
    // Remove from active rooms
    this.activeRooms.delete(roomId);
    
    if (this.socket && this.isConnected) {
      console.log(`Leaving room ${roomId}`);
      try {
        this.socket.emit('leave_room', { roomId });
        return true;
      } catch (error) {
        console.error('Error leaving room:', error);
        return false;
      }
    } else {
      console.warn(`Cannot leave room ${roomId}: Socket not connected`);
      return false;
    }
  }
  
  // Send a message to a room
  sendMessage(roomId, message) {
    if (!roomId || !message) {
      console.warn('Cannot send message: Missing room ID or message');
      return false;
    }
    
    if (this.socket && this.isConnected) {
      console.log(`Sending message to room ${roomId}`);
      try {
        this.socket.emit('send_message', { roomId, message });
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    } else {
      console.log(`Socket not connected, cannot send message`);
      return false;
    }
  }
  
  // Edit a message
  editMessage(roomId, messageId, newContent) {
    if (!roomId || !messageId || !newContent) {
      console.warn('Cannot edit message: Missing parameters');
      return false;
    }
    
    if (this.socket && this.isConnected) {
      console.log(`Editing message ${messageId} in room ${roomId}`);
      try {
        this.socket.emit('edit_message', { roomId, messageId, newContent });
        return true;
      } catch (error) {
        console.error('Error editing message:', error);
        return false;
      }
    } else {
      console.warn(`Cannot edit message: Socket not connected`);
      return false;
    }
  }
  
  // Register an event handler
  on(event, callback) {
    if (!event || typeof callback !== 'function') {
      console.warn('Invalid event or callback');
      return false;
    }
    
    // Store the handler for future reconnections
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    const handlers = this.eventHandlers.get(event);
    // Only add if not already present
    if (!handlers.includes(callback)) {
      handlers.push(callback);
    }
    
    // Register the handler if socket exists and is connected
    if (this.socket && this.isConnected) {
      this.socket.on(event, callback);
      console.log(`Registered handler for event: ${event}`);
      return true;
    }
    
    return false;
  }
  
  // Remove an event handler
  off(event, callback) {
    if (!event) {
      console.warn('Invalid event');
      return false;
    }
    
    // Remove from stored handlers
    if (this.eventHandlers.has(event)) {
      if (callback) {
        const handlers = this.eventHandlers.get(event);
        const index = handlers.findIndex(h => h === callback);
        if (index !== -1) {
          handlers.splice(index, 1);
          console.log(`Removed stored handler for event: ${event}`);
        }
        if (handlers.length === 0) {
          this.eventHandlers.delete(event);
        }
      } else {
        // Remove all handlers for this event
        this.eventHandlers.delete(event);
        console.log(`Removed all stored handlers for event: ${event}`);
      }
    }
    
    // Remove from socket if it exists
    if (this.socket) {
      try {
        if (callback) {
          this.socket.off(event, callback);
        } else {
          this.socket.off(event);
        }
        console.log(`Removed socket listener for event: ${event}`);
        return true;
      } catch (error) {
        console.error(`Error removing socket listener for ${event}:`, error);
      }
    }
    
    return false;
  }
  
  // Register stored event handlers to a new socket
  registerStoredEventHandlers() {
    if (!this.socket) return;
    
    console.log(`Registering stored event handlers for ${this.eventHandlers.size} events`);
    
    this.eventHandlers.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        try {
          this.socket.on(event, callback);
          console.log(`Registered handler for event: ${event}`);
        } catch (error) {
          console.error(`Error registering handler for ${event}:`, error);
        }
      });
    });
  }
  
  // Check if connected to WebSocket server
  isSocketConnected() {
    return this.isConnected && this.socket?.connected === true;
  }
  
  // Force cleanup and reset
  forceReset() {
    console.log('Force resetting WebSocket service');
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.token = null;
    this.userId = null;
    this.eventHandlers.clear();
    this.activeRooms.clear();
  }
  
  // Get list of active rooms
  getActiveRooms() {
    return Array.from(this.activeRooms);
  }
  
  // Clear event handlers
  clearEventHandlers() {
    console.log('Clearing all event handlers');
    if (this.socket) {
      try {
        this.eventHandlers.forEach((_, event) => {
          this.socket.off(event);
        });
        // Also remove any other potential listeners
        this.socket.removeAllListeners();
      } catch (error) {
        console.error('Error clearing socket event handlers:', error);
      }
    }
    this.eventHandlers.clear();
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;