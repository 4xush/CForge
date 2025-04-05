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
import { AlertCircle, RefreshCw } from "lucide-react";
import { Spinner } from "../ui/Spinner";

const Chat = () => {
    const { selectedRoom } = useRoomContext();
    const { authUser } = useAuthContext();
    const { socket, joinRoom, leaveRoom } = useWebSocket();
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
    const messagesEndRef = useRef(null);
    const contextMenuRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const lastMessageCountRef = useRef(0);
    const isInitialLoadRef = useRef(true);

    // Fetch messages when room changes
    useEffect(() => {
        if (selectedRoom) {
            isInitialLoadRef.current = true;
            fetchMessages();
        }
    }, [selectedRoom?._id, fetchMessages]);

    // Join room when selected room changes - more stable implementation
    useEffect(() => {
        if (!selectedRoom?._id) return;

        console.log(`Attempting to join room ${selectedRoom._id}`);
        
        // Track if we've already joined to prevent duplicate joins
        let hasJoined = false;
        
        // Join immediately if possible
        if (socket?.connected) {
            joinRoom(selectedRoom._id);
            hasJoined = true;
        }
        
        // Create a more stable interval with controlled execution
        let attempts = 0;
        const MAX_ATTEMPTS = 5;
        const RETRY_INTERVAL = 5000; // 5 seconds
        
        const intervalId = setInterval(() => {
            if (socket?.connected && !hasJoined && attempts < MAX_ATTEMPTS) {
                console.log(`Retry ${attempts + 1}/${MAX_ATTEMPTS}: Joining room ${selectedRoom._id}`);
                joinRoom(selectedRoom._id);
                hasJoined = true;
            } else if (attempts >= MAX_ATTEMPTS && !hasJoined) {
                console.warn(`Failed to join room ${selectedRoom._id} after ${MAX_ATTEMPTS} attempts`);
                clearInterval(intervalId);
            }
            attempts++;
        }, RETRY_INTERVAL);
        
        return () => {
            console.log(`Cleanup: leaving room ${selectedRoom._id}`);
            clearInterval(intervalId);
            if (hasJoined) {
                leaveRoom(selectedRoom._id);
            }
        };
    }, [selectedRoom?._id, joinRoom, leaveRoom, socket]);

    // Listen for real-time messages
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            console.log('Received WebSocket message:', message);
            
            // Check if this message is replacing a temporary one
            const isReplacingTemp = messages.some(msg => 
                msg.isTemporary && 
                msg.content === message.content && 
                msg.sender._id.toString() === message.sender._id.toString()
            );

            if (isReplacingTemp) {
                console.log('Replacing temporary message with server message');
                
                // Replace temporary message with the real one from server
                setMessages(prevMessages => prevMessages.map(msg => 
                    (msg.isTemporary && 
                     msg.content === message.content && 
                     msg.sender._id.toString() === message.sender._id.toString()) 
                        ? message 
                        : msg
                ));
            } else {
                console.log('Adding new message from another user');
                // Add new message from another user
                addMessage(message);
            }
        };

        socket.on('receive_message', handleNewMessage);

        return () => {
            socket.off('receive_message', handleNewMessage);
        };
    }, [socket, addMessage, messages, setMessages]);

    // Smart scroll management
    useEffect(() => {
        if (!messagesContainerRef.current || messages.length === 0) return;
        
        const container = messagesContainerRef.current;
        const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 100;
        const messageCountIncreased = messages.length > lastMessageCountRef.current;
        
        if (isInitialLoadRef.current || (isScrolledToBottom && messageCountIncreased)) {
            messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior });
            isInitialLoadRef.current = false;
        }
        
        lastMessageCountRef.current = messages.length;
    }, [messages, scrollBehavior]);

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
        setScrollBehavior("auto"); // Disable smooth scrolling during loading to maintain position
        
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

    // Handle context menu
    const handleContextMenu = useCallback((e, messageId) => {
        e.preventDefault();
        const message = messages.find((msg) => msg._id === messageId);
        if (canModifyMessage(message)) {
            setContextMenu({
                visible: true,
                x: Math.min(e.clientX, window.innerWidth - 200), // Prevent menu from going off-screen
                y: Math.min(e.clientY, window.innerHeight - 150),
                messageId,
            });
        }
    }, [messages]);

    // Close context menu
    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    };

    // Check if user can modify message
    const canModifyMessage = useCallback((message) => {
        if (!authUser || !message) return false;
        if (message.sender._id === authUser._id) return true;
        return selectedRoom?.admins?.some((admin) => admin.toString() === authUser._id.toString());
    }, [authUser, selectedRoom]);

    // Handle message deletion
    const handleDeleteMessage = async (messageId) => {
        try {
            await deleteMessage(messageId);
            closeContextMenu();
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    // Handle message editing
    const handleEditMessage = async (messageId, newContent) => {
        try {
            await editMessage(messageId, newContent);
            setEditingMessage(null);
        } catch (error) {
            console.error("Edit error:", error);
        }
    };

    // Start editing message
    const startEditing = (message) => {
        setEditingMessage(message);
        closeContextMenu();
    };

    // Cancel editing
    const cancelEditing = () => setEditingMessage(null);

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
        if (selectedRoom) {
            fetchMessages();
        }
    };

    // Render loading state
    if (!selectedRoom) {
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
                <Spinner size="large" />
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
        <div className="flex flex-col h-full">
            <div 
                ref={messagesContainerRef}
                className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
            >
                {hasMore && (
                    <div className="text-center py-2">
                        <button
                            onClick={loadOlderMessages}
                            disabled={loadingMore}
                            className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 transition-colors duration-200 flex items-center justify-center mx-auto"
                        >
                            {loadingMore ? (
                                <>
                                    <Spinner size="small" className="mr-2" />
                                    Loading...
                                </>
                            ) : (
                                "Load older messages"
                            )}
                        </button>
                    </div>
                )}

                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                        <div className="text-center text-xs text-gray-500 my-2 sticky top-0 bg-gray-900/80 backdrop-blur-sm py-1">
                            {date}
                        </div>
                        {msgs.map((msg) => (
                            <div key={`${msg._id}-${msg.isEdited ? 'edited' : 'original'}`} className="relative group">
                                {editingMessage?._id === msg._id ? (
                                    <div className="px-4 py-2">
                                        <MessageInput
                                            initialMessage={msg.content}
                                            onMessageSent={(content) => handleEditMessage(msg._id, content)}
                                            onCancel={cancelEditing}
                                            isEditing={true}
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
                                        onDelete={() => handleDeleteMessage(msg._id)}
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
                        onDelete={() => handleDeleteMessage(contextMenu.messageId)}
                        onCancel={closeContextMenu}
                    />
                </div>
            )}

            <div className="px-4 py-2">
                <MessageInput 
                    onMessageSent={addMessage} 
                    disabled={!selectedRoom} 
                />
            </div>

            {/* User Profile Modal */}
            <PublicUserProfileModal
                username={profileModal.username}
                isOpen={profileModal.isOpen}
                onClose={closeProfileModal}
            />
        </div>
    );
};

export default Chat;