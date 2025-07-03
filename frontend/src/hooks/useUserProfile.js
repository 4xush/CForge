import { useState, useEffect, useRef } from 'react';
import ApiService from '../services/ApiService';

export const useUserProfile = (username, options = {}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
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
            setLoading(true);
        }

        const fetchProfile = async () => {
            const currentUsername = usernameRef.current;

            if (!currentUsername) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await ApiService.get(`/u/${currentUsername}`);
                const userData = response.data.user;
                setUser(userData);
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
    }, [username, onNotFound]);

    const refetch = async () => {
        const currentUsername = usernameRef.current;
        if (!currentUsername) return;
        
        setLoading(true);
        try {
            const response = await ApiService.get(`/u/${currentUsername}`);
            const userData = response.data.user;
            setUser(userData);
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