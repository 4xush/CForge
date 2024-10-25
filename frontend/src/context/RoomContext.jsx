import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../config/api';

export const RoomContext = createContext();

export const useRoomContext = () => {
    const context = useContext(RoomContext);
    if (!context) {
        throw new Error('useRoomContext must be used within a RoomProvider');
    }
    return context;
};

export const RoomProvider = ({ children }) => {
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);

    const refreshRoomList = useCallback(async () => {
        const token = localStorage.getItem('app-token');

        if (!token) {
            console.log('User not logged in, skipping fetch rooms.');
            return;
        }

        try {
            const response = await api.get('/rooms', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setRooms(response.data.rooms);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        }
    }, []);

    return (
        <RoomContext.Provider value={{ rooms, selectedRoom, setSelectedRoom, refreshRoomList }}>
            {children}
        </RoomContext.Provider>
    );
};
