import { io } from "socket.io-client"

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.token = null;
    this.userId = null;
    this.eventHandlers = new Map();
    this.activeRooms = new Set();
    this.connectionListeners = new Set();
    this.pendingMessages = new Map();
    this.reconnectTimer = null;
  }

  // Helper method for connection status check
  isSocketReady() {
    return this.isConnected && this.socket && this.socket.connected === true;
  }

  // Helper for connection listeners
  addConnectionListener(listener) {
    if (typeof listener === "function") {
      this.connectionListeners.add(listener);
      // Call immediately with current state
      listener(this.isSocketReady());
    }
  }

  removeConnectionListener(listener) {
    if (typeof listener === "function") {
      this.connectionListeners.delete(listener);
    }
  }

  notifyConnectionListeners(connected) {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (error) {
        // Silent error in production
        if (import.meta.env.MODE!== 'production') {
          console.error("Error in connection listener:", error);
        }
      }
    });
  }

  // Server URL with environment awareness
  getServerUrl() {
    if (import.meta.env.MODE === "development" || window.location.hostname === "localhost") {
      return import.meta.env.VITE_API_WS_URI || "http://localhost:5000";
    }
    return "https://cforge.onrender.com";
  }

  // Improved connection method
  connect(token, userId) {
    this.token = token;
    this.userId = userId;

    if (!token || !userId) {
      return;
    }

    // Clean up existing socket
    this.cleanup();

    try {
      const serverUrl = this.getServerUrl();

      this.socket = io(serverUrl, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        timeout: 60000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        forceNew: true,
        auth: { token },
      });

      this.setupSocketListeners();

      // Check immediate connection
      if (this.socket.connected) {
        this.isConnected = true;
        this.notifyConnectionListeners(true);
        this.registerStoredEventHandlers();
      }
    } catch (error) {
      if (import.meta.env.MODE !== 'production') {
        console.error("Error creating socket:", error);
      }
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    }
  }

  // Separate method for socket event setup
  setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.isConnected = true;
      this.notifyConnectionListeners(true);
      this.registerStoredEventHandlers();

      // Rejoin active rooms
      if (this.activeRooms.size > 0) {
        this.rejoinRooms();
      }
    });

    this.socket.on("connect_error", () => {
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    });

    // Backend-specific error handlers
    this.socket.on("room_error", () => { });
    this.socket.on("message_error", () => { });
  }

  // Rejoin rooms helper
  rejoinRooms() {
    if (!this.isSocketReady()) return;

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.activeRooms.forEach((roomId) => {
        if (this.isSocketReady()) {
          this.socket.emit("join_room", { roomId, userId: this.userId });
        }
      });
    }, 1000);
  }

  // Clean up socket
  cleanup() {
    if (this.socket) {
      try {
        // Leave all active rooms
        if (this.isConnected) {
          this.activeRooms.forEach((roomId) => {
            this.socket.emit("leave_room", { roomId });
          });
        }

        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      } catch (error) {
        this.socket = null;
      }

      this.isConnected = false;
      this.notifyConnectionListeners(false);
    }
  }

  disconnect() {
    this.cleanup();
    this.activeRooms.clear();
    this.pendingMessages.clear();
    clearTimeout(this.reconnectTimer);
  }

  // Simplified room management
  joinRoom(roomId) {
    if (!roomId || !this.userId) return false;

    this.activeRooms.add(roomId);

    if (this.isSocketReady()) {
      try {
        this.socket.emit("join_room", { roomId, userId: this.userId });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  leaveRoom(roomId) {
    if (!roomId) return false;

    this.activeRooms.delete(roomId);

    if (this.isSocketReady()) {
      try {
        this.socket.emit("leave_room", { roomId });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  // More efficient message sending
  sendMessage(roomId, messageContent) {
    if (!roomId || !messageContent || !this.userId) return false;
    if (typeof messageContent !== "string") return false;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const messageKey = `${roomId}-${messageContent}-${this.userId}`;

    if (this.pendingMessages.has(messageKey)) return false;

    if (this.isSocketReady()) {
      try {
        this.pendingMessages.set(messageKey, tempId);

        this.socket.emit("send_message", {
          roomId,
          message: {
            content: messageContent,
            sender: this.userId,
            tempId: tempId,
          },
        });

        // Auto-cleanup pending message
        setTimeout(() => {
          this.pendingMessages.delete(messageKey);
        }, 10000);

        return { success: true, tempId };
      } catch {
        this.pendingMessages.delete(messageKey);
        return false;
      }
    }
    return false;
  }

  editMessage(roomId, messageId, newContent) {
    if (!roomId || !messageId || !newContent) return false;

    if (this.isSocketReady()) {
      try {
        this.socket.emit("edit_message", { roomId, messageId, newContent });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  // Event handling with deduplication
  on(event, callback) {
    if (!event || typeof callback !== "function") return false;

    // Store handler
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }

    const handlers = this.eventHandlers.get(event);

    // Only add if not already present
    if (!handlers.includes(callback)) {
      handlers.push(callback);
    }

    // Register if socket ready
    if (this.isSocketReady()) {
      this.socket.on(event, callback);
      return true;
    }

    return false;
  }

  off(event, callback) {
    if (!event) return false;

    // Update stored handlers
    if (this.eventHandlers.has(event)) {
      if (callback) {
        const handlers = this.eventHandlers.get(event);
        const index = handlers.findIndex((h) => h === callback);

        if (index !== -1) {
          handlers.splice(index, 1);
        }

        if (handlers.length === 0) {
          this.eventHandlers.delete(event);
        }
      } else {
        this.eventHandlers.delete(event);
      }
    }

    // Remove from socket
    if (this.socket) {
      try {
        if (callback) {
          this.socket.off(event, callback);
        } else {
          this.socket.off(event);
        }
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  registerStoredEventHandlers() {
    if (!this.socket) return;

    this.eventHandlers.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        try {
          this.socket.on(event, callback);
        } catch { }
      });
    });
  }

  // Renamed for clarity 
  isSocketConnected() {
    return this.isSocketReady();
  }

  forceReset() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.notifyConnectionListeners(false);
    this.pendingMessages.clear();
    clearTimeout(this.reconnectTimer);
  }

  getActiveRooms() {
    return Array.from(this.activeRooms);
  }

  clearEventHandlers() {
    if (this.socket) {
      try {
        this.eventHandlers.forEach((_, event) => {
          this.socket.off(event);
        });
        this.socket.removeAllListeners();
      } catch { }
    }
    this.eventHandlers.clear();
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;