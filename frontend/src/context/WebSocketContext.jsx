import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthContext } from './AuthContext'; // Assuming this provides stable authUser
import webSocketService from '../services/WebSocketService';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  // const [connectionAttempts, setConnectionAttempts] = useState(0); // Managed within connectWithRetry

  const { authUser } = useAuthContext(); // CRITICAL: authUser object reference should be stable
  const location = useLocation();

  const maxRetries = 5;
  const retryDelay = 2000;

  const visibilityTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const connectionAttemptRef = useRef(0); // Tracks current attempt count for a retry sequence
  const connectionLockRef = useRef(false); // Prevents concurrent connect attempts

  const isWebSocketNeeded = useCallback(() => {
    return location.pathname.includes('/rooms/') && location.pathname.includes('/chat');
  }, [location.pathname]);

  // Memoized handlers for direct socket events to ensure stable references for .on/.off
  const handleDirectConnect = useCallback(() => {
    console.log('Direct socket connect event received');
    setConnected(true);
    setConnecting(false);
    connectionAttemptRef.current = 0;
    connectionLockRef.current = false;
    toast.success('Connected to chat server');
  }, []); // No dependencies needed as setters are stable

  const handleDirectDisconnect = useCallback((reason) => {
    console.log('Direct socket disconnect event received:', reason);
    if (reason !== 'io client disconnect') { // Not a manual disconnect
      setConnected(false);
      // connectionLockRef might be set by a new connection attempt, manage carefully
      // setConnecting(false); // This could be true if a reconnect is in progress
      // If disconnected unexpectedly, a reconnect attempt might be initiated by other logic
    }
  }, []);

  const handleDirectConnectError = useCallback((error) => {
    console.error('Direct socket connection error:', error);
    setConnected(false);
    setConnecting(false);
    connectionLockRef.current = false;
    // Retry logic will be handled by connectWithRetry
  }, []);

  const connectWithRetry = useCallback(async (token, userId) => {
    if (connectionLockRef.current) {
      console.log('Connection attempt already in progress, skipping ConnectWithRetry call.');
      return;
    }

    if (webSocketService.isSocketConnected()) {
      console.log('WebSocket already connected, ensuring state is correct.');
      if (!connected) setConnected(true);
      if (connecting) setConnecting(false);
      connectionAttemptRef.current = 0;
      return;
    }

    connectionLockRef.current = true;
    setConnecting(true);

    console.log(`WebSocket connection attempt ${connectionAttemptRef.current + 1}/${maxRetries}`);

    try {
      // Ensure clean state before new connection
      webSocketService.forceReset();
      // Optional delay for cleanup if forceReset is async or has side effects
      // await new Promise(resolve => setTimeout(resolve, 100)); // Short delay

      // Setup direct socket event listeners BEFORE connect call
      // Ensure old listeners are removed if socket instance persists across forceReset,
      // or ensure forceReset gives a fresh socket instance.
      // Assuming webSocketService.connect re-initializes or uses a new socket.
      if (webSocketService.socket) {
        webSocketService.socket.removeAllListeners('connect');
        webSocketService.socket.removeAllListeners('disconnect');
        webSocketService.socket.removeAllListeners('connect_error');
      }

      webSocketService.connect(token, userId); // This should create/get the socket

      if (webSocketService.socket) {
        webSocketService.socket.once('connect', handleDirectConnect);
        webSocketService.socket.on('disconnect', handleDirectDisconnect); // Persistent for unexpected disconnects
        webSocketService.socket.on('connect_error', handleDirectConnectError); // Persistent for connection errors
      } else {
        throw new Error('Socket instance not available after connect call.');
      }
      // Success is handled by 'connect' event (handleDirectConnect)
    } catch (error) {
      console.error(`WebSocket connection attempt ${connectionAttemptRef.current + 1} failed:`, error);
      connectionLockRef.current = false; // Release lock on catch
      setConnecting(false); // Update status

      connectionAttemptRef.current += 1;
      if (connectionAttemptRef.current < maxRetries) {
        const delay = retryDelay * Math.pow(1.5, connectionAttemptRef.current - 1);
        console.log(`Retrying WebSocket connection in ${delay}ms...`);
        // Clear previous timeout if any, though unlikely here
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          // Do not pass attempt count, rely on the ref for current attempt
          connectWithRetry(token, userId);
        }, delay);
      } else {
        console.error('Max WebSocket connection attempts reached.');
        toast.error('Failed to connect to chat server after multiple attempts.');
        connectionAttemptRef.current = 0; // Reset for future manual retries
      }
    }
  }, [connected, connecting, handleDirectConnect, handleDirectDisconnect, handleDirectConnectError, maxRetries, retryDelay]);


  // Main effect for managing WebSocket connection lifecycle
  useEffect(() => {
    const needsConnection = isWebSocketNeeded();
    const token = localStorage.getItem('app-token');
    const currentUserId = authUser?._id;

    if (needsConnection && currentUserId && token) {
      if (!connected && !connecting) { // Only if not connected and not already trying
        console.log('Main Effect: WebSocket needed and not connected/connecting. Initiating connection.');
        connectionAttemptRef.current = 0; // Reset attempts for a fresh sequence
        connectWithRetry(token, currentUserId);
      } else if (connected) {
        console.log('Main Effect: WebSocket already connected and state is up-to-date.');
      }
    } else if (!needsConnection && (connected || connecting)) {
      console.log('Main Effect: WebSocket no longer needed or user/token missing. Disconnecting.');
      webSocketService.disconnect();
      setConnected(false);
      setConnecting(false);
      connectionLockRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      connectionAttemptRef.current = 0;
    }

    // Cleanup for listeners directly on webSocketService if any were set up here
    // (Currently, connect/disconnect listeners are handled by connectWithRetry on the socket instance)
    // The beforeunload listener should be managed carefully
    const handleBeforeUnload = () => sessionStorage.setItem('pageReloading', 'true');
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const isPageReloading = sessionStorage.getItem('pageReloading') === 'true';
      sessionStorage.removeItem('pageReloading');

      // If the component unmounts and it's not a page reload,
      // and WebSocket is not needed by the new route, ensure disconnection.
      // The primary connection logic above should handle disconnect on route change.
      // This cleanup is more for when WebSocketProvider itself unmounts.
      if (!isPageReloading && !isWebSocketNeeded()) { // Check again if needed on new route
        console.log('WebSocketProvider cleanup: Disconnecting due to unmount/navigation away from needed pages.');
        webSocketService.disconnect(); // Ensure full disconnect
        setConnected(false);
        setConnecting(false);
        connectionLockRef.current = false;
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [authUser?._id, isWebSocketNeeded, connected, connecting, connectWithRetry]); // Add authUser?._id

  // Handle page visibility changes for potential reconnection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isWebSocketNeeded() || !authUser?._id) return;

      if (document.hidden) {
        console.log('Page hidden. Connection maintained.');
        if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
        // Optional: Implement a longer timeout to disconnect if page remains hidden for a very long time
        // visibilityTimeoutRef.current = setTimeout(() => { ... }, 300000); // 5 minutes
      } else {
        console.log('Page visible. Ensuring WebSocket connection.');
        if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);

        if (!connected && !connecting) { // If visible and not connected/connecting
          const token = localStorage.getItem('app-token');
          if (token) {
            console.log('Page became visible, not connected. Re-initiating connection.');
            connectionAttemptRef.current = 0; // Reset attempts for a fresh sequence
            connectWithRetry(token, authUser._id);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange); // Also check on focus

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
    };
  }, [isWebSocketNeeded, authUser?._id, connected, connecting, connectWithRetry]);


  const joinRoom = useCallback((roomId) => {
    if (!roomId || !authUser?._id) {
      console.warn('Join room cancelled: Missing roomId or authUser.');
      return false;
    }
    if (!connected) {
      console.warn('Join room cancelled: WebSocket not connected. Attempting reconnect.');
      const token = localStorage.getItem('app-token');
      if (token) {
        // Don't reset connection attempts here, let connectWithRetry handle its sequence
        connectWithRetry(token, authUser._id);
      }
      // Indicate failure for now, room join will be attempted after connection
      return false;
    }
    console.log(`Context: Joining room ${roomId}`);
    return webSocketService.joinRoom(roomId);
  }, [authUser?._id, connected, connectWithRetry]);

  const leaveRoom = useCallback((roomId) => {
    if (!roomId) return false;
    return webSocketService.leaveRoom(roomId);
  }, []);

  const sendMessage = useCallback((roomId, message) => {
    if (!roomId || !message || !authUser?._id) {
      console.warn('Send message cancelled: Missing parameters or authUser.');
      return false;
    }
    if (!connected) {
      console.warn('Send message cancelled: WebSocket not connected. Attempting reconnect.');
      toast.error("Not connected. Trying to send after reconnecting.");
      const token = localStorage.getItem('app-token');
      if (token) {
        connectWithRetry(token, authUser._id);
      }
      return false; // Indicate failure, message not sent yet
    }
    // It's often good practice to ensure the user is in the room before sending.
    // webSocketService.joinRoom(roomId); // This might be redundant if already joined.
    return webSocketService.sendMessage(roomId, message);
  }, [authUser?._id, connected, connectWithRetry]);

  const editMessage = useCallback((roomId, messageId, newContent) => {
    if (!roomId || !messageId || !newContent) return false;
    if (!connected) {
      toast.error("Not connected. Cannot edit message now.");
      return false;
    }
    return webSocketService.editMessage(roomId, messageId, newContent);
  }, [connected]);

  // Event listener management:
  // Relies on calling components to pass memoized callbacks.
  const addEventListener = useCallback((event, callback) => {
    console.log(`Context: Registering event listener for: ${event}`);
    // If WebSocketService's 'on' method handles duplicate registrations gracefully (e.g., replaces or ignores),
    // then prior removal might not be strictly necessary, simplifying this.
    // However, explicitly calling 'on' is standard.
    webSocketService.on(event, callback);
  }, []);

  const removeEventListener = useCallback((event, callback) => {
    console.log(`Context: Removing event listener for: ${event}`);
    webSocketService.off(event, callback);
  }, []);

  const manualReconnect = useCallback(() => {
    const token = localStorage.getItem('app-token');
    const currentUserId = authUser?._id;
    if (token && currentUserId) {
      console.log('Manual reconnect triggered.');
      if (connected) { // If already connected, force a fresh connection
        webSocketService.disconnect();
        setConnected(false);
        // setConnecting(true); // connectWithRetry will set this
      }
      connectionLockRef.current = false; // Ensure lock is released for manual attempt
      connectionAttemptRef.current = 0; // Reset attempts for a fresh sequence
      connectWithRetry(token, currentUserId);
    } else {
      toast.error('Cannot reconnect: User or token missing.');
    }
  }, [authUser?._id, connected, connectWithRetry]);

  const contextValue = useMemo(() => ({
    connected,
    connecting,
    joinRoom,
    leaveRoom,
    sendMessage,
    editMessage,
    addEventListener,
    removeEventListener,
    socket: webSocketService.socket, // Consumers should be careful with direct socket access
    isConnected: () => webSocketService.isSocketConnected(), // Safer accessor
    reconnect: manualReconnect,
  }), [
    connected, connecting, joinRoom, leaveRoom, sendMessage, editMessage,
    addEventListener, removeEventListener, manualReconnect
  ]);

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

// Default export is not conventional for context files, usually provider and hook are exported.
// export default WebSocketContext; // If you need the context object itself elsewhere