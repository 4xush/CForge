import { useEffect, useRef, useState, useCallback } from "react"
import { useRoomContext } from "../../context/RoomContext"
import { useAuthContext } from "../../context/AuthContext"
import { useMessageContext } from "../../context/MessageContext"
import { useWebSocket } from "../../context/WebSocketContext"
import Message from "./ui/Message"
import MessageInput from "./MessageInput"
import ContextMenu from "./ChatContextMenu"
import PublicUserProfileModal from "../../components/PublicUserProfileModal"
import { format, isToday, isYesterday, isSameYear } from "date-fns"
import { AlertCircle, RefreshCw, ChevronDown } from "lucide-react"
import { Spinner } from "../ui/Spinner"
import toast from "react-hot-toast"

const Chat = () => {
    const { currentRoomDetails } = useRoomContext()
    const { authUser } = useAuthContext()
    const { socket, connected, addEventListener, removeEventListener, sendMessage } = useWebSocket()
    const { messages, loading, hasMore, error, fetchMessages, editMessage, setMessages } = useMessageContext()

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null })
    const [editingMessage, setEditingMessage] = useState(null)
    const [loadingMore, setLoadingMore] = useState(false)
    const [profileModal, setProfileModal] = useState({ isOpen: false, username: null })
    const isInitialLoadRef = useRef(true)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [isNearBottom, setIsNearBottom] = useState(isInitialLoadRef.current)

    const messagesEndRef = useRef(null)
    const contextMenuRef = useRef(null)
    const messagesContainerRef = useRef(null)
    const lastScrollTopRef = useRef(0)
    const eventListenersSetupRef = useRef(false) // FIXED: Prevent duplicate listeners

    // Fetch messages when room changes
    useEffect(() => {
        if (currentRoomDetails) {
            isInitialLoadRef.current = true
            fetchMessages()
        }
    }, [currentRoomDetails, currentRoomDetails?._id, fetchMessages])

    // FIXED: Improved message deduplication and replacement logic
    const handleNewMessage = useCallback(
        (message) => {

            // FIXED: Validate message structure
            if (!message || typeof message !== "object") {
                console.error("Chat: Invalid message received:", message)
                return
            }

            setMessages((prevMessages) => {
                // FIXED: Check for existing message by ID first
                const existsById = prevMessages.some((msg) => msg._id === message._id)
                if (existsById) {
                    console.log("Chat: Ignoring duplicate message by ID:", message._id)
                    return prevMessages
                }

                // FIXED: Improved temporary message replacement logic
                let tempIndex = -1
                if (message.tempId) {
                    // Look for temporary message with matching tempId
                    tempIndex = prevMessages.findIndex((msg) => msg.isTemporary && msg.tempId === message.tempId)
                }

                if (tempIndex !== -1) {
                    const newMessages = [...prevMessages]
                    newMessages[tempIndex] = { ...message, isTemporary: false }
                    return newMessages
                }

                // FIXED: If no tempId match, check if this message is from current user and similar content
                if (message.sender._id === authUser._id) {
                    const similarTempIndex = prevMessages.findIndex(
                        (msg) =>
                            msg.isTemporary &&
                            msg.content === message.content &&
                            msg.sender._id === message.sender._id &&
                            Math.abs(new Date(message.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 10000, // 10 seconds window
                    )

                    if (similarTempIndex !== -1) {
                        const newMessages = [...prevMessages]
                        newMessages[similarTempIndex] = { ...message, isTemporary: false }
                        return newMessages
                    }
                }

                // FIXED: Check if this is a duplicate of an existing non-temporary message
                const duplicateExists = prevMessages.some(
                    (msg) =>
                        !msg.isTemporary &&
                        msg.content === message.content &&
                        msg.sender._id === message.sender._id &&
                        Math.abs(new Date(msg.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000,
                )

                if (duplicateExists) {
                    return prevMessages
                }

                return [...prevMessages, message]
            })
        },
        [setMessages, authUser?._id],
    )

    // FIXED: Handle message sent confirmation
    const handleMessageSent = useCallback(
        (data) => {

            // FIXED: Remove temporary message when we get confirmation
            if (data.tempId) {
                setMessages((prevMessages) => {
                    const tempIndex = prevMessages.findIndex((msg) => msg.tempId === data.tempId)
                    if (tempIndex !== -1) {
                        const newMessages = [...prevMessages]
                        newMessages.splice(tempIndex, 1)
                        return newMessages
                    }
                    return prevMessages
                })
            }

            if (data.success) {
                toast.success("Message sent successfully", { duration: 1000 })
            }
        },
        [setMessages],
    )

    // FIXED: Handle message errors
    const handleMessageError = useCallback(
        (error) => {

            // FIXED: Remove temporary message if it failed to send
            if (error.tempId) {
                setMessages((prevMessages) => {
                    const filtered = prevMessages.filter((msg) => msg.tempId !== error.tempId)
                    return filtered
                })
            }

            toast.error(error.error || "Failed to send message. Please try again.")
        },
        [setMessages],
    )

    // FIXED: Setup WebSocket listeners with deduplication
    useEffect(() => {
        if (!socket || eventListenersSetupRef.current) return
        eventListenersSetupRef.current = true

        addEventListener("receive_message", handleNewMessage)
        addEventListener("message_sent", handleMessageSent)
        addEventListener("message_error", handleMessageError)

        return () => {
            eventListenersSetupRef.current = false
            removeEventListener("receive_message", handleNewMessage)
            removeEventListener("message_sent", handleMessageSent)
            removeEventListener("message_error", handleMessageError)
        }
    }, [socket, addEventListener, removeEventListener, handleNewMessage, handleMessageSent, handleMessageError])

    // FIXED: Message edit listeners - Updated for backend format
    const handleMessageUpdated = useCallback(
        (updatedMessage) => {

            // FIXED: Validate updated message structure
            if (!updatedMessage || typeof updatedMessage !== "object") {
                console.error("Chat: Invalid updated message received:", updatedMessage)
                return
            }

            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg._id === updatedMessage._id
                        ? {
                            ...msg,
                            content: updatedMessage.content,
                            isEdited: true,
                            editedAt: updatedMessage.editedAt,
                        }
                        : msg,
                ),
            )
            if (updatedMessage.sender._id !== authUser._id) {
                toast("A message was edited", { duration: 2000 })
            }
        },
        [setMessages, authUser?._id],
    )

    const handleEditSuccess = useCallback((data) => {
        if (data.messageId) {
            toast.success("Message edited successfully", { duration: 1000 })
        }
    }, [])

    useEffect(() => {
        if (!socket) return

        addEventListener("message_updated", handleMessageUpdated)
        addEventListener("edit_success", handleEditSuccess)

        return () => {
            removeEventListener("message_updated", handleMessageUpdated)
            removeEventListener("edit_success", handleEditSuccess)
        }
    }, [socket, addEventListener, removeEventListener, handleMessageUpdated, handleEditSuccess])

    // Scroll handling
    const scrollToBottom = useCallback((behavior = "smooth") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior })
            setUnreadCount(0)
            setShowScrollButton(false)
        }
    }, [])

    const handleScroll = useCallback(() => {
        if (!messagesContainerRef.current) return

        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
        const scrollPosition = scrollHeight - scrollTop - clientHeight
        const isBottom = scrollPosition < 100

        setShowScrollButton(!isBottom)
        setIsNearBottom(isBottom)

        if (!isBottom && scrollTop < lastScrollTopRef.current) {
            setUnreadCount((prev) => prev + 1)
        }

        lastScrollTopRef.current = scrollTop
    }, [])

    // Auto-scroll effect
    useEffect(() => {
        if (!messagesContainerRef.current) return

        const shouldAutoScroll = isNearBottom || isInitialLoadRef.current

        if (shouldAutoScroll) {
            scrollToBottom(isInitialLoadRef.current ? "auto" : "smooth")
            isInitialLoadRef.current = false
        } else if (!loadingMore) {
            setUnreadCount((prev) => prev + 1)
        }

        const container = messagesContainerRef.current
        container.addEventListener("scroll", handleScroll)
        return () => container.removeEventListener("scroll", handleScroll)
    }, [messages, isNearBottom, loadingMore, handleScroll, scrollToBottom])

    // Load older messages
    const loadOlderMessages = useCallback(async () => {
        if (!hasMore || loadingMore || messages.length === 0) return

        setLoadingMore(true)
        try {
            const oldestMessage = messages[0]
            await fetchMessages(oldestMessage._id)
            toast.success("Older messages loaded", { duration: 1000 })
        } catch (error) {
            toast.error("Failed to load older messages. Please try again.")
        } finally {
            setLoadingMore(false)
        }
    }, [hasMore, loadingMore, messages, fetchMessages])

    // Context menu handling
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                closeContextMenu()
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const canModifyMessage = useCallback(
        (message) => {
            if (!authUser || !message) return false
            if (message.sender._id === authUser._id) return true
            return currentRoomDetails?.admins?.some((admin) => admin.toString() === authUser._id.toString())
        },
        [authUser, currentRoomDetails],
    )

    const handleContextMenu = useCallback(
        (e, messageId) => {
            e.preventDefault()
            const message = messages.find((msg) => msg._id === messageId)
            if (canModifyMessage(message)) {
                setContextMenu({
                    visible: true,
                    x: Math.min(e.clientX, window.innerWidth - 200),
                    y: Math.min(e.clientY, window.innerHeight - 150),
                    messageId,
                })
            }
        },
        [messages, canModifyMessage],
    )

    const closeContextMenu = useCallback(() => {
        setContextMenu({ visible: false, x: 0, y: 0, messageId: null })
    }, [])

    // FIXED: Message editing - Updated for backend format
    const handleEditMessage = useCallback(
        async (messageId, newContent) => {
            try {
                if (connected && currentRoomDetails) {

                    // Optimistic update
                    setMessages((prevMessages) =>
                        prevMessages.map((msg) =>
                            msg._id === messageId
                                ? {
                                    ...msg,
                                    content: newContent,
                                    isEdited: true,
                                    editedAt: new Date().toISOString(),
                                }
                                : msg,
                        ),
                    )

                    // Send edit through WebSocket with backend expected format
                    editMessage(currentRoomDetails._id, messageId, newContent)

                    // Also update via API for persistence
                    try {
                        await editMessage(messageId, newContent)
                    } catch (apiError) {
                        console.error("API edit error:", apiError)
                    }
                } else {
                    await editMessage(messageId, newContent)
                }

                setEditingMessage(null)
            } catch (error) {
                toast.error(error.message || "Failed to edit message")
            }
        },
        [connected, currentRoomDetails, setMessages, editMessage],
    )

    const startEditing = useCallback((message) => {
        setEditingMessage(message)
        closeContextMenu()
    }, [])

    const cancelEditing = useCallback(() => {
        setEditingMessage(null)
    }, [])

    // Format date headers
    const formatMessageDate = useCallback((date) => {
        const messageDate = new Date(date)
        if (isToday(messageDate)) return "Today"
        if (isYesterday(messageDate)) return "Yesterday"
        if (isSameYear(messageDate, new Date())) return format(messageDate, "MMMM d")
        return format(messageDate, "MMMM d, yyyy")
    }, [])

    const handleAvatarClick = useCallback((username) => {
        setProfileModal({
            isOpen: true,
            username: username,
        })
    }, [])

    const closeProfileModal = useCallback(() => {
        setProfileModal({ isOpen: false, username: null })
    }, [])

    const handleRetry = useCallback(() => {
        if (currentRoomDetails) {
            fetchMessages()
        }
    }, [currentRoomDetails, fetchMessages])

    // FIXED: Validate message structure before rendering
    const validateMessage = useCallback((msg) => {
        if (!msg || typeof msg !== "object") {
            return false
        }

        // Ensure required fields exist
        if (!msg._id && !msg.tempId) {
            return false
        }

        if (!msg.sender || typeof msg.sender !== "object") {
            return false
        }

        if (!msg.content && msg.content !== "") {
            return false
        }

        return true
    }, [])

    // FIXED: Improved message deduplication
    const deduplicateMessages = useCallback((msgs) => {
        const seen = new Set()
        const deduped = []

        for (const msg of msgs) {
            // Create a unique key for each message
            const key = msg._id || `${msg.tempId}-${msg.content}-${msg.sender._id}-${msg.createdAt}`

            if (!seen.has(key)) {
                seen.add(key)
                deduped.push(msg)
            } else {
                console.log("Chat: Removing duplicate message:", key)
            }
        }

        return deduped
    }, [])

    // Render states
    if (!currentRoomDetails) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-gray-500">
                <p>Select a room to view messages</p>
            </div>
        )
    }

    if (error && !loading) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 max-w-md text-center">
                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-red-400 mb-2">Failed to load messages</h3>
                    <p className="text-gray-400 mb-4">{error?.message || "An error occurred while loading messages"}</p>
                    <button
                        onClick={handleRetry}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center justify-center mx-auto"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                    </button>
                </div>
            </div>
        )
    }

    if (loading && !loadingMore && messages.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <Spinner size="lg" />
                <p className="text-gray-500 mt-4">Loading messages...</p>
            </div>
        )
    }

    // FIXED: Filter, validate and deduplicate messages before grouping
    const validMessages = deduplicateMessages(messages.filter(validateMessage))

    // Group messages by date
    const groupedMessages = validMessages.reduce((groups, message) => {
        const date = formatMessageDate(message.createdAt)
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(message)
        return groups
    }, {})

    return (
        <div className="flex flex-col h-full relative">
            <div
                ref={messagesContainerRef}
                className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
            >
                {hasMore && messages.length > 0 && (
                    <div className="text-center py-2 border-b border-gray-800">
                        <button
                            onClick={loadOlderMessages}
                            disabled={loadingMore}
                            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-4 py-1 rounded-md flex items-center justify-center mx-auto transition-colors duration-200"
                        >
                            {loadingMore ? (
                                <>
                                    <Spinner size="sm" />
                                    <span className="ml-2">Loading older messages...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Load Older Messages
                                </>
                            )}
                        </button>
                    </div>
                )}
                {loadingMore && (
                    <div className="text-center py-2">
                        <Spinner size="sm" />
                    </div>
                )}

                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                        <div className="text-center text-xs text-gray-500 my-2 sticky top-0 bg-gray-900/80 backdrop-blur-sm py-1">
                            {date}
                        </div>
                        {msgs.map((msg, index) => {
                            // FIXED: Additional validation before rendering each message
                            if (!validateMessage(msg)) {
                                return null
                            }

                            return (
                                <div
                                    key={`${msg._id || msg.tempId || `temp-${index}`}-${msg.isEdited ? "edited" : "original"}-${msg.editedAt || msg.createdAt
                                        }`}
                                    className="relative group"
                                >
                                    {editingMessage?._id === msg._id ? (
                                        <div className="px-4 py-2">
                                            <MessageInput
                                                initialMessage={msg.content}
                                                onMessageSent={(content) => handleEditMessage(msg._id, content)}
                                                onCancel={cancelEditing}
                                                isEditing={true}
                                                messageId={msg._id}
                                            />
                                        </div>
                                    ) : (
                                        <Message
                                            avatar={
                                                msg.sender.profilePicture ||
                                                `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(msg.sender.username || "User")}`
                                            }
                                            senderName={msg.sender.username || "Unknown User"}
                                            time={format(new Date(msg.createdAt), "HH:mm")}
                                            message={msg.content}
                                            isEdited={msg.isEdited}
                                            isCurrentUser={msg.sender._id === authUser?._id}
                                            canModify={canModifyMessage(msg)}
                                            onContextMenu={(e) => handleContextMenu(e, msg._id)}
                                            onAvatarClick={() => handleAvatarClick(msg.sender.username)}
                                            onEdit={() => startEditing(msg)}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ))}

                {validMessages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                        <div className="bg-gray-800/50 rounded-lg p-6 text-center max-w-md">
                            <h3 className="text-lg font-medium text-gray-300 mb-2">No messages yet</h3>
                            <p className="text-gray-500">Be the first to start a conversation in this room!</p>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {showScrollButton && (
                <button
                    onClick={() => scrollToBottom()}
                    className="absolute bottom-20 right-6 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 flex items-center space-x-2"
                >
                    <ChevronDown size={20} />
                    {unreadCount > 0
                        && (<span className="bg-red-500 text-white text-xs p-1 rounded-full"></span>)
                    }
                </button>
            )}

            <div className="px-4 py-2 border-t border-gray-800">
                <MessageInput
                    onMessageSent={(messageContent) => {
                        // FIXED: Now messageContent is just a string, not an object
                        if (connected && currentRoomDetails) {
                            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

                            // FIXED: Check for recent similar temporary messages to prevent duplicates
                            const hasSimilarTemp = messages.some(
                                (msg) =>
                                    msg.isTemporary &&
                                    msg.content === messageContent &&
                                    msg.sender._id === authUser._id &&
                                    Math.abs(new Date().getTime() - new Date(msg.createdAt).getTime()) < 2000,
                            )

                            if (hasSimilarTemp) {
                                // console.log("Similar temporary message already exists, not adding duplicate")
                                return
                            }

                            const tempMessage = {
                                content: messageContent,
                                isTemporary: true,
                                _id: tempId,
                                tempId: tempId,
                                createdAt: new Date().toISOString(),
                                sender: {
                                    _id: authUser._id,
                                    username: authUser.username,
                                    profilePicture: authUser.profilePicture,
                                },
                            }

                            setMessages((prevMessages) => [...prevMessages, tempMessage])

                            // FIXED: Use the context's sendMessage function with just the message content string
                            const result = sendMessage(currentRoomDetails._id, messageContent)
                            if (!result || !result.success) {
                                // Remove temporary message if send failed immediately
                                setTimeout(() => {
                                    setMessages((prevMessages) => prevMessages.filter((msg) => msg.tempId !== tempId))
                                    // Only show error toast if the message actually failed to send
                                    toast.error("Failed to send message. Please try again.")
                                }, 100)
                            } else {
                                // Update the temporary message with the actual tempId from the service
                                if (result.tempId && result.tempId !== tempId) {
                                    setMessages((prevMessages) =>
                                        prevMessages.map((msg) => (msg.tempId === tempId ? { ...msg, tempId: result.tempId } : msg)),
                                    )
                                }
                            }

                            scrollToBottom()
                        } else {
                            toast.error("Not connected to server. Please wait for reconnection.")
                        }
                    }}
                    disabled={!currentRoomDetails}
                />
            </div>

            {contextMenu.visible && (
                <div
                    ref={contextMenuRef}
                    style={{
                        position: "fixed",
                        top: `${contextMenu.y}px`,
                        left: `${contextMenu.x}px`,
                        zIndex: 1000,
                    }}
                >
                    <ContextMenu
                        onEdit={() => {
                            const messageToEdit = messages.find((m) => m._id === contextMenu.messageId)
                            startEditing(messageToEdit)
                        }}
                        onCancel={closeContextMenu}
                    />
                </div>
            )}

            <PublicUserProfileModal
                username={profileModal.username}
                isOpen={profileModal.isOpen}
                onClose={closeProfileModal}
            />
        </div>
    )
}

export default Chat
