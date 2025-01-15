import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/ApiService.js';
import { useAuthContext } from './AuthContext';
import { useRoomContext } from './RoomContext';

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const { authUser } = useAuthContext();
    const { selectedRoom } = useRoomContext();

    const fetchMessages = useCallback(async () => {
        if (!selectedRoom) return;

        setLoading(true);
        try {
            const response = await api.get(`/rooms/${selectedRoom._id}/messages`);
            setMessages(response.data.messages.reverse());
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedRoom]);

    const addMessage = useCallback((newMessage) => {
        setMessages(prevMessages => [...prevMessages, {
            ...newMessage,
            sender: {
                _id: authUser._id,
                username: authUser.username,
                profilePicture: authUser.profilePicture
            },
            createdAt: new Date().toISOString()
        }]);
    }, [authUser]);

    const deleteMessage = useCallback(async (messageId) => {
        try {
            await api.delete(`/rooms/messages/${messageId}`);
            setMessages(prevMessages =>
                prevMessages.filter(msg => msg._id !== messageId)
            );
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }, []);

    const editMessage = useCallback(async (messageId, newContent) => {
        try {
            const response = await api.put(`/rooms/messages/${messageId}`, { content: newContent });
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg._id === messageId ? response.data.message : msg
                )
            );
            return response.data.message;
        } catch (error) {
            console.error('Error editing message:', error);
            throw error;
        }
    }, []);

    return (
        <MessageContext.Provider value={{
            messages,
            loading,
            fetchMessages,
            addMessage,
            deleteMessage,
            editMessage
        }}>
            {children}
        </MessageContext.Provider>
    );
};

export const useMessageContext = () => {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error('useMessageContext must be used within a MessageProvider');
    }
    return context;
};