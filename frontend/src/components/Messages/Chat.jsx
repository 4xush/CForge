import React, { useEffect, useRef } from 'react';
import { useRoomContext } from '../../context/RoomContext';
import { useAuthContext } from '../../context/AuthContext';
import { useMessageContext } from '../../context/MessageContext';
import Message from '../ui/Message';
import MessageInput from './MessageInput';
import ContextMenu from './ChatContextMenu';
import { format, isToday, isYesterday, isSameYear } from 'date-fns';

const Chat = () => {
    const { selectedRoom } = useRoomContext();
    const { authUser } = useAuthContext();
    const {
        messages,
        loading,
        fetchMessages,
        addMessage,
        deleteMessage,
        editMessage
    } = useMessageContext();

    const [contextMenu, setContextMenu] = React.useState({
        visible: false,
        x: 0,
        y: 0,
        messageId: null
    });
    const [editingMessageId, setEditingMessageId] = React.useState(null);
    const messagesEndRef = useRef(null);
    const contextMenuRef = useRef(null);

    // Fetch messages when room changes
    useEffect(() => {
        if (selectedRoom) {
            fetchMessages();
        }
    }, [selectedRoom, fetchMessages]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Click outside handler for context menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                contextMenuRef.current &&
                !contextMenuRef.current.contains(event.target)
            ) {
                closeContextMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleContextMenu = (e, messageId) => {
        e.preventDefault();
        const message = messages.find(msg => msg._id === messageId);
        if (canModifyMessage(message)) {
            setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                messageId: messageId
            });
        }
    };

    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    };

    const canModifyMessage = (message) => {
        if (!authUser) return false;
        if (message.sender._id === authUser._id) return true;
        const isAdmin = selectedRoom.admins.some(
            (admin) => admin.toString() === authUser._id.toString()
        );
        return isAdmin;
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await deleteMessage(messageId);
            closeContextMenu();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete message');
        }
    };

    const handleEditMessage = async (messageId, newContent) => {
        try {
            await editMessage(messageId, newContent);
            setEditingMessageId(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to edit message');
        }
    };

    const formatMessageDate = (date) => {
        const messageDate = new Date(date);
        if (isToday(messageDate)) return 'Today';
        if (isYesterday(messageDate)) return 'Yesterday';
        if (isSameYear(messageDate, new Date())) return format(messageDate, 'MMMM d');
        return format(messageDate, 'MMMM d, yyyy');
    };

    const groupMessagesByDate = (messages) => {
        const groups = {};
        messages.forEach(message => {
            const date = formatMessageDate(message.createdAt);
            if (!groups[date]) groups[date] = [];
            groups[date].push(message);
        });
        return groups;
    };

    if (!selectedRoom) {
        return <div>Please select a room to view messages</div>;
    }

    if (loading) {
        return <div>Loading messages...</div>;
    }

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto">
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                        <div className="text-center text-sm text-gray-500 my-2">{date}</div>
                        {msgs.map((msg) => (
                            <div key={msg._id} className="relative group">
                                {editingMessageId === msg._id ? (
                                    <MessageInput
                                        initialMessage={msg.content}
                                        onMessageSent={(newContent) => handleEditMessage(msg._id, newContent)}
                                        onCancel={() => setEditingMessageId(null)}
                                    />
                                ) : (
                                    <Message
                                        avatar={
                                            msg.sender.profilePicture ||
                                            `https://avatar.iran.liara.run/username?username=${msg.sender.username}`
                                        }
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
                    <div className="text-center text-gray-500">No messages yet</div>
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
                            setEditingMessageId(contextMenu.messageId);
                            closeContextMenu();
                        }}
                        onDelete={() => handleDeleteMessage(contextMenu.messageId)}
                        onCancel={closeContextMenu}
                    />
                </div>
            )}
            <MessageInput onMessageSent={addMessage} />
        </div>
    );
};

export default Chat;