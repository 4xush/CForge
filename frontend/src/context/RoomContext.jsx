import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../config/api';
import { useAuthContext } from './AuthContext';
import PropTypes from 'prop-types';

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
    const [currentRoomDetails, setCurrentRoomDetails] = useState(null);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState(null);
    const [currentRoomLoading, setCurrentRoomLoading] = useState(false);
    const [currentRoomError, setCurrentRoomError] = useState(null);
    const location = useLocation();
    const { authUser, isLoading: authLoading } = useAuthContext();

    // Use ref to track the current room ID to avoid unnecessary re-renders
    const currentRoomIdRef = useRef(null);

    const refreshRoomList = useCallback(async () => {
        const token = localStorage.getItem('app-token');

        if (!token || !authUser) {
            return;
        }

        setListLoading(true);
        setListError(null);

        try {
            const response = await api.get('/rooms', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setRooms(response.data.rooms);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
            setListError('Unable to load rooms. Please try again.');
        } finally {
            setListLoading(false);
        }
    }, [authUser]);

    const searchPublicRooms = useCallback(async (searchQuery) => {
        const token = localStorage.getItem('app-token');

        if (!token || !authUser) {
            throw new Error('Authentication required');
        }

        try {
            const response = await api.get('/rooms/search', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    search: searchQuery,
                    limit: 50
                }
            });

            if (response.data && response.data.rooms) {
                return response.data.rooms;
            }
            return [];
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to search rooms');
        }
    }, [authUser]);

    const loadCurrentRoomDetails = useCallback(
        async (roomId) => {
            const token = localStorage.getItem('app-token');

            if (!token) {
                setCurrentRoomError('Authentication required.');
                return;
            }
            if (!roomId) {
                setCurrentRoomDetails(null);
                setCurrentRoomError(null);
                currentRoomIdRef.current = null;
                return;
            }

            // Avoid unnecessary API calls if the same room is already loaded
            if (currentRoomIdRef.current === roomId && currentRoomDetails) {
                return;
            }

            setCurrentRoomLoading(true);
            setCurrentRoomError(null);
            currentRoomIdRef.current = roomId;

            try {
                const response = await api.get(`/rooms/${roomId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                // Only update if we're still loading the same room (prevent race conditions)
                if (currentRoomIdRef.current === roomId) {
                    setCurrentRoomDetails(response.data);
                }

            } catch (error) {
                // Only set error if we're still loading the same room
                if (currentRoomIdRef.current === roomId) {
                    setCurrentRoomError(error.response?.data?.message || 'Unable to load the selected room.');
                    setCurrentRoomDetails(null);
                }
            } finally {
                // Only update loading state if we're still loading the same room
                if (currentRoomIdRef.current === roomId) {
                    setCurrentRoomLoading(false);
                }
            }
        },
        [currentRoomDetails] // Include currentRoomDetails to make the optimization work
    );

    // Clear current room details when navigating away from room routes
    useEffect(() => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const isRoomRoute = pathSegments[0] === 'rooms' && pathSegments.length >= 2;

        if (!isRoomRoute && currentRoomDetails) {
            setCurrentRoomDetails(null);
            setCurrentRoomError(null);
            currentRoomIdRef.current = null;
        }
    }, [location.pathname]); // Remove currentRoomDetails from dependency array to prevent infinite loop

    // Clear all room data when user logs out
    useEffect(() => {
        if (!authUser) {
            setRooms([]);
            setCurrentRoomDetails(null);
            setCurrentRoomError(null);
            setListError(null);
            currentRoomIdRef.current = null;
        }
    }, [authUser]);

    // Load room list when user is authenticated
    useEffect(() => {
        if (!authLoading && authUser) {
            refreshRoomList();
        }
    }, [authLoading, authUser, refreshRoomList]);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useCallback(() => ({
        rooms,
        currentRoomDetails,
        setCurrentRoomDetails,
        refreshRoomList,
        searchPublicRooms,
        loadCurrentRoomDetails,
        listLoading,
        listError,
        currentRoomLoading,
        currentRoomError,
    }), [
        rooms,
        currentRoomDetails,
        refreshRoomList,
        searchPublicRooms,
        loadCurrentRoomDetails,
        listLoading,
        listError,
        currentRoomLoading,
        currentRoomError,
    ]);

    return (
        <RoomContext.Provider value={contextValue()}>
            {children}
        </RoomContext.Provider>
    );
};

RoomProvider.propTypes = {
    children: PropTypes.node.isRequired,
};