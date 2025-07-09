import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ApiService from "../services/ApiService";
import { useAuthContext } from './AuthContext';
import PropTypes from 'prop-types';

export const RoomContext = createContext();

// Helper functions for offline storage
const STORAGE_KEYS = {
    ROOMS: 'rooms_cache',
    ROOM_DETAILS: 'room_details_cache',
    LAST_SYNC: 'rooms_last_sync'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const storage = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }
};

// Helper function to sort rooms logically
const sortRooms = (rooms) => {
    return rooms.sort((a, b) => {
        // First priority: Most recent activity (createdAt or updatedAt)
        const aDate = new Date(a.updatedAt || a.createdAt || 0);
        const bDate = new Date(b.updatedAt || b.createdAt || 0);
        
        // If dates are different, sort by most recent first
        if (aDate.getTime() !== bDate.getTime()) {
            return bDate.getTime() - aDate.getTime();
        }
        
        // If dates are same, sort alphabetically by name
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
};

const isCacheValid = (lastSync) => {
    if (!lastSync) return false;
    return Date.now() - lastSync < CACHE_DURATION;
};

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
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [lastSync, setLastSync] = useState(null);

    const location = useLocation();
    const { authUser, isLoading: authLoading } = useAuthContext();
    const currentRoomIdRef = useRef(null);
    const initializationRef = useRef(false);

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Load cached data on initialization
    useEffect(() => {
        if (!authUser || initializationRef.current) return;

        initializationRef.current = true;

        // Load cached rooms
        const cachedRooms = storage.get(STORAGE_KEYS.ROOMS);
        const cachedLastSync = storage.get(STORAGE_KEYS.LAST_SYNC);

        if (cachedRooms) {
            setRooms(sortRooms(cachedRooms || []));
            setLastSync(cachedLastSync);
        }

        // Load cached room details if on a room page
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const isRoomRoute = pathSegments[0] === 'rooms' && pathSegments.length >= 2;

        if (isRoomRoute) {
            const roomId = pathSegments[1];
            const cachedDetails = storage.get(`${STORAGE_KEYS.ROOM_DETAILS}_${roomId}`);
            if (cachedDetails) {
                setCurrentRoomDetails(cachedDetails);
                currentRoomIdRef.current = roomId;
            }
        }
    }, [authUser, location.pathname]);

    const refreshRoomList = useCallback(async (forceRefresh = false) => {
        const token = localStorage.getItem('app-token');

        if (!token || !authUser) {
            return;
        }

        // Check if we should use cache
        const cachedLastSync = storage.get(STORAGE_KEYS.LAST_SYNC);
        if (!forceRefresh && !isOnline) {
            // Use cached data when offline
            const cachedRooms = storage.get(STORAGE_KEYS.ROOMS);
            if (cachedRooms) {
                setRooms(sortRooms(cachedRooms || []));
                return;
            }
        }

        if (!forceRefresh && isCacheValid(cachedLastSync) && isOnline) {
            // Use cached data if still valid
            const cachedRooms = storage.get(STORAGE_KEYS.ROOMS);
            if (cachedRooms) {
                setRooms(sortRooms(cachedRooms || []));
                return;
            }
        }

        if (!isOnline) {
            setListError('You are offline. Showing cached data.');
            return;
        }

        setListLoading(true);
        setListError(null);

        try {
            const response = await ApiService.get('/rooms');

            const roomsData = response.data.rooms;
            
            // Sort rooms logically: most recently joined/created first, then alphabetical
            const sortedRooms = roomsData.sort((a, b) => {
                // First priority: Most recent activity (createdAt or updatedAt)
                const aDate = new Date(a.updatedAt || a.createdAt || 0);
                const bDate = new Date(b.updatedAt || b.createdAt || 0);
                
                // If dates are different, sort by most recent first
                if (aDate.getTime() !== bDate.getTime()) {
                    return bDate.getTime() - aDate.getTime();
                }
                
                // If dates are same, sort alphabetically by name
                return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            });
            setRooms(sortedRooms);

            // Cache the data
            storage.set(STORAGE_KEYS.ROOMS, sortedRooms);
            const now = Date.now();
            storage.set(STORAGE_KEYS.LAST_SYNC, now);
            setLastSync(now);

        } catch (error) {
            console.error('Failed to fetch rooms:', error);

            // Try to use cached data on error
            const cachedRooms = storage.get(STORAGE_KEYS.ROOMS);
            if (cachedRooms) {
                setRooms(sortRooms(cachedRooms || []));
                setListError('Unable to sync with server. Showing cached data.');
            } else {
                setListError('Unable to load rooms. Please try again.');
            }
        } finally {
            setListLoading(false);
        }
    }, [authUser, isOnline]);

    const searchPublicRooms = useCallback(async (searchQuery) => {
        const token = localStorage.getItem('app-token');

        if (!token || !authUser) {
            throw new Error('Authentication required');
        }

        if (!isOnline) {
            // Search in cached rooms when offline
            const cachedRooms = storage.get(STORAGE_KEYS.ROOMS) || [];
            const filteredRooms = cachedRooms.filter(room =>
                room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            return filteredRooms;
        }

        try {
            const response = await ApiService.get('/rooms/search', {
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
            // Fallback to cached search on error
            const cachedRooms = storage.get(STORAGE_KEYS.ROOMS) || [];
            const filteredRooms = cachedRooms.filter(room =>
                room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredRooms.length > 0) {
                return filteredRooms;
            }

            throw new Error(error.response?.data?.message || 'Failed to search rooms');
        }
    }, [authUser, isOnline]);

    const loadCurrentRoomDetails = useCallback(
        async (roomId, forceRefresh = false) => {
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

            // Check cached data first
            const cacheKey = `${STORAGE_KEYS.ROOM_DETAILS}_${roomId}`;
            const cachedDetails = storage.get(cacheKey);

            if (!forceRefresh && cachedDetails) {
                if (currentRoomIdRef.current !== roomId) {
                    setCurrentRoomDetails(cachedDetails);
                    currentRoomIdRef.current = roomId;
                }

                // If offline or cache is still valid, use cached data
                if (!isOnline || isCacheValid(cachedDetails.cachedAt)) {
                    return;
                }
            }

            // Avoid unnecessary API calls if the same room is already loaded
            if (!forceRefresh && currentRoomIdRef.current === roomId && currentRoomDetails && isOnline) {
                return;
            }

            if (!isOnline && !cachedDetails) {
                setCurrentRoomError('You are offline and no cached data is available.');
                return;
            }

            if (!isOnline) {
                setCurrentRoomError('You are offline. Showing cached data.');
                return;
            }

            setCurrentRoomLoading(true);
            setCurrentRoomError(null);
            currentRoomIdRef.current = roomId;

            try {
                const response = await ApiService.get(`/rooms/${roomId}`);

                const roomData = { ...response.data, cachedAt: Date.now() };

                // Only update if we're still loading the same room (prevent race conditions)
                if (currentRoomIdRef.current === roomId) {
                    setCurrentRoomDetails(roomData);

                    // Cache the room details
                    storage.set(cacheKey, roomData);
                }

            } catch (error) {
                // Only set error if we're still loading the same room
                if (currentRoomIdRef.current === roomId) {
                    // Try to use cached data on error
                    if (cachedDetails) {
                        setCurrentRoomDetails(cachedDetails);
                        setCurrentRoomError('Unable to sync with server. Showing cached data.');
                    } else {
                        setCurrentRoomError(error.response?.data?.message || 'Unable to load the selected room.');
                        setCurrentRoomDetails(null);
                    }
                }
            } finally {
                // Only update loading state if we're still loading the same room
                if (currentRoomIdRef.current === roomId) {
                    setCurrentRoomLoading(false);
                }
            }
        },
        [currentRoomDetails, isOnline]
    );

    // Sync data when coming back online
    useEffect(() => {
        if (isOnline && authUser) {
            const cachedLastSync = storage.get(STORAGE_KEYS.LAST_SYNC);
            if (!isCacheValid(cachedLastSync)) {
                refreshRoomList(true); // Force refresh when coming back online
            }
        }
    }, [isOnline, authUser, refreshRoomList]);

    // Clear current room details when navigating away from room routes
    useEffect(() => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const isRoomRoute = pathSegments[0] === 'rooms' && pathSegments.length >= 2;

        if (!isRoomRoute && currentRoomDetails) {
            setCurrentRoomDetails(null);
            setCurrentRoomError(null);
            currentRoomIdRef.current = null;
        }
    }, [location.pathname, currentRoomDetails]);

    // Clear all cached data when user logs out
    useEffect(() => {
        if (!authUser) {
            setRooms([]);
            setCurrentRoomDetails(null);
            setCurrentRoomError(null);
            setListError(null);
            setLastSync(null);
            currentRoomIdRef.current = null;
            initializationRef.current = false;

            // Clear cached data
            storage.remove(STORAGE_KEYS.ROOMS);
            storage.remove(STORAGE_KEYS.LAST_SYNC);

            // Clear all room details cache
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(STORAGE_KEYS.ROOM_DETAILS)) {
                    storage.remove(key);
                }
            });
        }
    }, [authUser]);

    // Load room list when user is authenticated (only if not already loaded from cache)
    useEffect(() => {
        if (!authLoading && authUser && rooms.length === 0) {
            refreshRoomList();
        }
    }, [authLoading, authUser, rooms.length, refreshRoomList]);

    // Force refresh function for manual sync
    const forceSync = useCallback(() => {
        refreshRoomList(true);
        if (currentRoomIdRef.current) {
            loadCurrentRoomDetails(currentRoomIdRef.current, true);
        }
    }, [refreshRoomList, loadCurrentRoomDetails]);

    // Clear cache function
    const clearCache = useCallback(() => {
        storage.remove(STORAGE_KEYS.ROOMS);
        storage.remove(STORAGE_KEYS.LAST_SYNC);
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(STORAGE_KEYS.ROOM_DETAILS)) {
                storage.remove(key);
            }
        });
        setRooms([]);
        setCurrentRoomDetails(null);
        setLastSync(null);
    }, []);

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
        isOnline,
        lastSync,
        forceSync,
        clearCache,
        // Helper function to check if data is from cache
        isDataCached: (type, id = null) => {
            if (type === 'rooms') {
                return !isCacheValid(lastSync);
            }
            if (type === 'room' && id) {
                const cached = storage.get(`${STORAGE_KEYS.ROOM_DETAILS}_${id}`);
                return !!cached;
            }
            return false;
        }
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
        isOnline,
        lastSync,
        forceSync,
        clearCache,
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