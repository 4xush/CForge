import { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from "react"
import PropTypes from 'prop-types'
import api from "../services/ApiService.js"
import { useAuthContext } from "./AuthContext"
import { useRoomContext } from "./RoomContext"

const MessageContext = createContext()

export const MessageProvider = ({ children }) => {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState(null)
    const { authUser } = useAuthContext()
    const { currentRoomDetails } = useRoomContext()
    const fetchIdRef = useRef(0)
    const currentRoomIdRef = useRef(null)

    // Clear messages when room changes
    useEffect(() => {
        const newRoomId = currentRoomDetails?._id;
        if (currentRoomIdRef.current !== newRoomId) {
            setMessages([]);
            setHasMore(true);
            setError(null);
            setLoading(false);
            currentRoomIdRef.current = newRoomId;
        }
    }, [currentRoomDetails?._id]);

    const fetchMessages = useCallback(
        async (lastMessageId = null) => {
            if (!currentRoomDetails?._id) return

            setLoading(true)
            setError(null)

            const currentFetchId = ++fetchIdRef.current

            try {
                const query = lastMessageId ? `?lastMessageId=${lastMessageId}&limit=50` : "?limit=50"
                const response = await api.get(`/rooms/${currentRoomDetails._id}/messages${query}`)

                // Only update state if this is the latest fetch request and we're still in the same room
                if (currentFetchId === fetchIdRef.current && currentRoomIdRef.current === currentRoomDetails._id) {
                    setMessages((prevMessages) => {
                        const newMessages = response.data.messages;

                        if (!lastMessageId) {
                            // Initial load: reverse messages to show oldest -> newest
                            return newMessages.reverse();
                        } else {
                            // Loading more: reverse older messages and prepend
                            const reversedMessages = newMessages.reverse();
                            const uniqueNewMessages = reversedMessages.filter(
                                (newMsg) => !prevMessages.some((prevMsg) => prevMsg._id === newMsg._id)
                            );
                            return [...uniqueNewMessages, ...prevMessages];
                        }
                    })

                    setHasMore(response.data.hasMore)
                }
            } catch (error) {
                console.error("Error fetching messages:", error)
                if (currentFetchId === fetchIdRef.current && currentRoomIdRef.current === currentRoomDetails._id) {
                    setError(error.response?.data?.message || "Failed to load messages")
                }
            } finally {
                if (currentFetchId === fetchIdRef.current && currentRoomIdRef.current === currentRoomDetails._id) {
                    setLoading(false)
                }
            }
        },
        [currentRoomDetails?._id], // Only depend on the room ID, not the entire object
    )

    const addMessage = useCallback(
        (newMessage) => {
            if (!authUser?._id) {
                console.warn("Cannot add message: user not authenticated");
                return;
            }

            console.log("Adding message to context:", newMessage._id || newMessage.tempId);

            setMessages((prevMessages) => {
                // Check for exact duplicates by ID or tempId
                const isDuplicateById = prevMessages.some(msg =>
                    (newMessage._id && msg._id === newMessage._id) ||
                    (newMessage.tempId && msg.tempId === newMessage.tempId)
                );

                if (isDuplicateById) {
                    console.log("Ignoring duplicate message by ID:", newMessage._id || newMessage.tempId);
                    return prevMessages;
                }

                // Check for similar temporary messages (same content, sender, within 5 seconds)
                if (newMessage.isTemporary) {
                    const hasSimilarTemp = prevMessages.some(msg =>
                        msg.isTemporary &&
                        msg.content === newMessage.content &&
                        msg.sender?._id === newMessage.sender?._id &&
                        Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 5000
                    );

                    if (hasSimilarTemp) {
                        console.log("Ignoring similar temporary message:", newMessage.content?.substring(0, 20));
                        return prevMessages;
                    }
                }

                // Create the message object
                let messageToAdd;

                // If the message already has sender info, use it directly
                if (newMessage.sender && typeof newMessage.sender === 'object') {
                    messageToAdd = {
                        ...newMessage,
                        createdAt: newMessage.createdAt || new Date().toISOString()
                    };
                } else {
                    // Otherwise, construct a full message object
                    messageToAdd = {
                        ...newMessage,
                        sender: {
                            _id: authUser._id,
                            username: authUser.username,
                            profilePicture: authUser.profilePicture,
                        },
                        createdAt: newMessage.createdAt || new Date().toISOString(),
                    };
                }

                console.log("Successfully adding message:", messageToAdd._id || messageToAdd.tempId);
                return [...prevMessages, messageToAdd];
            });
        },
        [authUser?._id, authUser?.username, authUser?.profilePicture], // Only depend on specific user properties
    )

    const updateMessage = useCallback((messageId, updatedMessage) => {
        if (!messageId) {
            console.warn("Cannot update message: messageId is required");
            return;
        }

        setMessages(prevMessages =>
            prevMessages.map(msg => {
                if (msg._id === messageId) {
                    console.log("Updating message:", messageId);
                    return { ...msg, ...updatedMessage };
                }
                return msg;
            })
        );
    }, []);

    const deleteMessage = useCallback(async (messageId) => {
        if (!messageId) {
            throw new Error("Message ID is required for deletion");
        }

        try {
            await api.delete(`/rooms/messages/${messageId}`)
            setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId))
        } catch (error) {
            console.error("Error deleting message:", error)
            throw error
        }
    }, [])

    const editMessage = useCallback(async (messageId, newContent) => {
        if (!messageId || !newContent?.trim()) {
            throw new Error("Message ID and content are required for editing");
        }

        try {
            const response = await api.put(`/rooms/messages/${messageId}`, { content: newContent })

            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg._id === messageId ? response.data.message : msg
                )
            )

            return response.data.message
        } catch (error) {
            console.error("Error editing message:", error)
            throw error
        }
    }, [])

    // Stable wrapper for setMessages to prevent unnecessary re-renders in consuming components
    const setMessagesStable = useCallback((messagesOrUpdater) => {
        setMessages(messagesOrUpdater);
    }, []);

    // Clear messages when user logs out
    useEffect(() => {
        if (!authUser) {
            setMessages([]);
            setHasMore(true);
            setError(null);
            setLoading(false);
        }
    }, [authUser]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        messages,
        loading,
        hasMore,
        error,
        fetchMessages,
        addMessage,
        updateMessage,
        deleteMessage,
        editMessage,
        setMessages: setMessagesStable
    }), [
        messages,
        loading,
        hasMore,
        error,
        fetchMessages,
        addMessage,
        updateMessage,
        deleteMessage,
        editMessage,
        setMessagesStable
    ]);

    return (
        <MessageContext.Provider value={contextValue}>
            {children}
        </MessageContext.Provider>
    )
}

export const useMessageContext = () => {
    const context = useContext(MessageContext)
    if (!context) {
        throw new Error("useMessageContext must be used within a MessageProvider")
    }
    return context
}

MessageProvider.propTypes = {
    children: PropTypes.node.isRequired
}