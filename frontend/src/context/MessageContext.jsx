import React, { createContext, useContext, useState, useCallback, useRef } from "react"
import api from "../services/ApiService.js"
import { useAuthContext } from "./AuthContext"
import { useRoomContext } from "./RoomContext"

const MessageContext = createContext()

export const MessageProvider = ({ children }) => {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const { authUser } = useAuthContext()
    const { selectedRoom } = useRoomContext()
    const fetchIdRef = useRef(0)

    const fetchMessages = useCallback(
        async (lastMessageId = null) => {
            if (!selectedRoom) return
            setLoading(true)

            const currentFetchId = ++fetchIdRef.current

            try {
                const query = lastMessageId ? `?lastMessageId=${lastMessageId}&limit=50` : "?limit=50"
                const response = await api.get(`/rooms/${selectedRoom._id}/messages${query}`)

                // Only update state if this is the latest fetch request
                if (currentFetchId === fetchIdRef.current) {
                    setMessages((prevMessages) => {
                        const newMessages = response.data.messages
                        if (!lastMessageId) {
                            // Initial load: replace all messages
                            return newMessages
                        } else {
                            // Loading more: add older messages at the beginning
                            const uniqueNewMessages = newMessages.filter(
                                (newMsg) => !prevMessages.some((prevMsg) => prevMsg._id === newMsg._id),
                            )
                            return [...uniqueNewMessages, ...prevMessages]
                        }
                    })

                    setHasMore(response.data.hasMore)
                }
            } catch (error) {
                console.error("Error fetching messages:", error)
            } finally {
                if (currentFetchId === fetchIdRef.current) {
                    setLoading(false)
                }
            }
        },
        [selectedRoom],
    )

    const addMessage = useCallback(
        (newMessage) => {
            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    ...newMessage,
                    sender: {
                        _id: authUser._id,
                        username: authUser.username,
                        profilePicture: authUser.profilePicture,
                    },
                    createdAt: new Date().toISOString(),
                },
            ])
        },
        [authUser],
    )

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

    return (
        <MessageContext.Provider
            value={{
                messages,
                loading,
                hasMore,
                fetchMessages,
                addMessage,
                deleteMessage,
                editMessage,
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

