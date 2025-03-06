import React, { useState, useEffect } from 'react';
import { useRoomContext } from '../../context/RoomContext';
import axios from 'axios';
import { Send, X } from 'lucide-react';
const API_URI = import.meta.env.VITE_API_URI;
const MessageInput = ({ onMessageSent, initialMessage = '', onCancel }) => {
    const { selectedRoom } = useRoomContext();
    const [message, setMessage] = useState(initialMessage);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        setMessage(initialMessage);
    }, [initialMessage]);

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        if (!selectedRoom && !initialMessage) return alert('No room selected!');
        setSending(true);
        try {
            if (initialMessage) {
                await onMessageSent(message);
            } else {
                const token = localStorage.getItem('app-token');
                const response = await axios.post(
                    `{API_URI}/rooms/${selectedRoom._id}/messages`,
                    { content: message },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                onMessageSent(response.data.message);
            }
            setMessage('');
        } catch (error) {
            console.error('Error sending/editing message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex items-center bg-[#25272E] p-2  rounded-md overflow-hidden focus-within:ring-2 ring-[#5A5FCF] transition-all duration-200">
            <input
                type="text"
                className="flex-grow px-4 py-2 text-[#DDE3F1] placeholder-[#A6B1C0] bg-transparent focus:outline-none font-mono text-sm"
                placeholder={initialMessage ? "Edit message..." : "Type a message..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={(!selectedRoom && !initialMessage) || sending}
            />
            <button
                className={`
                        p-2 mr-1
                        ${message.trim() && !sending
                        ? 'text-[#DDE3F1] hover:text-white hover:bg-[#333845]'
                        : 'text-gray-600'}
                        transition-colors duration-200
                        rounded-md
                    `}
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
            >
                <Send
                    size={16}
                    className={sending ? 'animate-pulse' : ''}
                />
            </button>
            {onCancel && (
                <button
                    className="p-2 mr-2 text-[#A6B1C0] hover:text-white hover:bg-[#333845] rounded-md transition-colors duration-200"
                    onClick={onCancel}
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

export default MessageInput;
