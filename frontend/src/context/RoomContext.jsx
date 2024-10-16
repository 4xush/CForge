import React, { createContext, useState, useEffect, useContext } from 'react';
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
    const [rooms, setRooms] = useState([]);  // Store room list
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [refreshRooms, setRefreshRooms] = useState(false);

    useEffect(() => {
        const fetchRooms = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                console.log('User not logged in, skipping fetch rooms.');
                return;
            }

            try {
                // Attach the token to the request if available
                const response = await api.get('/rooms', {
                    headers: {
                        Authorization: `Bearer ${token}`,  // Include the token in the request
                    },
                });
                setRooms(response.data.rooms);  // Update room list
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
            }
        };

        fetchRooms();
    }, [refreshRooms]);

    const refreshRoomList = () => {
        setRefreshRooms(prev => !prev);  // Trigger a refresh
    };

    return (
        <RoomContext.Provider
            value={{ rooms, selectedRoom, setSelectedRoom, refreshRoomList }}
        >
            {children}
        </RoomContext.Provider>
    );
};
