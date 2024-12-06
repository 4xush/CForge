import React, { useState, useEffect, useRef } from 'react';
import { useRoomContext } from '../context/RoomContext';
import axios from 'axios';
import Message from './ui/Message';
import MessageInput from './Messages/MessageInput';

const Chat = () => {
    const { selectedRoom } = useRoomContext();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Scroll to bottom function
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

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleNewMessage = (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    if (!selectedRoom) {
        return <div>Please select a room to view messages</div>;
    }

    if (loading) {
        return <div>Loading messages...</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto p-2">
                {messages.length > 0 && (
                    <div className="text-center text-sm text-gray-500 my-2">Today</div>
                )}
                {messages.map((msg) => (
                    <Message
                        key={msg._id}
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
                    />
                ))}
                {messages.length === 0 && (
                    <div className="text-center text-gray-500">No messages yet</div>
                )}
                {/* Invisible div to scroll to */}
                <div ref={messagesEndRef} />
            </div>
            <MessageInput onMessageSent={handleNewMessage} />
        </div>
    );
};

export default Chat;