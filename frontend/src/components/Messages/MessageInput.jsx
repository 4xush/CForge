import { useState, useEffect, useRef } from "react"
import { useRoomContext } from "../../context/RoomContext"
import { useAuthContext } from "../../context/AuthContext"
import { useMessageContext } from "../../context/MessageContext"
import { useWebSocket } from "../../context/WebSocketContext"
import toast from "react-hot-toast"
import webSocketErrorHandler from "../../utils/websocketErrorHandler"
import { Send, X, WifiOff } from "lucide-react"
import PropTypes from "prop-types"

const MessageInput = ({
    initialMessage = "",
    onMessageSent,
    onCancel,
    isEditing = false,
    messageId = null,
    disabled = false,
}) => {
    const { currentRoomDetails } = useRoomContext()
    const { authUser } = useAuthContext()
    const { socket, sendMessage, connected } = useWebSocket()
    const { editMessage } = useMessageContext()
    const [message, setMessage] = useState(initialMessage)
    const [sending, setSending] = useState(false)
    const lastSentRef = useRef("")
    const sendTimeoutRef = useRef(null)

    useEffect(() => {
        setMessage(initialMessage)
    }, [initialMessage])

    useEffect(() => {
        if (!socket) return

        const handleMessageUpdated = (updatedMessage) => {
            if (isEditing && messageId === updatedMessage._id) {
                setMessage(updatedMessage.content)
                if (onCancel) onCancel()
            }
        }

        socket.on("message_updated", handleMessageUpdated)
        return () => socket.off("message_updated", handleMessageUpdated)
    }, [socket, isEditing, messageId, onCancel])

    useEffect(() => {
        if (!socket) return

        const handleMessageError = (data) => {
            toast.error(data.error || "Failed to send message")
            setSending(false)

            // Reset last sent if there was an error
            if (data.tempId && lastSentRef.current) {
                lastSentRef.current = ""
            }
        }

        const handleMessageSent = (data) => {
            setSending(false)
            // console.log("Message sent successfully:", data.messageId)
        }

        socket.on("message_error", handleMessageError)
        socket.on("message_sent", handleMessageSent)

        return () => {
            socket.off("message_error", handleMessageError)
            socket.off("message_sent", handleMessageSent)
        }
    }, [socket])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (sendTimeoutRef.current) {
                clearTimeout(sendTimeoutRef.current)
            }
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        const trimmedMessage = message.trim()

        if (!trimmedMessage || !currentRoomDetails || sending || disabled) return

        // Prevent duplicate submissions
        if (trimmedMessage === lastSentRef.current) {
            // console.log("Ignoring duplicate message submission")
            return
        }

        if (!connected && !isEditing) {
            toast.error("Cannot send message: Not connected to the server")
            return
        }

        setSending(true)

        // Clear any existing timeout
        if (sendTimeoutRef.current) {
            clearTimeout(sendTimeoutRef.current)
        }

        try {
            if (isEditing && messageId) {
                // Handle message editing via WebSocket
                const success = sendMessage
                    ? socket?.emit("edit_message", {
                        roomId: currentRoomDetails._id,
                        messageId,
                        newContent: trimmedMessage,
                    })
                    : await editMessage(messageId, trimmedMessage)

                if (!success && !socket) {
                    toast.error("Failed to edit message: Connection issue")
                }
                if (onCancel) onCancel()
            } else {
                // FIXED: Pass just the message content string to onMessageSent
                if (onMessageSent) {
                    lastSentRef.current = trimmedMessage

                    // Just pass the trimmed message content - don't call sendMessage here
                    onMessageSent(trimmedMessage)

                    // REMOVED: The duplicate sendMessage call that was causing issues
                } else {
                    toast.error("Message handler not available")
                }
            }

            setMessage("")

            // Reset the last sent reference after a delay to allow similar messages later
            sendTimeoutRef.current = setTimeout(() => {
                lastSentRef.current = ""
            }, 3000)
        } catch (error) {
            console.error("Error sending message:", error)
            webSocketErrorHandler.handleMessageError({ error: "Failed to send message" })
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    return (
        <div className="flex items-center bg-[#25272E] p-2 rounded-md overflow-hidden focus-within:ring-2 ring-[#5A5FCF] transition-all duration-200">
            <input
                type="text"
                className="flex-grow px-4 py-2 text-[#DDE3F1] placeholder-[#A6B1C0] bg-transparent focus:outline-none font-mono text-sm"
                placeholder={isEditing ? "Edit message..." : connected ? "Type a message..." : "Connecting..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={(!currentRoomDetails && !isEditing) || sending || (!connected && !isEditing) || disabled}
            />

            {!connected && (
                <div className="px-2 text-red-400 flex items-center">
                    <WifiOff size={16} className="mr-1" />
                    <span className="text-xs">Disconnected</span>
                </div>
            )}

            <button
                className={`
                    p-2 mr-1
                    ${message.trim() && !sending && connected
                        ? "text-[#DDE3F1] hover:text-white hover:bg-[#333845]"
                        : "text-gray-600"
                    }
                    transition-colors duration-200
                    rounded-md
                `}
                onClick={handleSubmit}
                disabled={!message.trim() || sending || (!connected && !isEditing) || disabled}
            >
                <Send size={16} className={sending ? "animate-pulse" : ""} />
            </button>
            {onCancel && (
                <button
                    className="p-2 mr-2 text-[#A6B1C0] hover:text-white hover:bg-[#333845] rounded-md transition-colors duration-200"
                    onClick={onCancel}
                >
                    <X size={16} />
                </button>
            )}
        </div>
    )
}

MessageInput.propTypes = {
    initialMessage: PropTypes.string,
    onMessageSent: PropTypes.func,
    onCancel: PropTypes.func,
    isEditing: PropTypes.bool,
    messageId: PropTypes.string,
    disabled: PropTypes.bool,
}

export default MessageInput
