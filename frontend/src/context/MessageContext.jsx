"use client"

import { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from "react"
import PropTypes from "prop-types"
import api from "../services/ApiService.js"
import { useAuthContext } from "./AuthContext"
import { useRoomContext } from "./RoomContext"

const MessageContext = createContext()

// Cache configuration
const CACHE_CONFIG = {
    MAX_MESSAGES: 200, // FIXED: Increased to handle more loaded messages
    EXPIRY_DURATION: 24 * 60 * 60 * 1000, // FIXED: Increased to 24 hours for better UX
    KEY_PREFIX: "chat-cache-",
}

// Cache utility functions
const getCacheKey = (roomId) => `${CACHE_CONFIG.KEY_PREFIX}${roomId}`

const getCachedMessages = (roomId) => {
    try {
        const cacheKey = getCacheKey(roomId)
        const cached = localStorage.getItem(cacheKey)

        if (!cached) return null

        const data = JSON.parse(cached)

        // Check if cache is expired
        if (Date.now() > data.expiresAt) {
            localStorage.removeItem(cacheKey)
            return null
        }

        return data.messages
    } catch (error) {
        console.error("Error reading cached messages:", error)
        return null
    }
}

const setCachedMessages = (roomId, messages, hasMore = true) => {
    try {
        const cacheKey = getCacheKey(roomId)

        // FIXED: Don't limit messages here - let the full loaded set be cached
        // Only limit if we exceed a reasonable maximum
        const limitedMessages =
            messages.length > CACHE_CONFIG.MAX_MESSAGES ? messages.slice(-CACHE_CONFIG.MAX_MESSAGES) : messages

        const cacheData = {
            messages: limitedMessages,
            hasMore, // FIXED: Store hasMore state in cache
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_CONFIG.EXPIRY_DURATION,
            version: "1.0",
        }

        localStorage.setItem(cacheKey, JSON.stringify(cacheData))
        console.log(`Cached ${limitedMessages.length} messages for room ${roomId}`)
    } catch (error) {
        console.error("Error caching messages:", error)
        // If localStorage is full, try to clear old caches
        if (error.name === "QuotaExceededError") {
            clearExpiredCaches()
            // Try again with fewer messages
            try {
                const cacheKey = getCacheKey(roomId)
                const reducedMessages = messages.slice(-50)
                const cacheData = {
                    messages: reducedMessages,
                    hasMore,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + CACHE_CONFIG.EXPIRY_DURATION,
                    version: "1.0",
                }
                localStorage.setItem(cacheKey, JSON.stringify(cacheData))
            } catch (retryError) {
                console.error("Failed to cache even reduced messages:", retryError)
            }
        }
    }
}

const clearCachedMessages = (roomId) => {
    try {
        const cacheKey = getCacheKey(roomId)
        localStorage.removeItem(cacheKey)
    } catch (error) {
        console.error("Error clearing cached messages:", error)
    }
}

const clearAllCaches = () => {
    try {
        const keys = Object.keys(localStorage)
        keys.forEach((key) => {
            if (key.startsWith(CACHE_CONFIG.KEY_PREFIX)) {
                localStorage.removeItem(key)
            }
        })
    } catch (error) {
        console.error("Error clearing all caches:", error)
    }
}

// FIXED: Add function to clear expired caches
const clearExpiredCaches = () => {
    try {
        const keys = Object.keys(localStorage)
        keys.forEach((key) => {
            if (key.startsWith(CACHE_CONFIG.KEY_PREFIX)) {
                try {
                    const cached = localStorage.getItem(key)
                    if (cached) {
                        const data = JSON.parse(cached)
                        if (Date.now() > data.expiresAt) {
                            localStorage.removeItem(key)
                            console.log(`Cleared expired cache: ${key}`)
                        }
                    }
                } catch (error) {
                    // If we can't parse it, remove it
                    localStorage.removeItem(key)
                }
            }
        })
    } catch (error) {
        console.error("Error clearing expired caches:", error)
    }
}

export const MessageProvider = ({ children }) => {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState(null)
    const { authUser } = useAuthContext()
    const { currentRoomDetails } = useRoomContext()
    const fetchIdRef = useRef(0)
    const currentRoomIdRef = useRef(null)
    const [cacheLoaded, setCacheLoaded] = useState(false)

    // Load cached messages when room changes
    useEffect(() => {
        const newRoomId = currentRoomDetails?._id
        if (currentRoomIdRef.current !== newRoomId) {
            // Clear previous room state
            setMessages([])
            setHasMore(true)
            setError(null)
            setLoading(false)
            setCacheLoaded(false)

            currentRoomIdRef.current = newRoomId

            // Load cached messages for new room
            if (newRoomId) {
                const cachedData = getCachedMessages(newRoomId)
                if (cachedData && cachedData.length > 0) {
                    console.log(`Loaded ${cachedData.length} messages from cache for room ${newRoomId}`)
                    setMessages(cachedData)

                    // FIXED: Get hasMore from cache if available
                    try {
                        const cacheKey = getCacheKey(newRoomId)
                        const cached = localStorage.getItem(cacheKey)
                        if (cached) {
                            const data = JSON.parse(cached)
                            setHasMore(data.hasMore !== undefined ? data.hasMore : true)
                        }
                    } catch (error) {
                        console.error("Error reading hasMore from cache:", error)
                        setHasMore(true)
                    }
                }
                setCacheLoaded(true)
            }
        }
    }, [currentRoomDetails?._id])

    // Update cache whenever messages change
    useEffect(() => {
        if (currentRoomDetails?._id && messages.length > 0 && cacheLoaded) {
            setCachedMessages(currentRoomDetails._id, messages, hasMore)
        }
    }, [messages, currentRoomDetails?._id, cacheLoaded, hasMore])

    const fetchMessages = useCallback(
        async (lastMessageId = null) => {
            if (!currentRoomDetails?._id) return

            setLoading(true)
            setError(null)

            const currentFetchId = ++fetchIdRef.current

            try {
                // FIXED: Use 50 messages for better UX, but allow customization
                const limit = lastMessageId ? 50 : 50
                const query = lastMessageId ? `?lastMessageId=${lastMessageId}&limit=${limit}` : `?limit=${limit}`
                const response = await api.get(`/rooms/${currentRoomDetails._id}/messages${query}`)

                // Only update state if this is the latest fetch request and we're still in the same room
                if (currentFetchId === fetchIdRef.current && currentRoomIdRef.current === currentRoomDetails._id) {
                    setMessages((prevMessages) => {
                        // Backend returns messages in descending order (newest first)
                        // We need to reverse them to display in ascending order (oldest first)
                        const newMessages = [...response.data.messages].reverse()

                        let updatedMessages
                        if (!lastMessageId) {
                            // Initial load: messages are already in oldest -> newest order after reversing
                            updatedMessages = newMessages
                        } else {
                            // Loading more: add older messages at the beginning
                            // Filter out any duplicates
                            const uniqueNewMessages = newMessages.filter(
                                (newMsg) => !prevMessages.some((prevMsg) => prevMsg._id === newMsg._id),
                            )
                            updatedMessages = [...uniqueNewMessages, ...prevMessages]
                        }

                        return updatedMessages
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
        [currentRoomDetails?._id],
    )

    const addMessage = useCallback(
        (newMessage) => {
            if (!authUser?._id) {
                console.warn("Cannot add message: user not authenticated")
                return
            }

            console.log("Adding message to context:", newMessage._id || newMessage.tempId)

            setMessages((prevMessages) => {
                // Check for exact duplicates by ID or tempId
                const isDuplicateById = prevMessages.some(
                    (msg) =>
                        (newMessage._id && msg._id === newMessage._id) || (newMessage.tempId && msg.tempId === newMessage.tempId),
                )

                if (isDuplicateById) {
                    console.log("Ignoring duplicate message by ID:", newMessage._id || newMessage.tempId)
                    return prevMessages
                }

                // Check for similar temporary messages (same content, sender, within 5 seconds)
                if (newMessage.isTemporary) {
                    const hasSimilarTemp = prevMessages.some(
                        (msg) =>
                            msg.isTemporary &&
                            msg.content === newMessage.content &&
                            msg.sender?._id === newMessage.sender?._id &&
                            Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 5000,
                    )

                    if (hasSimilarTemp) {
                        console.log("Ignoring similar temporary message:", newMessage.content?.substring(0, 20))
                        return prevMessages
                    }
                }

                // Create the message object
                let messageToAdd

                // If the message already has sender info, use it directly
                if (newMessage.sender && typeof newMessage.sender === "object") {
                    messageToAdd = {
                        ...newMessage,
                        createdAt: newMessage.createdAt || new Date().toISOString(),
                    }
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
                    }
                }

                console.log("Successfully adding message:", messageToAdd._id || messageToAdd.tempId)
                return [...prevMessages, messageToAdd]
            })
        },
        [authUser?._id, authUser?.username, authUser?.profilePicture],
    )

    const updateMessage = useCallback((messageId, updatedMessage) => {
        if (!messageId) {
            console.warn("Cannot update message: messageId is required")
            return
        }

        setMessages((prevMessages) => {
            return prevMessages.map((msg) => {
                if (msg._id === messageId) {
                    console.log("Updating message:", messageId)
                    return { ...msg, ...updatedMessage }
                }
                return msg
            })
        })
    }, [])

    const deleteMessage = useCallback(async (messageId) => {
        if (!messageId) {
            throw new Error("Message ID is required for deletion")
        }

        try {
            await api.delete(`/rooms/messages/${messageId}`)
            setMessages((prevMessages) => {
                return prevMessages.filter((msg) => msg._id !== messageId)
            })
        } catch (error) {
            console.error("Error deleting message:", error)
            throw error
        }
    }, [])

    const editMessage = useCallback(async (messageId, newContent) => {
        if (!messageId || !newContent?.trim()) {
            throw new Error("Message ID and content are required for editing")
        }

        try {
            const response = await api.put(`/rooms/messages/${messageId}`, { content: newContent })

            setMessages((prevMessages) => {
                return prevMessages.map((msg) => (msg._id === messageId ? response.data.message : msg))
            })

            return response.data.message
        } catch (error) {
            console.error("Error editing message:", error)
            throw error
        }
    }, [])

    // Stable wrapper for setMessages to prevent unnecessary re-renders in consuming components
    const setMessagesStable = useCallback((messagesOrUpdater) => {
        setMessages(messagesOrUpdater)
    }, [])

    // Clear messages and cache when user logs out
    useEffect(() => {
        if (!authUser) {
            setMessages([])
            setHasMore(true)
            setError(null)
            setLoading(false)
            setCacheLoaded(false)
            // Clear all caches on logout
            clearAllCaches()
            console.log("Cleared all message caches on logout")
        }
    }, [authUser])

    // FIXED: Clear expired caches on mount
    useEffect(() => {
        clearExpiredCaches()
    }, [])

    // Utility function to manually clear cache for current room
    const clearCurrentRoomCache = useCallback(() => {
        if (currentRoomDetails?._id) {
            clearCachedMessages(currentRoomDetails._id)
            console.log(`Cleared cache for room ${currentRoomDetails._id}`)
        }
    }, [currentRoomDetails?._id])

    // Utility function to get cache info for debugging
    const getCacheInfo = useCallback(() => {
        if (!currentRoomDetails?._id) return null

        try {
            const cacheKey = getCacheKey(currentRoomDetails._id)
            const cached = localStorage.getItem(cacheKey)

            if (!cached) return { exists: false }

            const data = JSON.parse(cached)
            return {
                exists: true,
                messageCount: data.messages?.length || 0,
                hasMore: data.hasMore,
                timestamp: new Date(data.timestamp).toISOString(),
                expiresAt: new Date(data.expiresAt).toISOString(),
                isExpired: Date.now() > data.expiresAt,
                version: data.version,
            }
        } catch (error) {
            return { exists: false, error: error.message }
        }
    }, [currentRoomDetails?._id])

    // FIXED: Add function to get cache storage usage
    const getCacheStorageInfo = useCallback(() => {
        try {
            const keys = Object.keys(localStorage)
            const cacheKeys = keys.filter((key) => key.startsWith(CACHE_CONFIG.KEY_PREFIX))

            let totalSize = 0
            let totalMessages = 0

            cacheKeys.forEach((key) => {
                try {
                    const value = localStorage.getItem(key)
                    if (value) {
                        totalSize += value.length
                        const data = JSON.parse(value)
                        totalMessages += data.messages?.length || 0
                    }
                } catch (error) {
                    console.error(`Error reading cache key ${key}:`, error)
                }
            })

            return {
                totalCaches: cacheKeys.length,
                totalMessages,
                totalSizeBytes: totalSize,
                totalSizeKB: Math.round(totalSize / 1024),
                maxSizeKB: Math.round((CACHE_CONFIG.MAX_MESSAGES * 1000) / 1024), // Rough estimate
            }
        } catch (error) {
            return { error: error.message }
        }
    }, [])

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            messages,
            loading,
            hasMore,
            error,
            fetchMessages,
            addMessage,
            updateMessage,
            deleteMessage,
            editMessage,
            setMessages: setMessagesStable,
            // Cache utilities
            clearCurrentRoomCache,
            getCacheInfo,
            getCacheStorageInfo,
            cacheLoaded,
        }),
        [
            messages,
            loading,
            hasMore,
            error,
            fetchMessages,
            addMessage,
            updateMessage,
            deleteMessage,
            editMessage,
            setMessagesStable,
            clearCurrentRoomCache,
            getCacheInfo,
            getCacheStorageInfo,
            cacheLoaded,
        ],
    )

    return <MessageContext.Provider value={contextValue}>{children}</MessageContext.Provider>
}

export const useMessageContext = () => {
    const context = useContext(MessageContext)
    if (!context) {
        throw new Error("useMessageContext must be used within a MessageProvider")
    }
    return context
}

MessageProvider.propTypes = {
    children: PropTypes.node.isRequired,
}
