import { createContext, useState, useEffect, useContext, useCallback } from 'react';
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
                return;
            }

            setCurrentRoomLoading(true);
            setCurrentRoomError(null);

            try {
                const response = await api.get(`/rooms/${roomId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                // Set state directly with response.data as it contains the room object
                setCurrentRoomDetails(response.data);

            } catch (error) {
                setCurrentRoomError(error.response?.data?.message || 'Unable to load the selected room.');
                setCurrentRoomDetails(null);
            } finally {
                setCurrentRoomLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        if (pathSegments[0] !== 'rooms' || pathSegments.length < 2) {
             if (currentRoomDetails) {
                 setCurrentRoomDetails(null);
                 setCurrentRoomError(null);
             }
        }
    }, [location, currentRoomDetails]);

    useEffect(() => {
        if (!authUser) {
            setRooms([]);
            setCurrentRoomDetails(null);
            setCurrentRoomError(null);
            setListError(null);
        }
    }, [authUser]);

    useEffect(() => {
        if (!authLoading && authUser) {
            refreshRoomList();
        }
    }, [authLoading, authUser, refreshRoomList]);

    return (
        <RoomContext.Provider
            value={{
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
            }}
        >
            {children}
        </RoomContext.Provider>
    );
};

RoomProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
