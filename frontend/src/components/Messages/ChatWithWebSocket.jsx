import { useEffect, useState, useCallback, useRef } from "react"
import { useParams } from "react-router-dom"
import { useWebSocket } from "../../context/WebSocketContext"
import { useRoomContext } from "../../context/RoomContext"
import { useAuthContext } from "../../context/AuthContext"
import { AlertCircle } from "lucide-react"
import Chat from "./Chat"
import { Spinner } from "../ui/Spinner"
import toast from "react-hot-toast"
import webSocketService from "../../services/WebSocketService" // FIXED: Direct import

const ChatWithWebSocket = () => {
  const { roomId } = useParams()
  const {
    connected: contextConnected,
    connecting: wsConnecting,
    joinRoom,
    leaveRoom,
    addEventListener,
    removeEventListener,
    reconnect,
    socket,
  } = useWebSocket()
  const { currentRoomDetails, loadCurrentRoomDetails, currentRoomLoading } = useRoomContext()
  const { authUser } = useAuthContext()

  const [isJoined, setIsJoined] = useState(false)
  const [joinAttemptCount, setJoinAttemptCount] = useState(0)
  const [forceRender, setForceRender] = useState(0) // FIXED: Force re-render counter
  const maxJoinAttempts = 5
  const joinRetryTimeoutRef = useRef(null)
  const connectionCheckIntervalRef = useRef(null) // FIXED: Added interval for connection checking
  const directConnectedRef = useRef(false) // FIXED: Use ref for direct connection state

  const currentRoomId = currentRoomDetails?._id

  // FIXED: Direct connection check that bypasses context
  const checkDirectConnection = useCallback(() => {
    const isDirectlyConnected = webSocketService.isSocketConnected()
    if (isDirectlyConnected !== directConnectedRef.current) {
      directConnectedRef.current = isDirectlyConnected
      console.log(`ChatWithWebSocket: Direct connection check - connected: ${isDirectlyConnected}`)
      // Force re-render when connection state changes
      setForceRender((prev) => prev + 1)
    }
    return isDirectlyConnected
  }, [])

  // FIXED: Setup interval to check connection directly
  useEffect(() => {
    // Initial check
    checkDirectConnection()

    // Setup interval for continuous checking
    connectionCheckIntervalRef.current = setInterval(() => {
      checkDirectConnection()
    }, 1000)

    return () => {
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current)
      }
    }
  }, [checkDirectConnection])

  // Load room details
  useEffect(() => {
    if (roomId) {
      console.log(`ChatWithWebSocket: Room ID changed to ${roomId}. Loading details.`)
      loadCurrentRoomDetails(roomId)
      setIsJoined(false)
      setJoinAttemptCount(0)
      if (joinRetryTimeoutRef.current) {
        clearTimeout(joinRetryTimeoutRef.current)
      }
    }
  }, [roomId, loadCurrentRoomDetails])

  // Memoized handlers for room events
  const handleRoomJoined = useCallback(
    (data) => {
      console.log("ChatWithWebSocket: Room joined event received:", data)
      if (data.roomId === currentRoomId) {
        console.log(`ChatWithWebSocket: Successfully joined room: ${data.roomId}`)
        setIsJoined(true)
        setJoinAttemptCount(0)
        if (joinRetryTimeoutRef.current) {
          clearTimeout(joinRetryTimeoutRef.current)
        }
      }
    },
    [currentRoomId],
  )

  const handleRoomError = useCallback(
    (error) => {
      console.error("ChatWithWebSocket: Room error event:", error)
      if (error.roomId === currentRoomId) {
        toast.error(`Error with room ${currentRoomId}: ${error.message}`)
      }
    },
    [currentRoomId],
  )

  // Effect for setting up room-specific WebSocket event listeners
  useEffect(() => {
    if (!currentRoomId) {
      return
    }
    console.log(`ChatWithWebSocket: Setting up listeners for room ${currentRoomId}`)
    addEventListener("room_joined", handleRoomJoined)
    addEventListener("room_error", handleRoomError)

    return () => {
      console.log(`ChatWithWebSocket: Cleaning up listeners for room ${currentRoomId}`)
      removeEventListener("room_joined", handleRoomJoined)
      removeEventListener("room_error", handleRoomError)
    }
  }, [addEventListener, removeEventListener, handleRoomJoined, handleRoomError, currentRoomId])

  // FIXED: Use direct connection check for rendering and logic
  const isConnected = directConnectedRef.current || contextConnected

  // FIXED: Effect to attempt joining room when connection is established
  useEffect(() => {
    if (joinRetryTimeoutRef.current) {
      clearTimeout(joinRetryTimeoutRef.current)
      joinRetryTimeoutRef.current = null
    }

    if (!currentRoomId || !authUser?._id || currentRoomLoading || isJoined) {
      return
    }

    // FIXED: Use direct connection check
    const directlyConnected = checkDirectConnection()

    if (!directlyConnected) {
      console.log(`ChatWithWebSocket: WebSocket not directly connected. Cannot join room ${currentRoomId} yet.`)
      return
    }

    console.log(`ChatWithWebSocket: WebSocket is directly connected. Attempting to join room ${currentRoomId}`)

    if (joinAttemptCount >= maxJoinAttempts) {
      console.error(`ChatWithWebSocket: Max join attempts reached for room ${currentRoomId}.`)
      toast.error(`Failed to join ${currentRoomDetails?.name || "room"} after multiple attempts.`)
      return
    }

    // Small delay to ensure connection is stable
    setTimeout(() => {
      if (checkDirectConnection() && !isJoined) {
        console.log(`ChatWithWebSocket: Attempting to join room ${currentRoomId} (Attempt: ${joinAttemptCount + 1})`)
        const success = joinRoom(currentRoomId)

        if (!success && joinAttemptCount < maxJoinAttempts) {
          console.warn(`ChatWithWebSocket: joinRoom call for ${currentRoomId} failed synchronously. Retrying...`)
          const nextAttempt = joinAttemptCount + 1
          setJoinAttemptCount(nextAttempt)
        } else if (success) {
          console.log(`ChatWithWebSocket: joinRoom called for ${currentRoomId}. Waiting for confirmation event.`)
          joinRetryTimeoutRef.current = setTimeout(
            () => {
              if (!isJoined) {
                console.warn(
                  `ChatWithWebSocket: No room_joined event for ${currentRoomId} after timeout. Retrying join.`,
                )
                setJoinAttemptCount((prev) => prev + 1)
              }
            },
            5000 + 2000 * joinAttemptCount,
          )
        }
      }
    }, 300)

    return () => {
      if (joinRetryTimeoutRef.current) {
        clearTimeout(joinRetryTimeoutRef.current)
      }
    }
  }, [
    currentRoomId,
    authUser?._id,
    isJoined,
    joinRoom,
    joinAttemptCount,
    maxJoinAttempts,
    currentRoomLoading,
    currentRoomDetails?.name,
    checkDirectConnection,
    forceRender, // FIXED: Re-run when forceRender changes
  ])

  // Effect for leaving the room on component unmount or when roomId changes
  useEffect(() => {
    const idToLeave = roomId
    return () => {
      if (idToLeave && isJoined) {
        console.log(`ChatWithWebSocket: Leaving room ${idToLeave} on unmount/roomId change.`)
        leaveRoom(idToLeave)
      }
    }
  }, [roomId, leaveRoom, isJoined])

  // FIXED: Debug logging for connection state
  useEffect(() => {
    const directlyConnected = directConnectedRef.current
    console.log(
      `ChatWithWebSocket: Connection state - context:${contextConnected}, direct:${directlyConnected}, combined:${isConnected}, joined:${isJoined}`,
    )
  }, [contextConnected, isConnected, isJoined, forceRender])

  if (currentRoomLoading && !currentRoomDetails) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-400">Loading room...</span>
      </div>
    )
  }

  if (!currentRoomId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Please select a room to start chatting.
      </div>
    )
  }

  // FIXED: Use direct connection check for rendering
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-400">
          {wsConnecting ? "Connecting to chat server..." : "Connection failed. Retrying..."}
        </span>
        <div className="mt-2 text-xs text-gray-500">This may take a few moments on first connection</div>
        {!wsConnecting && (
          <button onClick={reconnect} className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md">
            Retry Connection
          </button>
        )}
      </div>
    )
  }

  if (isConnected && !isJoined) {
    if (joinAttemptCount < maxJoinAttempts) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner size="lg" />
          <span className="ml-2 text-gray-400">Joining {currentRoomDetails?.name || "chat room"}...</span>
          {joinAttemptCount > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Attempt {joinAttemptCount + 1} of {maxJoinAttempts}
            </div>
          )}
        </div>
      )
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <span className="ml-2 text-red-400">
            Failed to join {currentRoomDetails?.name || "room"}. Please check your connection or try refreshing.
          </span>
          <button onClick={reconnect} className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md">
            Retry Connection
          </button>
        </div>
      )
    }
  }

  // If connected and joined, render the Chat component
  return <Chat />
}

export default ChatWithWebSocket
