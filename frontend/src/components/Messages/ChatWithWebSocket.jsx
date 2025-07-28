import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useWebSocket } from "../../context/WebSocketContext";
import { useRoomContext } from "../../context/RoomContext";
import { useAuthContext } from "../../context/AuthContext";
import { AlertCircle } from "lucide-react";
import Chat from "./Chat";
import { Spinner } from "../ui/Spinner";
import webSocketErrorHandler from "../../utils/websocketErrorHandler";
import toast from "react-hot-toast";
import webSocketService from "../../services/WebSocketService";

const ChatWithWebSocket = () => {
  const { roomId } = useParams();
  const {
    connected: contextConnected,
    connecting: wsConnecting,
    joinRoom,
    leaveRoom,
    addEventListener,
    removeEventListener,
    reconnect,
  } = useWebSocket();
  const { currentRoomDetails, loadCurrentRoomDetails, currentRoomLoading } =
    useRoomContext();
  const { authUser } = useAuthContext();

  // Connection and joining state
  const [isJoined, setIsJoined] = useState(false);
  const [joinAttemptCount, setJoinAttemptCount] = useState(0);
  const [directConnected, setDirectConnected] = useState(false);

  // Constants and refs
  const maxJoinAttempts = 5;
  const joinRetryTimeoutRef = useRef(null);
  const connectionCheckRef = useRef(null);

  const currentRoomId = currentRoomDetails?._id;

  // Direct connection check - runs only when needed
  const checkDirectConnection = useCallback(() => {
    const isDirectlyConnected = webSocketService.isSocketConnected();
    setDirectConnected(isDirectlyConnected);
    return isDirectlyConnected;
  }, []);

  // Setup single connection listener rather than interval
  useEffect(() => {
    // Initial check
    checkDirectConnection();

    // Setup direct listeners to WebSocket service
    const handleConnectionChange = (connected) => {
      setDirectConnected(connected);
    };

    webSocketService.addConnectionListener(handleConnectionChange);

    return () => {
      webSocketService.removeConnectionListener(handleConnectionChange);
    };
  }, [checkDirectConnection]);

  // Load room details when roomId changes
  useEffect(() => {
    if (roomId) {
      loadCurrentRoomDetails(roomId);
      setIsJoined(false);
      setJoinAttemptCount(0);
      if (joinRetryTimeoutRef.current) {
        clearTimeout(joinRetryTimeoutRef.current);
      }
    }
  }, [roomId, loadCurrentRoomDetails]);

  // Room joined event handler
  const handleRoomJoined = useCallback(
    (data) => {
      if (data.roomId === currentRoomId) {
        setIsJoined(true);
        setJoinAttemptCount(0);
        if (joinRetryTimeoutRef.current) {
          clearTimeout(joinRetryTimeoutRef.current);
        }
      }
    },
    [currentRoomId]
  );

  // Room error handler
  const handleRoomError = useCallback(
    (error) => {
      webSocketErrorHandler.handleRoomError(error, () => {
        if (currentRoomId && directConnected) {
          setTimeout(() => joinRoom(currentRoomId), 1000);
        }
      });

      if (error.roomId === currentRoomId) {
        toast.error(`Error with room ${currentRoomId}: ${error.message}`);
      }
    },
    [currentRoomId, directConnected, joinRoom]
  );

  // Setup room event listeners
  useEffect(() => {
    if (!currentRoomId) return;

    addEventListener("room_joined", handleRoomJoined);
    addEventListener("room_error", handleRoomError);

    return () => {
      removeEventListener("room_joined", handleRoomJoined);
      removeEventListener("room_error", handleRoomError);
    };
  }, [
    addEventListener,
    removeEventListener,
    handleRoomJoined,
    handleRoomError,
    currentRoomId,
  ]);

  // Combined connection state
  const isConnected = directConnected || contextConnected;

  // Join room when connected
  useEffect(() => {
    // Clear any existing timeout
    if (joinRetryTimeoutRef.current) {
      clearTimeout(joinRetryTimeoutRef.current);
      joinRetryTimeoutRef.current = null;
    }

    // Don't attempt to join if conditions aren't met
    if (!currentRoomId || !authUser?._id || currentRoomLoading || isJoined) {
      return;
    }

    // Only proceed if connected
    if (!isConnected) {
      return;
    }

    // Don't retry past the limit
    if (joinAttemptCount >= maxJoinAttempts) {
      toast.error(
        `Failed to join ${
          currentRoomDetails?.name || "room"
        } after multiple attempts.`
      );
      return;
    }

    // Single setTimeout with a short delay
    const timer = setTimeout(() => {
      const success = joinRoom(currentRoomId);

      if (!success && joinAttemptCount < maxJoinAttempts) {
        // Only increment if the call failed
        setJoinAttemptCount((prev) => prev + 1);
      } else if (success) {
        // Set timeout to detect missing room_joined event
        joinRetryTimeoutRef.current = setTimeout(() => {
          if (!isJoined) {
            setJoinAttemptCount((prev) => prev + 1);
          }
        }, 5000);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    currentRoomId,
    authUser?._id,
    isJoined,
    joinRoom,
    joinAttemptCount,
    maxJoinAttempts,
    currentRoomLoading,
    currentRoomDetails?.name,
    isConnected,
  ]);

  // Leave room on unmount
  useEffect(() => {
    const idToLeave = roomId;
    return () => {
      if (idToLeave && isJoined) {
        leaveRoom(idToLeave);
      }
    };
  }, [roomId, leaveRoom, isJoined]);

  // Render loading state
  if (currentRoomLoading && !currentRoomDetails) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-400">Loading room...</span>
      </div>
    );
  }

  // Render no room selected state
  if (!currentRoomId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Please select a room to start chatting.
      </div>
    );
  }

  // Render disconnected state
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-400">
          {wsConnecting
            ? "Connecting to chat server..."
            : "Connection failed. Retrying..."}
        </span>
        <div className="mt-2 text-xs text-gray-500">
          This may take a few moments on first connection
        </div>
        {!wsConnecting && (
          <button
            onClick={reconnect}
            className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  // Render joining state
  if (isConnected && !isJoined) {
    if (joinAttemptCount < maxJoinAttempts) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner size="lg" />
          <span className="ml-2 text-gray-400">
            Joining {currentRoomDetails?.name || "chat room"}...
          </span>
          {joinAttemptCount > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Attempt {joinAttemptCount + 1} of {maxJoinAttempts}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <span className="ml-2 text-red-400">
            Failed to join {currentRoomDetails?.name || "room"}. Please check
            your connection or try refreshing.
          </span>
          <button
            onClick={reconnect}
            className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Retry Connection
          </button>
        </div>
      );
    }
  }

  // Connected and joined - render chat
  return <Chat />;
};

export default ChatWithWebSocket;
