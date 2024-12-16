import React, { useState, useEffect } from 'react';
import { useRoomContext } from '../../context/RoomContext';
import { useAuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { Send, X } from 'lucide-react';

const MessageInput = ({ onMessageSent, initialMessage = '', onCancel }) => {
    const { selectedRoom } = useRoomContext();
    const { authUser } = useAuthContext();
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
                // Editing existing message
                await onMessageSent(message);
            } else {
                // Sending new message
                const token = localStorage.getItem('app-token');
                const response = await axios.post(
                    `http://localhost:5000/api/rooms/${selectedRoom._id}/messages`,
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
        <div className="bg-gray-100 rounded-xl border-t border-gray-200 shadow-sm">
            <div className="flex items-center bg-gray-800 rounded-xl overflow-hidden ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-300">
                <input
                    type="text"
                    className="flex-grow p-3 text-white placeholder-gray-400 bg-transparent focus:outline-none"
                    placeholder={initialMessage ? "Edit your message..." : "Type your message..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={(!selectedRoom && !initialMessage) || sending}
                />
                <button
                    className={`
                        p-3
                        ${message.trim() && !sending
                            ? 'text-blue-600 hover:bg-blue-50 active:bg-blue-100'
                            : 'text-gray-400'}
                        transition-colors duration-200
                        flex items-center justify-center
                    `}
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sending}
                >
                    <Send
                        size={20}
                        strokeWidth={2}
                        className={sending ? 'animate-pulse' : ''}
                    />
                </button>
                {onCancel && (
                    <button
                        className="p-3 text-gray-400 hover:bg-red-50 active:bg-red-100 transition-colors duration-200"
                        onClick={onCancel}
                    >
                        <X size={20} strokeWidth={2} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default MessageInput;

