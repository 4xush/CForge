import React, { useState } from 'react';
import { useRoomContext } from '../../context/RoomContext';
import axios from 'axios';
import { Send } from 'lucide-react';

const MessageInput = ({ onMessageSent }) => {
    const { selectedRoom } = useRoomContext();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        if (!selectedRoom) return alert('No room selected!');

        setSending(true);
        try {
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
            setMessage('');
            if (onMessageSent) {
                onMessageSent(response.data.message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
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
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!selectedRoom || sending}
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
            </div>
        </div>
    );
};

export default MessageInput;