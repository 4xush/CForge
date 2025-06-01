import { useEffect, useRef, useState, useCallback } from "react";
import { useRoomContext } from "../../context/RoomContext";
import { useAuthContext } from "../../context/AuthContext";
import { useMessageContext } from "../../context/MessageContext";
import { useWebSocket } from "../../context/WebSocketContext";
import Message from "./ui/Message";
import MessageInput from "./MessageInput";
import ContextMenu from "./ChatContextMenu";
import PublicUserProfileModal from "../../components/PublicUserProfileModal";
import { format, isToday, isYesterday, isSameYear } from "date-fns";
import { AlertCircle, RefreshCw, ChevronDown } from "lucide-react";
import { Spinner } from "../ui/Spinner";
import toast from 'react-hot-toast';

const Chat = () => {
    const { currentRoomDetails } = useRoomContext();
    const { authUser } = useAuthContext();
    const { socket, connected, addEventListener, removeEventListener } = useWebSocket();
    const {
        messages,
        loading,
        hasMore,
        error,
        fetchMessages,
        addMessage,
        deleteMessage,
        editMessage,
        setMessages
    } = useMessageContext();

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
    const [editingMessage, setEditingMessage] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [profileModal, setProfileModal] = useState({ isOpen: false, username: null });
    const [scrollBehavior, setScrollBehavior] = useState("smooth");
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const messagesEndRef = useRef(null);
    const contextMenuRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const lastMessageCountRef = useRef(0);
    const isInitialLoadRef = useRef(true);
    const lastScrollPositionRef = useRef(0);
    const observerRef = useRef(null);

    // Fetch messages when room changes
    useEffect(() => {
        if (currentRoomDetails) {
            isInitialLoadRef.current = true;
            fetchMessages();
        }
    }, [currentRoomDetails, currentRoomDetails?._id, fetchMessages]);

    // Room joining is now handled by the ChatManager component in ChatWithWebSocket.jsx
    // Listen for real-time messages
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            console.log('Received new message:', message._id);
            
            setMessages(prevMessages => {
                // Check if this message already exists (prevent duplicates)
                const existsById = prevMessages.some(msg => msg._id === message._id);
                if (existsById) {
                    console.log('Ignoring duplicate message:', message._id);
                    return prevMessages;
                }
                
                // Check if this is replacing a temporary message
                const tempIndex = prevMessages.findIndex(msg =>
                    msg.isTemporary &&
                    msg.content === message.content &&
                    msg.sender._id.toString() === message.sender._id.toString() &&
                    Math.abs(new Date(msg.createdAt).getTime() - new Date(message.createdAt).getTime()) < 10000 // Within 10 seconds
                );

                if (tempIndex !== -1) {
                    console.log('Replacing temporary message with confirmed message');
                    const newMessages = [...prevMessages];
                    newMessages[tempIndex] = { ...message, isTemporary: false };
                    return newMessages;
                } else {
                    console.log('Adding new message to state:', message._id);
                    return [...prevMessages, message];
                }
            });
        };

        const handleMessageSent = (data) => {
            console.log('Message sent confirmation:', data);
            // You could update the UI here to show the message was delivered
            if (data.messageId) {
                toast.success('Message sent successfully', { duration: 1000 });
            }
        };
        
        const handleMessageError = (error) => {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again.');
        };
        
        console.log('Setting up real-time message listeners');
        
        // Use addEventListener from our context
        addEventListener('receive_message', handleNewMessage);
        addEventListener('message_sent', handleMessageSent);
        addEventListener('message_error', handleMessageError);

        return () => {
            console.log('Cleaning up real-time message listeners');
            // Clean up event listeners
            removeEventListener('receive_message', handleNewMessage);
            removeEventListener('message_sent', handleMessageSent);
            removeEventListener('message_error', handleMessageError);
        };
    }, [socket, addMessage, messages, setMessages, addEventListener, removeEventListener]);

    // Scroll position handler
    const handleScroll = useCallback(() => {
        if (!messagesContainerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const scrollPosition = scrollHeight - scrollTop - clientHeight;
        const isBottom = scrollPosition < 100;

        setShowScrollButton(!isBottom);
        setIsNearBottom(isBottom);

        if (!isBottom && scrollTop < lastScrollPositionRef.current) {
            setUnreadCount(prev => prev + 1);
        }

        lastScrollPositionRef.current = scrollTop;
    }, []);

    // Scroll to bottom
    const scrollToBottom = useCallback((behavior = "smooth") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
            setUnreadCount(0);
            setShowScrollButton(false);
        }
    }, []);

    // Intersection Observer for load more trigger
    useEffect(() => {
        if (!messagesContainerRef.current) return;

        const options = {
            root: messagesContainerRef.current,
            threshold: 0.1,
        };

        const handleIntersect = (entries) => {
            if (entries[0].isIntersecting && hasMore && !loadingMore) {
                loadOlderMessages();
            }
        };

        observerRef.current = new IntersectionObserver(handleIntersect, options);

        const firstMessage = messagesContainerRef.current.firstElementChild;
        if (firstMessage) {
            observerRef.current.observe(firstMessage);
        }

        return () => observerRef.current?.disconnect();
    }, [hasMore, loadingMore, messages]);

    // Auto-scroll handling
    useEffect(() => {
        if (!messagesContainerRef.current) return;

        const shouldAutoScroll = isNearBottom || isInitialLoadRef.current;

        if (shouldAutoScroll) {
            scrollToBottom(isInitialLoadRef.current ? "auto" : "smooth");
            isInitialLoadRef.current = false;
        } else if (!loadingMore) {
            setUnreadCount(prev => prev + 1);
        }

        const container = messagesContainerRef.current;
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [messages, isNearBottom, loadingMore, handleScroll, scrollToBottom]);

    // Handle click outside context menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                closeContextMenu();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Load older messages
    const loadOlderMessages = async () => {
        if (!hasMore || loadingMore || !messages.length) return;

        setLoadingMore(true);
        setScrollBehavior("auto");

        try {
            const oldestMessage = messages[0];
            await fetchMessages(oldestMessage._id);
        } catch (error) {
            console.error("Error loading older messages:", error);
        } finally {
            setLoadingMore(false);
            setScrollBehavior("smooth");
        }
    };

    // Check if user can modify message
    const canModifyMessage = useCallback((message) => {
        if (!authUser || !message) return false;
        if (message.sender._id === authUser._id) return true;
        return currentRoomDetails?.admins?.some((admin) => admin.toString() === authUser._id.toString());
    }, [authUser, currentRoomDetails]);

    // Handle context menu
    const handleContextMenu = useCallback((e, messageId) => {
        e.preventDefault();
        const message = messages.find((msg) => msg._id === messageId);
        if (canModifyMessage(message)) {
            setContextMenu({
                visible: true,
                x: Math.min(e.clientX, window.innerWidth - 200),
                y: Math.min(e.clientY, window.innerHeight - 150),
                messageId,
            });
        }
    }, [messages, canModifyMessage]);

    // Close context menu
    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    };

    // Handle message deletion
    // const handleDeleteMessage = async (messageId) => {
    //     try {
    //         await deleteMessage(messageId);
    //         closeContextMenu();
    //     } catch (error) {
    //         console.error("Delete error:", error);
    //     }
    // };

    // Handle message editing
    const handleEditMessage = async (messageId, newContent) => {
        try {
            // Try to edit via WebSocket for real-time updates
            if (connected && currentRoomDetails) {
                console.log(`Editing message ${messageId} via WebSocket`);
                
                // Optimistically update the UI
                setMessages(prevMessages => prevMessages.map(msg => 
                    msg._id === messageId 
                        ? {
                            ...msg,
                            content: newContent,
                            isEdited: true,
                            editedAt: new Date().toISOString()
                          } 
                        : msg
                ));
                
                // Send the edit through WebSocket
                editMessage(messageId, newContent);
                
                // Also update via API for persistence
                try {
                    await editMessage(messageId, newContent);
                } catch (apiError) {
                    console.error("API edit error:", apiError);
                    // WebSocket should still work even if API fails
                }
            } else {
                // If WebSocket is not connected, use only REST API
                console.log(`Editing message ${messageId} via REST API only`);
                await editMessage(messageId, newContent);
            }
            
            setEditingMessage(null);
        } catch (error) {
            console.error("Edit error:", error);
            toast.error(error.message || 'Failed to edit message');
        }
    };

    // Start editing message
    const startEditing = (message) => {
        setEditingMessage(message);
        closeContextMenu();
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingMessage(null);
        closeContextMenu();
    };

    // Listen for message updates
    useEffect(() => {
        if (!socket) return;

        const handleMessageUpdated = (updatedMessage) => {
            console.log('Message updated event received:', updatedMessage._id);
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg._id === updatedMessage._id
                        ? {
                            ...msg,
                            content: updatedMessage.content,
                            isEdited: true,
                            editedAt: updatedMessage.editedAt
                        }
                        : msg
                )
            );
            // Notify the user about the update if it's not their own message
            if (updatedMessage.sender._id !== authUser._id) {
                toast('A message was edited', { duration: 2000 });
            }
        };
        
        const handleEditSuccess = (data) => {
            console.log('Message edited successfully:', data);
            if (data.messageId) {
                toast.success('Message edited successfully', { duration: 1000 });
            }
        };
        
        console.log('Setting up message update listeners');
        
        addEventListener('message_updated', handleMessageUpdated);
        addEventListener('edit_success', handleEditSuccess);

        return () => {
            console.log('Cleaning up message update listeners');
            removeEventListener('message_updated', handleMessageUpdated);
            removeEventListener('edit_success', handleEditSuccess);
        };
    }, [socket, setMessages, addEventListener, removeEventListener, authUser]);

    // Format message date
    const formatMessageDate = (date) => {
        const messageDate = new Date(date);
        if (isToday(messageDate)) return "Today";
        if (isYesterday(messageDate)) return "Yesterday";
        if (isSameYear(messageDate, new Date())) return format(messageDate, "MMMM d");
        return format(messageDate, "MMMM d, yyyy");
    };

    // Handle avatar click
    const handleAvatarClick = (username) => {
        setProfileModal({
            isOpen: true,
            username: username
        });
    };

    // Close profile modal
    const closeProfileModal = () => {
        setProfileModal({ isOpen: false, username: null });
    };

    // Retry loading messages
    const handleRetry = () => {
        if (currentRoomDetails) {
            fetchMessages();
        }
    };

    // Render loading state
    if (!currentRoomDetails) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-gray-500">
                <p>Select a room to view messages</p>
            </div>
        );
    }

    // Render error state
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
        );
    }

    // Render loading state
    if (loading && !loadingMore && messages.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <Spinner size="lg" />
                <p className="text-gray-500 mt-4">Loading messages...</p>
            </div>
        );
    }

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatMessageDate(message.createdAt);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    return (
        <div className="flex flex-col h-full relative">
            <div
                ref={messagesContainerRef}
                className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
            >
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
                        {msgs.map((msg, index) => (
                            <div key={`${msg._id || msg.tempId || `temp-${index}`}-${msg.isEdited ? 'edited' : 'original'}-${msg.editedAt || msg.createdAt}`} className="relative group">
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
                                            `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(msg.sender.username)}`
                                        }
                                        senderName={msg.sender.username}
                                        time={format(new Date(msg.createdAt), "HH:mm")}
                                        message={msg.content}
                                        isEdited={msg.isEdited}
                                        isCurrentUser={msg.sender._id === authUser?._id}
                                        canModify={canModifyMessage(msg)}
                                        onContextMenu={(e) => handleContextMenu(e, msg._id)}
                                        onAvatarClick={() => handleAvatarClick(msg.sender.username)}
                                        onEdit={() => startEditing(msg)}
                                        // onDelete={() => handleDeleteMessage(msg._id)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                        <div className="bg-gray-800/50 rounded-lg p-6 text-center max-w-md">
                            <h3 className="text-lg font-medium text-gray-300 mb-2">No messages yet</h3>
                            <p className="text-gray-500">
                                Be the first to start a conversation in this room!
                            </p>
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
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </button>
            )}

            <div className="px-4 py-2 border-t border-gray-800">
                <MessageInput
                    onMessageSent={(message) => {
                        // Only add temporary message if connected, otherwise just send
                        if (connected) {
                            // Add message optimistically with temporary ID and status
                            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                            const tempMessage = {
                                ...message,
                                isTemporary: true,
                                _id: tempId,
                                tempId: tempId,
                                createdAt: new Date().toISOString(),
                                sender: {
                                    _id: authUser._id,
                                    username: authUser.username,
                                    profilePicture: authUser.profilePicture,
                                }
                            };
                            
                            console.log('Adding temporary message while sending:', tempId);
                            
                            // Use setMessages directly to avoid double-adding through context
                            setMessages(prevMessages => {
                                // Check if we already have a similar temporary message
                                const hasSimilarTemp = prevMessages.some(msg => 
                                    msg.isTemporary && 
                                    msg.content === message.content &&
                                    msg.sender._id === authUser._id &&
                                    Math.abs(new Date().getTime() - new Date(msg.createdAt).getTime()) < 5000
                                );
                                
                                if (hasSimilarTemp) {
                                    console.log('Similar temporary message already exists, not adding duplicate');
                                    return prevMessages;
                                }
                                
                                return [...prevMessages, tempMessage];
                            });
                            
                            scrollToBottom();
                        } else {
                            toast('Trying to reconnect...', { id: 'connection-toast' });
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
                            const messageToEdit = messages.find((m) => m._id === contextMenu.messageId);
                            startEditing(messageToEdit);
                        }}
                        // onDelete={() => handleDeleteMessage(contextMenu.messageId)}
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
    );
};

export default Chat;