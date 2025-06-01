import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../../context/WebSocketContext';
// CRITICAL: RoomContext must provide stable currentRoomDetails (or stable _id)
// and stable loadCurrentRoomDetails (useCallback)
import { useRoomContext } from '../../context/RoomContext';
import { useAuthContext } from '../../context/AuthContext'; // Assuming stable authUser
import { AlertCircle } from "lucide-react";
import Chat from './Chat';
import { Spinner } from '../ui/Spinner';
import toast from 'react-hot-toast';

const ChatWithWebSocket = () => {
  const { roomId } = useParams();
  const { connected, connecting: wsConnecting, joinRoom, leaveRoom, addEventListener, removeEventListener, reconnect } = useWebSocket();
  const { currentRoomDetails, loadCurrentRoomDetails, currentRoomLoading } = useRoomContext();
  const { authUser } = useAuthContext(); // Assuming stable authUser

  const [isJoined, setIsJoined] = useState(false);
  const [joinAttemptCount, setJoinAttemptCount] = useState(0);
  const maxJoinAttempts = 5;
  const joinRetryTimeoutRef = useRef(null);

  const currentRoomId = currentRoomDetails?._id; // More stable dependency if possible

  // Load room details
  useEffect(() => {
    if (roomId) {
      console.log(`ChatWithWebSocket: Room ID changed to ${roomId}. Loading details.`);
      loadCurrentRoomDetails(roomId);
      setIsJoined(false); // Reset join status for new room
      setJoinAttemptCount(0); // Reset join attempts
      if (joinRetryTimeoutRef.current) {
        clearTimeout(joinRetryTimeoutRef.current);
      }
    }
  }, [roomId, loadCurrentRoomDetails]); // loadCurrentRoomDetails should be stable from context

  // Memoized handlers for room events
  const handleRoomJoined = useCallback((data) => {
    console.log('ChatWithWebSocket: Room joined event received:', data);
    if (data.roomId === currentRoomId) {
      console.log(`ChatWithWebSocket: Successfully joined room: ${data.roomId}`);
      setIsJoined(true);
      setJoinAttemptCount(0); // Reset attempts on successful join
      if (joinRetryTimeoutRef.current) {
        clearTimeout(joinRetryTimeoutRef.current);
      }
      // toast.success(`Joined ${currentRoomDetails?.name || 'chat room'}`); // Consider room name
    }
  }, [currentRoomId, /* currentRoomDetails?.name */]);

  const handleRoomError = useCallback((error) => {
    console.error('ChatWithWebSocket: Room error event:', error);
    // This event might be generic, or specific to a join attempt.
    // If it's related to a failed join for the current room:
    if (error.roomId === currentRoomId) {
      toast.error(`Error with room ${currentRoomId}: ${error.message}`);
      // setIsJoined(false); // Ensure not marked as joined
      // Retry logic is handled by the joinRoom effect.
    }
  }, [currentRoomId]);

  // Effect for setting up room-specific WebSocket event listeners
  useEffect(() => {
    if (!currentRoomId) { // Don't set up listeners if no specific room context
      return;
    }
    console.log(`ChatWithWebSocket: Setting up listeners for room ${currentRoomId}`);
    addEventListener('room_joined', handleRoomJoined);
    addEventListener('room_error', handleRoomError);

    return () => {
      console.log(`ChatWithWebSocket: Cleaning up listeners for room ${currentRoomId}`);
      removeEventListener('room_joined', handleRoomJoined);
      removeEventListener('room_error', handleRoomError);
    };
  }, [addEventListener, removeEventListener, handleRoomJoined, handleRoomError, currentRoomId]);


  // Effect for attempting to join the room
  useEffect(() => {
    if (joinRetryTimeoutRef.current) { // Clear any pending retry if dependencies change
      clearTimeout(joinRetryTimeoutRef.current);
    }

    if (!currentRoomId || !authUser?._id || currentRoomLoading) {
      console.log('ChatWithWebSocket: Join prerequisites not met (no room ID, authUser, or room loading).');
      return;
    }

    if (isJoined) {
      console.log(`ChatWithWebSocket: Already joined room ${currentRoomId}.`);
      return;
    }

    if (!connected) {
      console.log(`ChatWithWebSocket: WebSocket not connected. Cannot join room ${currentRoomId} yet.`);
      // Optional: trigger a reconnect if not already connecting
      // if (!wsConnecting) reconnect(); // useWebSocket's reconnect
      return; // Wait for connection
    }

    if (joinAttemptCount >= maxJoinAttempts) {
      console.error(`ChatWithWebSocket: Max join attempts reached for room ${currentRoomId}.`);
      toast.error(`Failed to join ${currentRoomDetails?.name || 'room'} after multiple attempts.`);
      return;
    }

    console.log(`ChatWithWebSocket: Attempting to join room ${currentRoomId} (Attempt: ${joinAttemptCount + 1})`);
    const success = joinRoom(currentRoomId); // joinRoom from useWebSocket

    if (!success && joinAttemptCount < maxJoinAttempts) { // If joinRoom call itself failed synchronously
      console.warn(`ChatWithWebSocket: joinRoom call for ${currentRoomId} failed synchronously. Retrying...`);
      const nextAttempt = joinAttemptCount + 1;
      setJoinAttemptCount(nextAttempt); // This will re-trigger the effect for next attempt
      // joinRetryTimeoutRef.current = setTimeout(() => {
      //     setJoinAttemptCount(prev => prev + 1);
      // }, 2000 * Math.pow(1.5, joinAttemptCount));
    } else if (success) {
      // If joinRoom call was successful, we wait for 'room_joined' event.
      // Incrementing joinAttemptCount here might be too eager if the event is just delayed.
      // It's better to rely on 'room_joined' to reset attempts.
      // However, if 'room_joined' never comes, we need a timeout based retry.
      console.log(`ChatWithWebSocket: joinRoom called for ${currentRoomId}. Waiting for confirmation event.`);
      // This timeout handles cases where 'room_joined' isn't received after a successful call to joinRoom
      joinRetryTimeoutRef.current = setTimeout(() => {
        if (!isJoined) { // If still not joined after a delay
          console.warn(`ChatWithWebSocket: No room_joined event for ${currentRoomId} after timeout. Retrying join.`);
          setJoinAttemptCount(prev => prev + 1); // Trigger retry
        }
      }, 5000 + (2000 * joinAttemptCount)); // Increased timeout for event
    }

    return () => {
      if (joinRetryTimeoutRef.current) {
        clearTimeout(joinRetryTimeoutRef.current);
      }
    };
  }, [
    currentRoomId,
    authUser?._id,
    connected, // wsConnecting,
    isJoined,
    joinRoom,
    joinAttemptCount,
    maxJoinAttempts,
    currentRoomLoading,
    // currentRoomDetails?.name // For toast
  ]);

  // Effect for leaving the room on component unmount or when roomId changes
  useEffect(() => {
    // This effect captures the roomId at the time of its execution.
    // When the component unmounts, it uses the roomId that was active.
    const idToLeave = roomId; // Capture roomId for cleanup
    return () => {
      if (idToLeave && isJoined) { // Only leave if was joined to this specific room
        console.log(`ChatWithWebSocket: Leaving room ${idToLeave} on unmount/roomId change.`);
        leaveRoom(idToLeave);
        // setIsJoined(false); // State will be reset by new room load anyway
        // toast.info(`Left ${currentRoomDetails?.name || 'chat room'}`);
      }
    };
  }, [roomId, leaveRoom, isJoined /*, currentRoomDetails?.name (for toast) */]);


  if (currentRoomLoading && !currentRoomDetails) { // Show loading if no details yet
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-400">Loading room...</span>
      </div>
    );
  }

  if (!wsConnecting && !connected && joinAttemptCount < 1) { // Initial connection attempt message
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-400">Connecting to chat server...</span>
      </div>
    );
  }

  if (!connected && joinAttemptCount >= 1) { // More specific message if retrying connection
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-400">Connection failed. Retrying...</span>
        {/* You can add specific attempt count from WebSocketContext if needed */}
      </div>
    );
  }


  if (connected && !isJoined && currentRoomId && joinAttemptCount < maxJoinAttempts) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-400">
          Joining {currentRoomDetails?.name || 'chat room'}... (Attempt {joinAttemptCount + 1})
        </span>
      </div>
    );
  }

  if (connected && !isJoined && currentRoomId && joinAttemptCount >= maxJoinAttempts) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
        <span className="ml-2 text-red-400">
          Failed to join {currentRoomDetails?.name || 'room'}. Please check your connection or try refreshing.
        </span>
        <button
          onClick={reconnect} // General WebSocket reconnect
          className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
        >
          Retry Connection
        </button>
      </div>
    );
  }


  if (!currentRoomId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Please select a room to start chatting.
      </div>
    );
  }

  // If all checks pass and we are joined (or room has no specific join needed and we are connected)
  // The <Chat /> component should ideally only render when it has a room and is ready.
  return <Chat />;
};

export default ChatWithWebSocket;