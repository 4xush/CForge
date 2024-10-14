import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../config/api';

// Create RoomContext
export const RoomContext = createContext();

// Custom hook to use the RoomContext
export const useRoomContext = () => {
    const context = useContext(RoomContext);
    if (!context) {
        throw new Error('useRoomContext must be used within a RoomProvider');
    }
    return context;
};

// RoomProvider component
export const RoomProvider = ({ children }) => {
    const [rooms, setRooms] = useState([]);  // Store room list
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [refreshRooms, setRefreshRooms] = useState(false);

    // Fetch room list whenever refreshRooms changes
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await api.get('/rooms');
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
