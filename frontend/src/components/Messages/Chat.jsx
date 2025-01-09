import React, { useEffect, useRef, useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { useMessageContext } from '../../context/MessageContext';
import Message from './ui/Message';
import MessageInput from './MessageInput';
import ContextMenu from './ChatContextMenu';
import { format, isToday, isYesterday, isSameYear } from 'date-fns';
import ApiService from '../../services/api';

const Chat = ({ roomId }) => {
    const { authUser } = useAuthContext();
    const {
        messages,
        loading,
        fetchMessages,
        addMessage,
        deleteMessage,
        editMessage
    } = useMessageContext();

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
    const [editingMessage, setEditingMessage] = useState(null);
    const [roomDetails, setRoomDetails] = useState(null);
    const messagesEndRef = useRef(null);
    const contextMenuRef = useRef(null);

    // Fetch room details
    useEffect(() => {
        const fetchRoomDetails = async () => {
            if (!roomId) return;
            try {
                const response = await ApiService.get(`/rooms/${roomId}`);
                setRoomDetails(response.data);
            } catch (error) {
                console.error('Failed to fetch room details:', error);
            }
        };

        fetchRoomDetails();
    }, [roomId]);

    useEffect(() => {
        if (roomId) fetchMessages(roomId); // Update to pass roomId
    }, [roomId, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                closeContextMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleContextMenu = (e, messageId) => {
        e.preventDefault();
        const message = messages.find(msg => msg._id === messageId);
        if (canModifyMessage(message)) {
            setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                messageId
            });
        }
    };

    const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, messageId: null });

    const canModifyMessage = (message) => {
        if (!authUser || !roomDetails) return false;
        if (message.sender._id === authUser._id) return true;
        return roomDetails.admins.some(admin => admin.toString() === authUser._id.toString());
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await deleteMessage(messageId, roomId); // Update to pass roomId
            closeContextMenu();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleEditMessage = async (messageId, newContent) => {
        try {
            await editMessage(messageId, newContent, roomId); // Update to pass roomId
            setEditingMessage(null);
        } catch (error) {
            console.error('Edit error:', error);
        }
    };

    const handleSendMessage = async (content) => {
        try {
            await addMessage(content, roomId); // Update to pass roomId
        } catch (error) {
            console.error('Send error:', error);
        }
    };

    const startEditing = (message) => {
        setEditingMessage(message);
        closeContextMenu();
    };

    const cancelEditing = () => setEditingMessage(null);

    const formatMessageDate = (date) => {
        const messageDate = new Date(date);
        if (isToday(messageDate)) return 'Today';
        if (isYesterday(messageDate)) return 'Yesterday';
        if (isSameYear(messageDate, new Date())) return format(messageDate, 'MMMM d');
        return format(messageDate, 'MMMM d, yyyy');
    };

    if (!roomId) return <div className="text-center text-gray-500 mt-4">No room selected</div>;
    if (loading) return <div className="text-center text-gray-500 mt-4">Loading messages...</div>;

    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatMessageDate(message.createdAt);
        (groups[date] = groups[date] || []).push(message);
        return groups;
    }, {});

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto">
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                        <div className="text-center text-xs text-gray-500 my-2">{date}</div>
                        {msgs.map((msg) => (
                            <div key={msg._id} className="relative group">
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
                                        avatar={msg.sender.profilePicture ||
                                            `https://avatar.iran.liara.run/username?username=${msg.sender.username}`}
                                        senderName={msg.sender.username}
                                        time={format(new Date(msg.createdAt), 'HH:mm')}
                                        message={msg.content}
                                        isEdited={msg.isEdited}
                                        onContextMenu={(e) => handleContextMenu(e, msg._id)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-4">No messages yet</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {contextMenu.visible && (
                <div
                    ref={contextMenuRef}
                    style={{
                        position: 'fixed',
                        top: `${contextMenu.y}px`,
                        left: `${contextMenu.x}px`,
                    }}
                >
                    <ContextMenu
                        onEdit={() => {
                            const messageToEdit = messages.find(m => m._id === contextMenu.messageId);
                            startEditing(messageToEdit);
                        }}
                        onDelete={() => handleDeleteMessage(contextMenu.messageId)}
                        onCancel={closeContextMenu}
                    />
                </div>
            )}

            <div className="px-4 py-2">
                <MessageInput onMessageSent={handleSendMessage} />
            </div>
        </div>
    );
};

export default Chat;