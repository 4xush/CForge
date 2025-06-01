import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../../context/WebSocketContext';
import { useRoomContext } from '../../context/RoomContext';
import { useAuthContext } from '../../context/AuthContext';
import Chat from './Chat';
import { Spinner } from '../ui/Spinner';
import toast from 'react-hot-toast';

// Component that connects to WebSocket and handles room-specific logic
const ChatWithWebSocket = () => {
  const { roomId } = useParams();
  const { connected, joinRoom, leaveRoom, addEventListener, removeEventListener } = useWebSocket();
  const { currentRoomDetails, loadCurrentRoomDetails, currentRoomLoading } = useRoomContext();
  const { authUser } = useAuthContext();
  const [isJoined, setIsJoined] = useState(false);
  const [joinAttempts, setJoinAttempts] = useState(0);
  const [connectAttempts, setConnectAttempts] = useState(0);
  const maxJoinAttempts = 5;
  const maxConnectAttempts = 5;

  // Setup event listeners for room joining
  const setupRoomListeners = useCallback(() => {
    const handleRoomJoined = (data) => {
      console.log('Room joined event received:', data);
      if (data.roomId === currentRoomDetails?._id) {
        console.log(`Successfully joined room: ${data.roomId}`);
        setIsJoined(true);
        setJoinAttempts(0);
        setConnectAttempts(0);
        toast.success('Connected to chat room');
      }
    };

    const handleRoomError = (error) => {
      console.error('Room error:', error);
      if (joinAttempts < maxJoinAttempts) {
        toast.error('Error connecting to chat room, retrying...');
        setJoinAttempts(prev => prev + 1);
      } else {
        toast.error('Failed to connect to chat room');
      }
    };

    addEventListener('room_joined', handleRoomJoined);
    addEventListener('room_error', handleRoomError);

    return () => {
      removeEventListener('room_joined', handleRoomJoined);
      removeEventListener('room_error', handleRoomError);
    };
  }, [addEventListener, removeEventListener, currentRoomDetails]);

  // Load room details when component mounts or roomId changes
  useEffect(() => {
    if (roomId) {
      loadCurrentRoomDetails(roomId);
      setIsJoined(false); // Reset join status when room changes
      setJoinAttempts(0); // Reset join attempts when room changes
      setConnectAttempts(0); // Reset connect attempts when room changes
    }
  }, [roomId, loadCurrentRoomDetails]);

  // Set up room event listeners
  useEffect(() => {
    const cleanup = setupRoomListeners();
    return cleanup;
  }, [setupRoomListeners]);

  // Join room when socket is connected and room details are loaded
  useEffect(() => {
    // Don't try to join if we don't have all the information we need
    if (!currentRoomDetails || !authUser) {
      return;
    }

    // If we're already joined, don't try to join again
    if (isJoined) {
      return;
    }

    // Only attempt to join up to max attempts
    if (joinAttempts >= maxJoinAttempts) {
      return;
    }

    // Create a function to attempt joining
    const attemptJoin = () => {
      console.log(`Attempt ${joinAttempts + 1} joining room: ${currentRoomDetails._id}`);

      if (connected) {
        const joined = joinRoom(currentRoomDetails._id);

        if (!joined && joinAttempts < maxJoinAttempts) {
          // If join failed, schedule another attempt
          setTimeout(() => {
            setJoinAttempts(prev => prev + 1);
          }, 2000);
        }
      } else if (connectAttempts < maxConnectAttempts) {
        // If not connected, try a few more times
        setTimeout(() => {
          setConnectAttempts(prev => prev + 1);
        }, 1000);
      }
    };

    // Attempt to join now
    attemptJoin();

    // Cleanup function
    return () => { };
  }, [connected, currentRoomDetails, joinRoom, authUser, isJoined, joinAttempts, connectAttempts]);

  // Leave room when component unmounts or room changes
  useEffect(() => {
    return () => {
      if (currentRoomDetails) {
        console.log(`Leaving room: ${currentRoomDetails._id}`);
        leaveRoom(currentRoomDetails._id);
        setIsJoined(false);
        toast('Disconnected from chat room');
      }
    };
  }, [currentRoomDetails, leaveRoom]);

  // Force rejoin on connection status change
  useEffect(() => {
    if (connected && currentRoomDetails && !isJoined && joinAttempts < maxJoinAttempts) {
      console.log('Connection status changed, attempting to join room');
      setJoinAttempts(0); // Reset attempts when connection is restored
      joinRoom(currentRoomDetails._id);
    }
  }, [connected, currentRoomDetails, isJoined, joinRoom, joinAttempts, maxJoinAttempts]);

  if (currentRoomLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-400">Loading room...</span>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-400">Connecting to chat server...</span>
        {connectAttempts > 2 && connectAttempts <= maxConnectAttempts && (
          <p className="mt-4 text-amber-400 text-sm">
            Taking longer than expected... ({connectAttempts}/{maxConnectAttempts})
          </p>
        )}
      </div>
    );
  }

  if (!isJoined && currentRoomDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-400">Joining chat room...</span>
        {joinAttempts > 2 && joinAttempts <= maxJoinAttempts && (
          <p className="mt-4 text-amber-400 text-sm">
            Taking longer than expected... ({joinAttempts}/{maxJoinAttempts})
          </p>
        )}
      </div>
    );
  }

  return <Chat />;
};

export default ChatWithWebSocket;