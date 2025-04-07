import { useState, useEffect } from 'react';
import { useRoomContext } from '../../context/RoomContext';
import { useAuthContext } from '../../context/AuthContext';
import { useMessageContext } from '../../context/MessageContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { toast } from 'react-hot-toast';
import { Send, X, WifiOff } from 'lucide-react';
import PropTypes from 'prop-types';

const MessageInput = ({ initialMessage = '', onCancel }) => {
    const { selectedRoom } = useRoomContext();
    const { authUser } = useAuthContext();
    const { socket, sendMessage, connected } = useWebSocket();
    const { addMessage } = useMessageContext();
    const [message, setMessage] = useState(initialMessage);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        setMessage(initialMessage);
    }, [initialMessage]);

    // Listen for message errors
    useEffect(() => {
        if (!socket) return;

        const handleMessageError = (data) => {
            toast.error(data.error || 'Failed to send message');
            setSending(false);
        };

        socket.on('message_error', handleMessageError);

        return () => {
            socket.off('message_error', handleMessageError);
        };
    }, [socket]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() || !selectedRoom || sending) return;

        if (!connected) {
            toast.error('Cannot send message: Not connected to the server');
            return;
        }

        setSending(true);
        try {
            
            // Create message object
            const messageObj = {
                content: message.trim(),
                roomId: selectedRoom._id,
                sender: authUser._id
            };

            // Optimistically add message to local state with temporary ID
            const tempMessage = {
                _id: `temp-${Date.now()}`,
                content: message.trim(),
                createdAt: new Date().toISOString(),
                sender: {
                    _id: authUser._id,
                    username: authUser.username,
                    profilePicture: authUser.profilePicture || authUser.avatar
                },
                isTemporary: true
            };
            
            addMessage(tempMessage);
            
            // Send message through WebSocket
            const sent = sendMessage(selectedRoom._id, messageObj);
            
            if (!sent) {
                toast.error('Failed to send message: Connection issue');
            }
            
            // Clear input
            setMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex items-center bg-[#25272E] p-2 rounded-md overflow-hidden focus-within:ring-2 ring-[#5A5FCF] transition-all duration-200">
            <input
                type="text"
                className="flex-grow px-4 py-2 text-[#DDE3F1] placeholder-[#A6B1C0] bg-transparent focus:outline-none font-mono text-sm"
                placeholder={initialMessage ? "Edit message..." : connected ? "Type a message..." : "Connecting..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={(!selectedRoom && !initialMessage) || sending || !connected}
            />

            {!connected && (
                <div className="px-2 text-red-400 flex items-center">
                    <WifiOff size={16} className="mr-1" />
                    <span className="text-xs">Disconnected</span>
                </div>
            )}

            <button
                className={`
                    p-2 mr-1
                    ${message.trim() && !sending && connected
                    ? 'text-[#DDE3F1] hover:text-white hover:bg-[#333845]'
                    : 'text-gray-600'}
                    transition-colors duration-200
                    rounded-md
                `}
                onClick={handleSubmit}
                disabled={!message.trim() || sending || !connected}
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

MessageInput.propTypes = {
    initialMessage: PropTypes.string,
    onCancel: PropTypes.func
};

export default MessageInput;
