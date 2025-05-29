import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useEffect,
} from "react";
import api from "../services/ApiService.js";
import { useAuthContext } from "./AuthContext";
import { useRoomContext } from "./RoomContext";
import { useWebSocket } from "./WebSocketContext";

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const [isTyping, setIsTyping] = useState({});
    const { authUser } = useAuthContext();
    const { currentRoomDetails } = useRoomContext();
    const { socket, isConnected } = useWebSocket();
    const fetchIdRef = useRef(0);

    const fetchMessages = useCallback(async (lastMessageId = null) => {
        if (!currentRoomDetails) return;
        setLoading(true);
        setError(null);

        const currentFetchId = ++fetchIdRef.current;

        try {
            const query = lastMessageId ? `?lastMessageId=${lastMessageId}&limit=50` : "?limit=50";
            const response = await api.get(`/rooms/${currentRoomDetails._id}/messages${query}`);

            if (currentFetchId === fetchIdRef.current) {
                setMessages((prevMessages) => {
                    const newMessages = response.data.messages;

                    if (!lastMessageId) {
                        return [...newMessages].reverse();
                    } else {
                        const uniqueNewMessages = [...newMessages]
                            .reverse()
                            .filter(
                                (newMsg) =>
                                    !prevMessages.some((prevMsg) => prevMsg._id === newMsg._id)
                            );
                        return [...uniqueNewMessages, ...prevMessages];
                    }
                });

                setHasMore(response.data.hasMore);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            setError(error.response?.data?.message || "Failed to load messages");
        } finally {
            if (currentFetchId === fetchIdRef.current) {
                setLoading(false);
            }
        }
    }, [currentRoomDetails]);

    const addMessage = useCallback(
        (newMessage) => {
            if (newMessage.sender && typeof newMessage.sender === "object") {
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
            ]);
        },
        [authUser]
    );

    const updateMessage = useCallback((messageId, newContent) => {
        setMessages(prevMessages =>
            prevMessages.map(msg =>
                msg._id === messageId
                    ? { ...msg, content: newContent, isEdited: true, editedAt: new Date() }
                    : msg
            )
        );
    }, []);

    const deleteMessage = useCallback(async (messageId) => {
        try {
            await api.delete(`/rooms/messages/${messageId}`);
            setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
        } catch (error) {
            console.error("Error deleting message:", error);
            throw error;
        }
    }, []);

    const editMessage = useCallback(async (messageId, newContent) => {
        try {
            if (!currentRoomDetails) {
                throw new Error('No active room');
            }

            // Check if this is a temporary message
            if (messageId.startsWith('temp-')) {
                // For temporary messages, just update the local state
                setMessages(prevMessages => 
                    prevMessages.map(msg => 
                        msg._id === messageId 
                            ? { 
                                ...msg, 
                                content: newContent, 
                                isEdited: true, 
                                editedAt: new Date().toISOString()
                            }
                            : msg
                    )
                );
                return;
            }

            // Store original message for rollback if needed
            const originalMessage = messages.find(msg => msg._id === messageId);
            if (!originalMessage) {
                throw new Error('Message not found');
            }

            // First update optimistically in the UI
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg._id === messageId 
                        ? { 
                            ...msg, 
                            content: newContent, 
                            isEdited: true, 
                            editedAt: new Date().toISOString(),
                            originalContent: msg.content // Store original content for rollback
                        }
                        : msg
                )
            );

            // Then send the update through WebSocket
            if (socket) {
                socket.emit('edit_message', {
                    roomId: currentRoomDetails._id,
                    messageId,
                    newContent
                });
            } else {
                // Fallback to REST API if WebSocket is not available
                const response = await api.put(`/rooms/messages/${messageId}`, { content: newContent });
                setMessages(prevMessages => 
                    prevMessages.map(msg => 
                        msg._id === messageId ? response.data.message : msg
                    )
                );
            }
        } catch (error) {
            console.error("Error editing message:", error);
            // Revert the optimistic update on error
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg._id === messageId 
                        ? { 
                            ...msg, 
                            content: msg.originalContent || msg.content,
                            isEdited: false,
                            editedAt: null
                        }
                        : msg
                )
            );
            throw error;
        }
    }, [currentRoomDetails, socket, messages]);

    const handleTypingStart = useCallback((userId) => {
        setIsTyping((prev) => ({ ...prev, [userId]: true }));

        setTimeout(() => {
            setIsTyping((prev) => ({ ...prev, [userId]: false }));
        }, 3000);
    }, []);

    // Replace the entire message_updated handler
    const handleMessageUpdated = useCallback((updatedMessage) => {
        setMessages(prevMessages => 
            prevMessages.map(msg => 
                msg._id === updatedMessage._id ? {
                    ...updatedMessage,
                    content: updatedMessage.content,
                    isEdited: true,
                    editedAt: updatedMessage.editedAt || new Date().toISOString()
                } : msg
            )
        );
    }, []);

    const handleMessageError = useCallback(({ error, messageId }) => {
        console.error('Message edit error:', error);
        // Revert the optimistic update
        setMessages(prevMessages =>
            prevMessages.map(msg =>
                msg._id === messageId
                    ? { 
                        ...msg,
                        content: msg.originalContent || msg.content,
                        isEdited: false,
                        editedAt: null
                    }
                    : msg
            )
        );
    }, []);

    // Add this effect for proper cleanup
    useEffect(() => {
        if (!socket) return;
        
        socket.on('message_updated', handleMessageUpdated);
        
        return () => {
            socket.off('message_updated', handleMessageUpdated);
        };
    }, [socket, handleMessageUpdated]);

    // Socket listener for message errors
    useEffect(() => {
        if (!socket) return;

        socket.on('message_error', handleMessageError);

        return () => {
            socket.off('message_error', handleMessageError);
        };
    }, [socket, handleMessageError]);

    // Add logic to handle state synchronization on reconnect
    useEffect(() => {
        if (isConnected && currentRoomDetails) {
            // When connected and in a room, potentially re-fetch messages
            // A simple approach is to re-fetch the latest messages
            // More advanced would be to fetch messages since the last known message ID
            console.log('WebSocket reconnected, refetching messages for room:', currentRoomDetails._id);
            fetchMessages();
        }
    }, [isConnected, currentRoomDetails, fetchMessages]); // Depend on isConnected, currentRoomDetails, and fetchMessages

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
                handleTypingStart,
            }}
        >
            {children}
        </MessageContext.Provider>
    );
};

export const useMessageContext = () => {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error("useMessageContext must be used within a MessageProvider");
    }
    return context;
};