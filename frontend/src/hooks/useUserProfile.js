import { useState, useEffect, useRef } from 'react';
import ApiService from '../services/ApiService';

// Cache duration in milliseconds (2 hours)
const CACHE_DURATION = 2 * 60 * 60 * 1000;

// Function to get cached user data
const getCachedUser = (username) => {
    try {
        const cached = sessionStorage.getItem(`user_profile_${username}`);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();
            // Return data if it's less than CACHE_DURATION old
            if (now - timestamp < CACHE_DURATION) {
                return data;
            }
        }
    } catch (err) {
        console.warn('Error reading cached user profile:', err);
    }
    return null;
};

// Function to cache user data
const setCachedUser = (username, data) => {
    try {
        sessionStorage.setItem(`user_profile_${username}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (err) {
        console.warn('Error caching user profile:', err);
    }
};

export const useUserProfile = (username, options = {}) => {
    const [user, setUser] = useState(() => getCachedUser(username));
    const [loading, setLoading] = useState(!user); // Only show loading if no cached data
    const [error, setError] = useState(null);
    const usernameRef = useRef(username);

    const { onNotFound } = options;

    useEffect(() => {
        // Only update if username actually changed
        if (username !== usernameRef.current) {
            usernameRef.current = username;
            // Reset state for new username
            setUser(null);
            setError(null);
        }

        const fetchProfile = async () => {
            const currentUsername = usernameRef.current;

            // If we already have cached data, don't show loading state
            const cachedUser = getCachedUser(currentUsername);
            if (cachedUser) {
                setUser(cachedUser);
                setLoading(false);
                return;
            }

            // If no cache, fetch from API
            setLoading(true);
            try {
                const response = await ApiService.get(`/u/${currentUsername}`);
                const userData = response.data.user;
                setUser(userData);
                // Cache the new data
                setCachedUser(currentUsername, userData);
                setError(null);
            } catch (err) {
                if (err.response?.status === 404 && onNotFound) {
                    onNotFound();
                }
                setError(err.response?.status === 404 ? 'User not found' : 'Failed to fetch user profile');
                console.error("Failed to fetch user profile:", err);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchProfile();
        }
    }, [username]); // Removed onNotFound from dependencies

    const refetch = async () => {
        const currentUsername = usernameRef.current;
        setLoading(true);
        try {
            const response = await ApiService.get(`/u/${currentUsername}`);
            const userData = response.data.user;
            setUser(userData);
            setCachedUser(currentUsername, userData);
            setError(null);
        } catch (err) {
            setError('Failed to refresh user profile');
            console.error("Failed to refresh user profile:", err);
        } finally {
            setLoading(false);
        }
    };

    return { user, loading, error, refetch };
};
