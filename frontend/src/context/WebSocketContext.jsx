import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthContext } from './AuthContext';
import webSocketService from '../services/WebSocketService';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { authUser } = useAuthContext();
  const location = useLocation();
  const maxRetries = 5;
  const retryDelay = 2000;
  const visibilityTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const connectionLockRef = useRef(false);
  
  // Determine if WebSocket should be active based on current route
  const isWebSocketNeeded = useCallback(() => {
    return location.pathname.includes('/rooms/') && location.pathname.includes('/chat');
  }, [location.pathname]);
  
  // Connection handler with retry logic
  const connectWithRetry = useCallback(async (token, userId, attempt = 0) => {
    // Prevent multiple simultaneous connection attempts
    if (connectionLockRef.current) {
      console.log('Connection attempt already in progress, skipping...');
      return;
    }

    // Check if already connected
    if (webSocketService.isSocketConnected()) {
      console.log('WebSocket already connected, skipping connection attempt');
      setConnected(true);
      setConnecting(false);
      setConnectionAttempts(0);
      return;
    }

    if (attempt >= maxRetries) {
      console.error('Max WebSocket connection attempts reached');
      setConnecting(false);
      connectionLockRef.current = false;
      toast.error('Failed to connect to chat server after multiple attempts');
      return;
    }

    connectionLockRef.current = true;
    setConnecting(true);
    setConnectionAttempts(attempt + 1);
    
    try {
      console.log(`WebSocket connection attempt ${attempt + 1}/${maxRetries}`);
      
      // Clean up any existing connection first
      webSocketService.forceReset();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear any existing listeners before adding new ones
      const socket = webSocketService.socket;
      if (socket) {
        socket.removeAllListeners('connect');
        socket.removeAllListeners('disconnect');
        socket.removeAllListeners('connect_error');
      }
      
      // Setup direct socket event listeners before connecting
      const handleDirectConnect = () => {
        console.log('Direct socket connect event received');
        setConnected(true);
        setConnecting(false);
        setConnectionAttempts(0);
        connectionLockRef.current = false;
        toast.success('Connected to chat server');
      };
      
      const handleDirectDisconnect = (reason) => {
        console.log('Direct socket disconnect event received:', reason);
        // Only update state if disconnect wasn't client-initiated
        if (reason !== 'io client disconnect') {
          setConnected(false);
          connectionLockRef.current = false;
        }
      };
      
      const handleDirectConnectError = (error) => {
        console.error('Direct socket connection error:', error);
        setConnected(false);
        setConnecting(false);
        connectionLockRef.current = false;
      };
      
      // Connect with fresh socket
      webSocketService.connect(token, userId);
      
      // Add direct listeners to the socket
      if (webSocketService.socket) {
        webSocketService.socket.once('connect', handleDirectConnect);
        webSocketService.socket.on('disconnect', handleDirectDisconnect);
        webSocketService.socket.on('connect_error', handleDirectConnectError);
      } else {
        // If socket wasn't created, release the lock
        console.error('Failed to create socket');
        connectionLockRef.current = false;
        setConnecting(false);
      }
      
    } catch (error) {
      console.error(`WebSocket connection attempt ${attempt + 1} failed:`, error);
      connectionLockRef.current = false;
      
      if (attempt < maxRetries - 1) {
        const delay = retryDelay * Math.pow(1.5, attempt);
        console.log(`Retrying WebSocket connection in ${delay}ms...`);
        setTimeout(() => {
          connectWithRetry(token, authUser._id, attempt + 1);
        }, delay);
      } else {
        setConnecting(false);
        toast.error('Failed to connect to chat server');
      }
    }
  }, [maxRetries, retryDelay]);
  
  // Initialize WebSocket connection when auth user is available
  useEffect(() => {
    // Only connect if we're on a page that needs WebSocket and user is authenticated
    if (isWebSocketNeeded() && authUser?._id) {
      const token = localStorage.getItem('app-token');
      
      if (!token) {
        console.error('No auth token available for WebSocket');
        return;
      }
      
      // Set up connection status handlers - these stay at context level
      const handleServiceConnect = () => {
        console.log('WebSocket service connected event received');
        setConnected(true);
        setConnecting(false);
        setConnectionAttempts(0);
      };
      
      const handleServiceDisconnect = (reason) => {
        console.log('WebSocket service disconnected event received:', reason);
        
        // Only update state and reconnect for unexpected disconnections
        if (reason !== 'io client disconnect') {
          setConnected(false);
          
          // Show toast only if we're on a chat page
          if (isWebSocketNeeded()) {
            toast('Connection lost. Reconnecting...', { 
              id: 'websocket-disconnect' 
            });
          }
        }
      };
      
      // Check if already connected first
      if (webSocketService.isSocketConnected()) {
        console.log('WebSocket already connected, updating state');
        setConnected(true);
        setConnecting(false);
        connectionLockRef.current = false;
      } else if (!connectionLockRef.current && !connecting) {
        // Only initiate connection if not already connecting
        console.log('Initiating new WebSocket connection');
        
        // Clean up old event handlers first to prevent duplicates
        webSocketService.off('connect');
        webSocketService.off('disconnect');
        webSocketService.off('connect_error');
        
        // Initiate connection with a fresh socket
        connectWithRetry(token, authUser._id);
      }
      
      // Register sessionStorage to track page reloads
      sessionStorage.setItem('websocketActive', 'true');
      
      // Handler for beforeunload - to detect page reload vs navigation
      const handleBeforeUnload = () => {
        // Set a flag that we're reloading the page (not just navigating)
        sessionStorage.setItem('pageReloading', 'true');
      };
      
      // Add beforeunload listener
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Cleanup function
      return () => {
        // Remove the beforeunload listener
        window.removeEventListener('beforeunload', handleBeforeUnload);
        
        // Check if this is a page reload
        const isPageReloading = sessionStorage.getItem('pageReloading') === 'true';
        
        // Clean up handlers in any case
        webSocketService.off('connect');
        webSocketService.off('disconnect');
        webSocketService.off('connect_error');
        
        // Clean up direct socket listeners if they exist
        if (webSocketService.socket) {
          webSocketService.socket.off('connect');
          webSocketService.socket.off('disconnect');
          webSocketService.socket.off('connect_error');
        }
        
        // Only fully disconnect if we're navigating away (not reloading)
        // or if we're navigating away from a chat page
        if (!isPageReloading && !isWebSocketNeeded()) {
          console.log('Leaving chat page, cleaning up WebSocket');
          webSocketService.disconnect();
          setConnected(false);
          setConnecting(false);
          setConnectionAttempts(0);
          connectionLockRef.current = false;
          
          // Clear the session storage flag
          sessionStorage.removeItem('websocketActive');
        }
        
        // Clear the reload flag
        sessionStorage.removeItem('pageReloading');
      };
    } else if (!isWebSocketNeeded() && (connected || connecting)) {
      // Disconnect if we've navigated away from a page that needs WebSocket
      console.log('WebSocket no longer needed, disconnecting');
      webSocketService.disconnect();
      setConnected(false);
      setConnecting(false);
      setConnectionAttempts(0);
      connectionLockRef.current = false;
    }
  }, [authUser, isWebSocketNeeded, connecting, connectWithRetry]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isWebSocketNeeded() || !authUser?._id) return;

      if (document.hidden) {
        // Page is hidden - don't disconnect immediately, wait a bit
        console.log('Page hidden, scheduling connection check');
        visibilityTimeoutRef.current = setTimeout(() => {
          if (document.hidden && webSocketService.isSocketConnected()) {
            console.log('Page still hidden after timeout, maintaining connection but reducing activity');
            // Keep connection but reduce ping frequency if possible
          }
        }, 30000); // 30 seconds
      } else {
        // Page is visible again
        console.log('Page visible, ensuring WebSocket connection');
        
        // Clear any pending timeout
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = null;
        }
        
        // Check if we previously had a connection
        const wasActive = sessionStorage.getItem('websocketActive') === 'true';
        
        // Check connection and reconnect if needed
        if (wasActive && !webSocketService.isSocketConnected() && !connecting && !connectionLockRef.current) {
          const token = localStorage.getItem('app-token');
          if (token) {
            console.log('Page became visible and not connected, reconnecting...');
            // Clear any existing reconnect timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
            
            // Force a reset before reconnecting
            webSocketService.forceReset();
            
            // Reconnect after a short delay to ensure page is fully loaded
            reconnectTimeoutRef.current = setTimeout(() => {
              connectionLockRef.current = false; // Reset lock to allow connection
              connectWithRetry(token, authUser._id);
            }, 1000);
          }
        }
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also handle page focus/blur for additional reliability
    const handleFocus = () => {
      if (!document.hidden) {
        handleVisibilityChange();
      }
    };
    
    const handleBlur = () => {
      // Don't do anything on blur, let visibilitychange handle it
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [authUser, isWebSocketNeeded, connecting, connectWithRetry]);
  
  // Join a room
  const joinRoom = useCallback((roomId) => {
    if (!roomId || !authUser?._id) return false;
    
    console.log(`Context: Joining room ${roomId}`);
    // Force reconnection if needed before joining
    if (!webSocketService.isSocketConnected()) {
      const token = localStorage.getItem('app-token');
      if (token) {
        console.log('Reconnecting WebSocket before joining room');
        webSocketService.connect(token, authUser._id);
      }
    }
    
    return webSocketService.joinRoom(roomId);
  }, [authUser]);
  
  // Leave a room
  const leaveRoom = useCallback((roomId) => {
    if (!roomId) return false;
    return webSocketService.leaveRoom(roomId);
  }, []);
  
  // Send a message to a room
  const sendMessage = useCallback((roomId, message) => {
    if (!roomId || !message) return false;
    
    // Ensure we're connected before sending
    if (!webSocketService.isSocketConnected()) {
      console.log('Reconnecting before sending message');
      const token = localStorage.getItem('app-token');
      if (token && authUser?._id) {
        webSocketService.connect(token, authUser._id);
      }
    }
    
    // Always try to make sure we're in the room before sending
    webSocketService.joinRoom(roomId);
    
    return webSocketService.sendMessage(roomId, message);
  }, [authUser]);
  
  // Edit a message
  const editMessage = useCallback((roomId, messageId, newContent) => {
    if (!roomId || !messageId || !newContent) return false;
    return webSocketService.editMessage(roomId, messageId, newContent);
  }, []);
  
  // Register event listener
  const addEventListener = useCallback((event, callback) => {
    console.log(`Registering event listener for: ${event}`);
    // Remove any existing listener for this event first to prevent duplicates
    webSocketService.off(event, callback);
    // Make sure the event is registered even if we reconnect later
    const wrappedCallback = (...args) => {
      console.log(`Event received: ${event}`, args[0] ? args[0].constructor.name : 'no data');
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in ${event} event handler:`, error);
        toast.error('Error processing message');
      }
    };
    return webSocketService.on(event, wrappedCallback);
  }, []);
  
  // Remove event listener
  const removeEventListener = useCallback((event, callback) => {
    return webSocketService.off(event, callback);
  }, []);
  
  const contextValue = {
    connected,
    connecting,
    connectionAttempts,
    joinRoom,
    leaveRoom,
    sendMessage,
    editMessage,
    addEventListener,
    removeEventListener,
    // Always provide the socket for event registration, even if not connected
    socket: webSocketService.socket,
    // Add new helper methods
    isConnected: () => webSocketService.isSocketConnected(),
    getActiveRooms: () => webSocketService.getActiveRooms(),
    reconnect: () => {
      const token = localStorage.getItem('app-token');
      if (token && authUser?._id) {
        // Clear any existing timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Force reset the service before reconnecting
        webSocketService.forceReset();
        
        // Reset the connection lock
        connectionLockRef.current = false;
        
        // Mark as active in session storage
        sessionStorage.setItem('websocketActive', 'true');
        
        // Try to connect
        connectWithRetry(token, authUser._id);
      }
    }
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

WebSocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;