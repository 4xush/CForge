import React, { createContext, useContext, useState, useCallback, useRef } from "react"
import api from "../services/ApiService.js"
import { useAuthContext } from "./AuthContext"
import { useRoomContext } from "./RoomContext"

const MessageContext = createContext()

export const MessageProvider = ({ children }) => {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState(null)
    const [isTyping, setIsTyping] = useState({})
    const { authUser } = useAuthContext()
    const { currentRoomDetails } = useRoomContext()
    const fetchIdRef = useRef(0)

    const fetchMessages = useCallback(
        async (lastMessageId = null) => {
            if (!currentRoomDetails) return
            setLoading(true)
            setError(null)

            const currentFetchId = ++fetchIdRef.current

            try {
                const query = lastMessageId ? `?lastMessageId=${lastMessageId}&limit=50` : "?limit=50"
                const response = await api.get(`/rooms/${currentRoomDetails._id}/messages${query}`)

                if (currentFetchId === fetchIdRef.current) {
                    setMessages((prevMessages) => {
                        const newMessages = response.data.messages;

                        if (!lastMessageId) {
                            // Initial load: messages should be in chronological order
                            return [...newMessages].reverse();
                        } else {
                            // Loading more: prepend older messages
                            const uniqueNewMessages = [...newMessages].reverse().filter(
                                (newMsg) => !prevMessages.some((prevMsg) => prevMsg._id === newMsg._id)
                            );
                            return [...uniqueNewMessages, ...prevMessages];
                        }
                    })

                    setHasMore(response.data.hasMore)
                }
            } catch (error) {
                console.error("Error fetching messages:", error)
                setError(error.response?.data?.message || "Failed to load messages")
            } finally {
                if (currentFetchId === fetchIdRef.current) {
                    setLoading(false)
                }
            }
        },
        [currentRoomDetails],
    )

    const addMessage = useCallback(
        (newMessage) => {
            // Add new messages at the end of the list
            if (newMessage.sender && typeof newMessage.sender === 'object') {
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                return;
            }

            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    ...newMessage,
                    sender: {
                        _id: authUser._id,
                        username: authUser.username,
                        profilePicture: authUser.profilePicture,
                    },
                    createdAt: newMessage.createdAt || new Date().toISOString(),
                },
            ])
        },
        [authUser],
    )

    const updateMessage = useCallback((messageId, updatedMessage) => {
        setMessages(prevMessages =>
            prevMessages.map(msg => msg._id === messageId ? updatedMessage : msg)
        );
    }, []);

    const deleteMessage = useCallback(async (messageId) => {
        try {
            await api.delete(`/rooms/messages/${messageId}`)
            setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId))
        } catch (error) {
            console.error("Error deleting message:", error)
            throw error
        }
    }, [])

    const editMessage = useCallback(async (messageId, newContent) => {
        try {
            const response = await api.put(`/rooms/messages/${messageId}`, { content: newContent })
            setMessages((prevMessages) => prevMessages.map((msg) => (msg._id === messageId ? response.data.message : msg)))
            return response.data.message
        } catch (error) {
            console.error("Error editing message:", error)
            throw error
        }
    }, [])

    const handleTypingStart = useCallback((userId) => {
        setIsTyping(prev => ({ ...prev, [userId]: true }));

        // Clear typing indicator after 3 seconds
        setTimeout(() => {
            setIsTyping(prev => ({ ...prev, [userId]: false }));
        }, 3000);
    }, []);

    return (
        <MessageContext.Provider
            value={{
                messages,
                loading,
                hasMore,
                error,
                fetchMessages,
                addMessage,
                updateMessage,
                deleteMessage,
                editMessage,
                setMessages,
                isTyping,
                handleTypingStart
            }}
        >
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

