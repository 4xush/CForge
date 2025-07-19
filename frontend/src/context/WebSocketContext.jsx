"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useLocation } from "react-router-dom"
import { useAuthContext } from "./AuthContext"
import webSocketService from "../services/WebSocketService"
import toast from "react-hot-toast"
import webSocketErrorHandler from "../utils/websocketErrorHandler"
import PropTypes from "prop-types"

const WebSocketContext = createContext()

export const WebSocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const { authUser } = useAuthContext()
  const location = useLocation()

  const maxRetries = 5
  const retryDelay = 2000

  const visibilityTimeoutRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const connectionAttemptRef = useRef(0)
  const connectionLockRef = useRef(false)

  // FIXED: Direct connection listener
  useEffect(() => {
    const handleConnectionChange = (isConnected) => {
      // // console.log(`WebSocketContext: Direct connection change detected: ${isConnected}`)
      setConnected(isConnected)
      if (isConnected) {
        setConnecting(false)
        connectionAttemptRef.current = 0
        connectionLockRef.current = false
      }
    }

    // Add direct connection listener
    webSocketService.addConnectionListener(handleConnectionChange)

    // Initial state check
    setConnected(webSocketService.isSocketConnected())

    return () => {
      webSocketService.removeConnectionListener(handleConnectionChange)
    }
  }, [])

  const isWebSocketNeeded = useCallback(() => {
    return location.pathname.includes("/rooms/") && location.pathname.includes("/chat")
  }, [location.pathname])

  // FIXED: Improved direct socket event handlers with better state management
  const handleDirectConnect = useCallback(() => {
    // // console.log("Direct socket connect event received")
    setConnected(true)
    setConnecting(false)
    connectionAttemptRef.current = 0
    connectionLockRef.current = false
    toast.success("Connected to chat server", { duration: 2000 })
  }, [])

  const handleDirectDisconnect = useCallback((reason) => {
    // console.log("Direct socket disconnect event received:", reason)
    if (reason !== "io client disconnect") {
      setConnected(false)
      // Don't set connecting to false here as reconnection might be in progress
    }
  }, [])

  const handleDirectConnectError = useCallback((error) => {
    console.error("Direct socket connection error:", error)
    setConnected(false)
    setConnecting(false)
    connectionLockRef.current = false
  }, [])

  // FIXED: Improved connection logic with better state management and deduplication
  const connectWithRetry = useCallback(
    async (token, userId) => {
      // FIXED: Check if already connected first
      if (webSocketService.isSocketConnected()) {
        // console.log("WebSocket already connected via direct check.")
        setConnected(true)
        setConnecting(false)
        connectionAttemptRef.current = 0
        connectionLockRef.current = false
        return
      }

      // Prevent duplicate connection attempts
      if (connectionLockRef.current) {
        // console.log("Connection attempt already in progress, skipping ConnectWithRetry call.")
        return
      }

      // Set lock before any async operations
      connectionLockRef.current = true
      setConnecting(true)

      // console.log(`WebSocket connection attempt ${connectionAttemptRef.current + 1}/${maxRetries}`)

      try {
        // Ensure clean state before new connection
        webSocketService.forceReset()

        // Add a small delay to ensure clean state
        await new Promise((resolve) => setTimeout(resolve, 200))

        // Setup direct socket event listeners BEFORE connect call
        webSocketService.connect(token, userId)

        if (webSocketService.socket) {
          // Remove any existing listeners first to prevent duplicates
          webSocketService.socket.off("connect", handleDirectConnect)
          webSocketService.socket.off("disconnect", handleDirectDisconnect)
          webSocketService.socket.off("connect_error", handleDirectConnectError)

          // Use once for connect to prevent duplicate handlers
          webSocketService.socket.once("connect", handleDirectConnect)
          webSocketService.socket.on("disconnect", handleDirectDisconnect)
          webSocketService.socket.on("connect_error", handleDirectConnectError)

          // Check if already connected (might have connected during setup)
          if (webSocketService.socket.connected) {
            // console.log("Socket already connected during setup")
            handleDirectConnect()
          }
        } else {
          throw new Error("Socket instance not available after connect call.")
        }
      } catch (error) {
        console.error(`WebSocket connection attempt ${connectionAttemptRef.current + 1} failed:`, error)
        connectionLockRef.current = false
        setConnecting(false)

        connectionAttemptRef.current += 1
        if (connectionAttemptRef.current < maxRetries) {
          const delay = retryDelay * Math.pow(1.5, connectionAttemptRef.current - 1)
          console.log(`Retrying WebSocket connection in ${delay}ms...`)
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWithRetry(token, userId)
          }, delay)
        } else {
          console.error("Max WebSocket connection attempts reached.")
          toast.error("Failed to connect to chat server after multiple attempts.")
          connectionAttemptRef.current = 0
        }
      }
    },
    [handleDirectConnect, handleDirectDisconnect, handleDirectConnectError, maxRetries, retryDelay],
  )

  // FIXED: Improved main effect with better deduplication
  useEffect(() => {
    const needsConnection = isWebSocketNeeded()
    const token = localStorage.getItem("app-token")
    const currentUserId = authUser?._id

    if (needsConnection && currentUserId && token) {
      // Check if already connected or connecting
      if (webSocketService.isSocketConnected()) {
        console.log("Main Effect: WebSocket already connected via service check.")
        if (!connected) setConnected(true)
        if (connecting) setConnecting(false)
        return
      }

      if (!connected && !connecting) {
        // console.log("Main Effect: WebSocket needed and not connected/connecting. Initiating connection.")
        connectionAttemptRef.current = 0
        connectWithRetry(token, currentUserId)
      } else if (connected) {
        // console.log("Main Effect: WebSocket already connected and state is up-to-date.")
      } else if (connecting) {
        // console.log("Main Effect: WebSocket connection in progress.")
      }
    } else if (!needsConnection && (connected || connecting)) {
      // console.log("Main Effect: WebSocket no longer needed or user/token missing. Disconnecting.")
      webSocketService.disconnect()
      setConnected(false)
      setConnecting(false)
      connectionLockRef.current = false
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      connectionAttemptRef.current = 0
    }

    const handleBeforeUnload = () => sessionStorage.setItem("pageReloading", "true")
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      const isPageReloading = sessionStorage.getItem("pageReloading") === "true"
      sessionStorage.removeItem("pageReloading")

      if (!isPageReloading && !isWebSocketNeeded()) {
        // console.log("WebSocketProvider cleanup: Disconnecting due to unmount/navigation away from needed pages.")
        webSocketService.disconnect()
        setConnected(false)
        setConnecting(false)
        connectionLockRef.current = false
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [authUser?._id, isWebSocketNeeded, connected, connecting, connectWithRetry])

  // Handle page visibility changes for potential reconnection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isWebSocketNeeded() || !authUser?._id) return

      if (document.hidden) {
        // console.log("Page hidden. Connection maintained.")
        if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current)
      } else {
        // console.log("Page visible. Ensuring WebSocket connection.")
        if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current)

        // FIXED: Check actual socket connection
        if (!webSocketService.isSocketConnected() && !connecting) {
          const token = localStorage.getItem("app-token")
          if (token) {
            // console.log("Page became visible, not connected. Re-initiating connection.")
            connectionAttemptRef.current = 0
            connectWithRetry(token, authUser._id)
          }
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleVisibilityChange)
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current)
    }
  }, [isWebSocketNeeded, authUser?._id, connecting, connectWithRetry])

  // Improved joinRoom with better error handling
  const joinRoom = useCallback(
    (roomId) => {
      if (!roomId || !authUser?._id) {
        console.warn("Join room cancelled: Missing roomId or authUser.")
        return false
      }

      // FIXED: Check actual socket connection state
      if (!webSocketService.isSocketConnected()) {
        console.warn("Join room cancelled: WebSocket not connected. Attempting reconnect.")
        const token = localStorage.getItem("app-token")
        if (token) {
          connectWithRetry(token, authUser._id)
        }
        return false
      }

      // console.log(`Context: Joining room ${roomId}`)
      return webSocketService.joinRoom(roomId)
    },
    [authUser?._id, connectWithRetry],
  )

  const leaveRoom = useCallback((roomId) => {
    if (!roomId) return false
    return webSocketService.leaveRoom(roomId)
  }, [])

  const sendMessage = useCallback(
    (roomId, messageContent) => {
      if (!roomId || !messageContent || !authUser?._id) {
        console.warn("Send message cancelled: Missing parameters or authUser.")
        return false
      }

      // Check actual socket connection state
      if (!webSocketService.isSocketConnected()) {
        console.warn("Send message cancelled: WebSocket not connected. Attempting reconnect.")
        toast.error("Not connected. Trying to send after reconnecting.")
        
        // Add enhanced error handling for WebSocket events
        const setupEnhancedErrorHandling = () => {
          if (!webSocketService.socket) return;
          
          // Handle message errors with enhanced error handler
          webSocketService.socket.on("message_error", (error) => {
            webSocketErrorHandler.handleMessageError(error, () => {
              // Retry logic can be added here
              console.log("Message error handled, ready for retry");
            });
          });
          
          // Handle room errors with enhanced error handler
          webSocketService.socket.on("room_error", (error) => {
            webSocketErrorHandler.handleRoomError(error, () => {
              // Retry room join if needed
              if (error.roomId) {
                setTimeout(() => {
                  webSocketService.joinRoom(error.roomId);
                }, 1000);
              }
            });
          });
          
          // Handle rate limit status updates
          webSocketService.socket.on("rate_limit_status", ({ action, status }) => {
            webSocketErrorHandler.showRateLimitStatus(status, action);
          });
        };
        
        // Setup enhanced error handling when socket connects
        if (webSocketService.socket && webSocketService.socket.connected) {
          setupEnhancedErrorHandling();
        }
        const token = localStorage.getItem("app-token")
        if (token) {
          connectWithRetry(token, authUser._id)
        }
        return false
      }

      return webSocketService.sendMessage(roomId, messageContent)
    },
    [authUser?._id, connectWithRetry],
  )

  const editMessage = useCallback((roomId, messageId, newContent) => {
    if (!roomId || !messageId || !newContent) return false

    // Check actual socket connection state
    if (!webSocketService.isSocketConnected()) {
      toast.error("Not connected. Cannot edit message now.")
      return false
    }

    return webSocketService.editMessage(roomId, messageId, newContent)
  }, [])

  const addEventListener = useCallback((event, callback) => {
    // console.log(`Context: Registering event listener for: ${event}`)
    webSocketService.on(event, callback)
  }, [])

  const removeEventListener = useCallback((event, callback) => {
    // console.log(`Context: Removing event listener for: ${event}`)
    webSocketService.off(event, callback)
  }, [])

  const manualReconnect = useCallback(() => {
    const token = localStorage.getItem("app-token")
    const currentUserId = authUser?._id
    if (token && currentUserId) {
      // console.log("Manual reconnect triggered.")
      if (connected) {
        webSocketService.disconnect()
        setConnected(false)
      }
      connectionLockRef.current = false
      connectionAttemptRef.current = 0
      connectWithRetry(token, currentUserId)
    } else {
      toast.error("Cannot reconnect: User or token missing.")
    }
  }, [authUser?._id, connected, connectWithRetry])

  const contextValue = useMemo(
    () => ({
      connected,
      connecting,
      joinRoom,
      leaveRoom,
      sendMessage,
      editMessage,
      addEventListener,
      removeEventListener,
      socket: webSocketService.socket,
      isConnected: () => webSocketService.isSocketConnected(),
      reconnect: manualReconnect,
    }),
    [
      connected,
      connecting,
      joinRoom,
      leaveRoom,
      sendMessage,
      editMessage,
      addEventListener,
      removeEventListener,
      manualReconnect,
    ],
  )

  return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>
}

WebSocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}
