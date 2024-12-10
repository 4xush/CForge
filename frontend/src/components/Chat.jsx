import React, { useState, useEffect, useRef } from 'react';
import { useRoomContext } from '../context/RoomContext';
import { useAuthContext } from '../context/AuthContext';
import axios from 'axios';
import Message from './ui/Message';
import MessageInput from './Messages/MessageInput';
import ContextMenu from './ContextMenu';

const Chat = () => {
    const { selectedRoom } = useRoomContext();
    const { authUser } = useAuthContext();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
    const [editingMessageId, setEditingMessageId] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!selectedRoom) {
            setLoading(false);
            return;
        }
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('app-token');
                const response = await axios.get(
                    `http://localhost:5000/api/rooms/${selectedRoom._id}/messages`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                const fetchedMessages = response.data.messages.reverse();
                setMessages(fetchedMessages);
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, [selectedRoom]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleNewMessage = (newMessage) => {
        // Ensure the new message has the correct structure
        const formattedNewMessage = {
            ...newMessage,
            sender: {
                _id: authUser._id,
                username: authUser.username,
                profilePicture: authUser.profilePicture
            },
            createdAt: new Date().toISOString()
        };
        setMessages((prevMessages) => [...prevMessages, formattedNewMessage]);
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            const token = localStorage.getItem('app-token');
            await axios.delete(`http://localhost:5000/api/rooms/messages/${messageId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setMessages((prevMessages) =>
                prevMessages.filter(msg => msg._id !== messageId)
            );
            setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
        } catch (error) {
            console.error('Error deleting message:', error);
            alert(error.response?.data?.message || 'Failed to delete message');
        }
    };

    const handleEditMessage = async (messageId, newContent) => {
        try {
            const token = localStorage.getItem('app-token');
            const response = await axios.put(
                `http://localhost:5000/api/rooms/messages/${messageId}`,
                { content: newContent },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setMessages((prevMessages) =>
                prevMessages.map(msg =>
                    msg._id === messageId ? response.data.message : msg
                )
            );
            setEditingMessageId(null);
        } catch (error) {
            console.error('Error editing message:', error);
            alert(error.response?.data?.message || 'Failed to edit message');
        }
    };

    const canModifyMessage = (message) => {
        if (!authUser) return false;
        if (message.sender._id === authUser._id) return true;
        const isAdmin = selectedRoom.admins.some(
            (admin) => admin.toString() === authUser._id.toString()
        );
        return isAdmin;
    };

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

    if (!selectedRoom) {
        return <div>Please select a room to view messages</div>;
    }

    if (loading) {
        return <div>Loading messages...</div>;
    }

    return (
        <div className="flex flex-col h-full" onClick={closeContextMenu}>
            <div className="flex-grow overflow-y-auto p-2">
                {messages.length > 0 && (
                    <div className="text-center text-sm text-gray-500 my-2">Today</div>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg._id}
                        className="relative group"
                        onContextMenu={(e) => handleContextMenu(e, msg._id)}
                    >
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
                                time={new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                                message={msg.content}
                                isEdited={msg.isEdited}
                            />
                        )}
                    </div>
                ))}
                {messages.length === 0 && (
                    <div className="text-center text-gray-500">No messages yet</div>
                )}
                <div ref={messagesEndRef} />
            </div>
            {contextMenu.visible && (
                <div
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
            <MessageInput onMessageSent={handleNewMessage} />
        </div>
    );
};

export default Chat;
