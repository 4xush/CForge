import { useState, useEffect, useCallback, useRef } from 'react';
import ApiService from '../services/ApiService';

export const useHeatmapData = (username, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const usernameRef = useRef(username);
    const abortControllerRef = useRef(null);

    const { onNotFound } = options;

    // Helper function to convert Unix timestamp to YYYY-MM-DD format
    const convertTimestampToDate = (timestamp) => {
        try {
            // Convert string timestamp to number and then to date
            const date = new Date(parseInt(timestamp) * 1000);
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.warn('Invalid timestamp:', timestamp);
            return null;
        }
    };

    // Helper function to process platform-specific data formats
    const processPlatformData = (platformData, platform) => {
        if (!platformData || typeof platformData !== 'object') {
            return {};
        }

        let processedData = {};

        if (platform === 'leetcode') {
            // LeetCode uses Unix timestamps as keys
            Object.entries(platformData).forEach(([timestamp, count]) => {
                const dateStr = convertTimestampToDate(timestamp);
                if (dateStr) {
                    processedData[dateStr] = count;
                }
            });
        } else if (platform === 'github' || platform === 'codeforces') {
            // GitHub and Codeforces already use YYYY-MM-DD format
            if (Array.isArray(platformData)) {
                // Handle array format
                platformData.forEach(item => {
                    if (item && item.date && typeof item.count !== 'undefined') {
                        processedData[item.date] = item.count;
                    }
                });
            } else {
                // Handle object format
                processedData = { ...platformData };
            }
        } else {
            // Default handling for other platforms
            if (Array.isArray(platformData)) {
                platformData.forEach(item => {
                    if (item && item.date && typeof item.count !== 'undefined') {
                        processedData[item.date] = item.count;
                    }
                });
            } else {
                processedData = { ...platformData };
            }
        }

        return processedData;
    };

    const fetchHeatmapData = useCallback(async (currentUsername) => {
        if (!currentUsername) {
            setLoading(false);
            return;
        }

        // Cancel previous request if it exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        try {
            setLoading(true);
            setError(null);

            const response = await ApiService.get(`/u/hmap/${currentUsername}`, {
                signal: abortControllerRef.current.signal,
                timeout: 30000 // 30 second timeout for heatmap data
            });

            if (response.data?.success && response.data?.heatmaps) {
                const heatmaps = response.data.heatmaps;

                // Process and validate heatmap data
                const processedData = {};

                Object.keys(heatmaps).forEach(platform => {
                    const platformData = heatmaps[platform];

                    if (platformData && typeof platformData === 'object') {
                        processedData[platform] = processPlatformData(platformData, platform);
                    } else {
                        console.warn(`Invalid ${platform} heatmap data:`, platformData);
                        processedData[platform] = {};
                    }
                });

                setData(processedData);

            } else {
                console.warn('Invalid heatmap response format:', response.data);
                setData({});
            }
        } catch (err) {
            // Don't set error for aborted requests
            if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                return;
            }

            console.error('Error fetching heatmap data:', err);

            if (err.response?.status === 404) {
                if (onNotFound) {
                    onNotFound();
                }
                setError('User not found');
            } else if (err.response?.status >= 500) {
                setError('Server error while fetching heatmap data');
            } else {
                setError('Failed to fetch heatmap data');
            }

            setData({});
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    }, [onNotFound]);

    // Effect to handle username changes
    useEffect(() => {
        // Only update if username actually changed
        if (username !== usernameRef.current) {
            usernameRef.current = username;
            // Reset state for new username
            setData(null);
            setError(null);
            setLoading(true);
        }

        if (username) {
            fetchHeatmapData(username);
        } else {
            setLoading(false);
            setData({});
        }

        // Cleanup function
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [username, fetchHeatmapData]);

    // Refetch function for manual refresh
    const refetch = useCallback(() => {
        const currentUsername = usernameRef.current;
        if (currentUsername) {
            fetchHeatmapData(currentUsername);
        }
    }, [fetchHeatmapData]);

    // Clear error function
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        data,
        loading,
        error,
        refetch,
        clearError,
        // Helper function to check if platform has data
        hasPlatformData: useCallback((platform) => {
            return data && data[platform] && Object.keys(data[platform]).length > 0;
        }, [data])
    };
};