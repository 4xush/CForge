import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../config/api';
import { useAuthContext } from './AuthContext';

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const location = useLocation();
    const { authUser, isLoading: authLoading } = useAuthContext();

    const refreshRoomList = useCallback(async () => {
        const token = localStorage.getItem('app-token');

        if (!token || !authUser) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.get('/rooms', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setRooms(response.data.rooms);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
            setError('Unable to load rooms. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [authUser]);

    const selectRoom = useCallback(
        async (roomId) => {
            const token = localStorage.getItem('app-token');

            if (!token) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await api.get(`/rooms/${roomId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setSelectedRoom(response.data.room);
            } catch (error) {
                console.error('Failed to select room:', error);
                setError('Unable to load the selected room. Please try again.');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Reset selectedRoom when navigating away from a room page
    useEffect(() => {
        if (!location.pathname.startsWith('/rooms')) {
            setSelectedRoom(null);
        }
    }, [location]);

    // Reset rooms when user logs out
    useEffect(() => {
        if (!authUser) {
            setRooms([]);
            setSelectedRoom(null);
        }
    }, [authUser]);

    // Fetch rooms when auth state is ready and user is logged in
    useEffect(() => {
        if (!authLoading && authUser) {
            refreshRoomList();
        }
    }, [authLoading, authUser, refreshRoomList]);

    return (
        <RoomContext.Provider
            value={{
                rooms,
                selectedRoom,
                setSelectedRoom,
                refreshRoomList,
                selectRoom,
                loading,
                error,
            }}
        >
            {children}
        </RoomContext.Provider>
    );
};
