import { io } from "socket.io-client"

class WebSocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.token = null
    this.userId = null
    this.eventHandlers = new Map()
    this.activeRooms = new Set()
    this.connectionListeners = new Set()
    this.pendingMessages = new Map() // FIXED: Track pending messages to prevent duplicates
  }

  // FIXED: Add connection listener
  addConnectionListener(listener) {
    if (typeof listener === "function") {
      this.connectionListeners.add(listener)
      // Call immediately with current state
      listener(this.isSocketConnected())
    }
  }

  // FIXED: Remove connection listener
  removeConnectionListener(listener) {
    if (typeof listener === "function") {
      this.connectionListeners.delete(listener)
    }
  }

  // FIXED: Notify all connection listeners
  notifyConnectionListeners(connected) {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(connected)
      } catch (error) {
        console.error("Error in connection listener:", error)
      }
    })
  }

  // Get the WebSocket server URL
  getServerUrl() {
    if (import.meta.env.MODE === "development" || window.location.hostname === "localhost") {
      return import.meta.env.VITE_API_WS_URI || "http://localhost:5000";
    }

    // Production
    return "https://cforge.onrender.com";
  }


  // Connect with authentication - Updated to match backend expectations
  connect(token, userId) {
    this.token = token
    this.userId = userId

    if (!token || !userId) {
      console.error("WebSocketService: Missing token or userId")
      return
    }

    // Clean up existing socket completely
    if (this.socket) {
      console.log("Cleaning up existing socket")
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.notifyConnectionListeners(false)
    }

    try {
      const serverUrl = this.getServerUrl()
      console.log(`Connecting to WebSocket server at ${serverUrl}`)

      // FIXED: Updated connection options for better reliability
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
      })

      // FIXED: Add more robust connection event handling
      this.socket.on("connect", () => {
        console.log("WebSocket connected successfully")
        this.isConnected = true
        this.notifyConnectionListeners(true)

        // Register stored event handlers after connection
        this.registerStoredEventHandlers()

        // Rejoin active rooms with proper format expected by backend
        if (this.activeRooms.size > 0) {
          setTimeout(() => {
            this.activeRooms.forEach((roomId) => {
              if (this.socket && this.isConnected) {
                console.log(`Rejoining room: ${roomId}`)
                this.socket.emit("join_room", { roomId, userId: this.userId })
              }
            })
          }, 1000)
        }
      })

      this.socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error)
        this.isConnected = false
        this.notifyConnectionListeners(false)
      })

      this.socket.on("disconnect", (reason) => {
        console.log(`WebSocket disconnected: ${reason}`)
        this.isConnected = false
        this.notifyConnectionListeners(false)
      })

      // FIXED: Add backend-specific error handlers
      this.socket.on("room_error", (error) => {
        console.error("Room error:", error)
      })

      this.socket.on("message_error", (error) => {
        console.error("Message error:", error)
      })

      // FIXED: Check if already connected immediately after setup
      if (this.socket.connected) {
        console.log("Socket already connected immediately after setup")
        this.isConnected = true
        this.notifyConnectionListeners(true)
        this.registerStoredEventHandlers()
      }
    } catch (error) {
      console.error("Error creating socket:", error)
      this.isConnected = false
      this.notifyConnectionListeners(false)
    }
  }

  // Disconnect from the server
  disconnect() {
    if (this.socket) {
      console.log("Disconnecting WebSocket")

      try {
        // Leave all active rooms before disconnecting
        if (this.isConnected) {
          this.activeRooms.forEach((roomId) => {
            this.socket.emit("leave_room", { roomId })
          })
        }

        this.socket.removeAllListeners()
        this.socket.disconnect()
        this.socket = null
      } catch (error) {
        console.error("Error during disconnect:", error)
        this.socket = null
      }

      this.isConnected = false
      this.notifyConnectionListeners(false)
      this.activeRooms.clear()
      this.pendingMessages.clear() // FIXED: Clear pending messages
    }
  }

  // Join a room - Updated to match backend expectations
  joinRoom(roomId) {
    if (!roomId || !this.userId) {
      console.warn("Cannot join room: Missing room ID or user ID")
      return false
    }

    // Always add to active rooms for reconnection scenarios
    this.activeRooms.add(roomId)

    // FIXED: More robust connection check
    if (this.socket && this.socket.connected && this.isConnected) {
      console.log(`Joining room ${roomId}`)
      try {
        // Match backend expected format exactly
        this.socket.emit("join_room", { roomId, userId: this.userId })
        return true
      } catch (error) {
        console.error("Error joining room:", error)
        return false
      }
    } else {
      console.log(`Socket not connected, room ${roomId} will be joined when connected`)
      return false
    }
  }

  // Leave a room - Updated to match backend expectations
  leaveRoom(roomId) {
    if (!roomId) {
      console.warn("Cannot leave room: Missing room ID")
      return false
    }

    // Remove from active rooms
    this.activeRooms.delete(roomId)

    // FIXED: More robust connection check
    if (this.socket && this.socket.connected && this.isConnected) {
      console.log(`Leaving room ${roomId}`)
      try {
        // Match backend expected format
        this.socket.emit("leave_room", { roomId })
        return true
      } catch (error) {
        console.error("Error leaving room:", error)
        return false
      }
    } else {
      console.warn(`Cannot leave room ${roomId}: Socket not connected`)
      return false
    }
  }

  // FIXED: Send a message to a room with duplicate prevention
  sendMessage(roomId, messageContent) {
    if (!roomId || !messageContent || !this.userId) {
      console.warn("Cannot send message: Missing room ID, message content, or user ID")
      return false
    }

    // FIXED: Validate message content is a string
    if (typeof messageContent !== "string") {
      console.error("Invalid message format: message content must be a string, received:", typeof messageContent)
      return false
    }

    // FIXED: Generate tempId for tracking
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // FIXED: Check for duplicate pending messages
    const messageKey = `${roomId}-${messageContent}-${this.userId}`
    if (this.pendingMessages.has(messageKey)) {
      console.log("Duplicate message detected, ignoring:", messageKey)
      return false
    }

    // FIXED: More robust connection check
    if (this.socket && this.socket.connected && this.isConnected) {
      console.log(`Sending message to room ${roomId} with tempId: ${tempId}`)
      try {
        // FIXED: Track pending message to prevent duplicates
        this.pendingMessages.set(messageKey, tempId)

        // FIXED: Send message in the format expected by backend
        this.socket.emit("send_message", {
          roomId,
          message: {
            content: messageContent,
            sender: this.userId,
            tempId: tempId,
          },
        })

        // FIXED: Clear pending message after a timeout
        setTimeout(() => {
          this.pendingMessages.delete(messageKey)
        }, 10000) // 10 seconds timeout

        // FIXED: Return the tempId so the caller can track it
        return { success: true, tempId }
      } catch (error) {
        console.error("Error sending message:", error)
        this.pendingMessages.delete(messageKey)
        return false
      }
    } else {
      console.log(`Socket not connected, cannot send message`)
      return false
    }
  }

  // Edit a message - Updated to match backend expectations
  editMessage(roomId, messageId, newContent) {
    if (!roomId || !messageId || !newContent) {
      console.warn("Cannot edit message: Missing parameters")
      return false
    }

    // FIXED: More robust connection check
    if (this.socket && this.socket.connected && this.isConnected) {
      console.log(`Editing message ${messageId} in room ${roomId}`)
      try {
        // Match backend expected format exactly
        this.socket.emit("edit_message", { roomId, messageId, newContent })
        return true
      } catch (error) {
        console.error("Error editing message:", error)
        return false
      }
    } else {
      console.warn(`Cannot edit message: Socket not connected`)
      return false
    }
  }

  // Register an event handler
  on(event, callback) {
    if (!event || typeof callback !== "function") {
      console.warn("Invalid event or callback")
      return false
    }

    // Store the handler for future reconnections
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }

    const handlers = this.eventHandlers.get(event)
    // Only add if not already present
    if (!handlers.includes(callback)) {
      handlers.push(callback)
    }

    // Register the handler if socket exists and is connected
    if (this.socket && this.isConnected) {
      this.socket.on(event, callback)
      console.log(`Registered handler for event: ${event}`)
      return true
    }

    return false
  }

  // Remove an event handler
  off(event, callback) {
    if (!event) {
      console.warn("Invalid event")
      return false
    }

    // Remove from stored handlers
    if (this.eventHandlers.has(event)) {
      if (callback) {
        const handlers = this.eventHandlers.get(event)
        const index = handlers.findIndex((h) => h === callback)
        if (index !== -1) {
          handlers.splice(index, 1)
          console.log(`Removed stored handler for event: ${event}`)
        }
        if (handlers.length === 0) {
          this.eventHandlers.delete(event)
        }
      } else {
        // Remove all handlers for this event
        this.eventHandlers.delete(event)
        console.log(`Removed all stored handlers for event: ${event}`)
      }
    }

    // Remove from socket if it exists
    if (this.socket) {
      try {
        if (callback) {
          this.socket.off(event, callback)
        } else {
          this.socket.off(event)
        }
        console.log(`Removed socket listener for event: ${event}`)
        return true
      } catch (error) {
        console.error(`Error removing socket listener for ${event}:`, error)
      }
    }

    return false
  }

  // Register stored event handlers to a new socket
  registerStoredEventHandlers() {
    if (!this.socket) return

    console.log(`Registering stored event handlers for ${this.eventHandlers.size} events`)

    this.eventHandlers.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        try {
          this.socket.on(event, callback)
          console.log(`Registered handler for event: ${event}`)
        } catch (error) {
          console.error(`Error registering handler for ${event}:`, error)
        }
      })
    })
  }

  // Check if connected to WebSocket server
  isSocketConnected() {
    // FIXED: More robust connection check
    return this.isConnected && this.socket && this.socket.connected === true
  }

  // Force cleanup and reset
  forceReset() {
    console.log("Force resetting WebSocket service")
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
    this.notifyConnectionListeners(false)
    this.pendingMessages.clear() // FIXED: Clear pending messages
    // Don't clear token and userId to allow reconnection
    // Don't clear event handlers to preserve them for reconnection
    // Don't clear active rooms to allow rejoining
  }

  // Get list of active rooms
  getActiveRooms() {
    return Array.from(this.activeRooms)
  }

  // Clear event handlers
  clearEventHandlers() {
    console.log("Clearing all event handlers")
    if (this.socket) {
      try {
        this.eventHandlers.forEach((_, event) => {
          this.socket.off(event)
        })
        // Also remove any other potential listeners
        this.socket.removeAllListeners()
      } catch (error) {
        console.error("Error clearing socket event handlers:", error)
      }
    }
    this.eventHandlers.clear()
  }
}

// Create singleton instance
const webSocketService = new WebSocketService()

export default webSocketService
