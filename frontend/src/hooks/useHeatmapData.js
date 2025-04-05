import { useState, useCallback, useEffect } from 'react';
import ApiService from '../services/ApiService';

export const useHeatmapData = (username) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 2;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // Check session storage first
            const storedData = sessionStorage.getItem(`heatmap-data-${username}`);

            if (storedData) {
                const parsedData = JSON.parse(storedData);
                // Validate the stored data format
                if (parsedData && parsedData.heatmaps) {
                    setData(parsedData.heatmaps);
                    setLoading(false);
                    return;
                }
            }
            
            const response = await ApiService.get(`/u/hmap/${username}`);
            
            // Validate response format
            if (!response.data || !response.data.heatmaps) {
                throw new Error("Invalid data format received from API");
            }
            
            sessionStorage.setItem(`heatmap-data-${username}`, JSON.stringify(response.data));
            setData(response.data.heatmaps);
            setError(null);
        } catch (err) {
            setError(err.message || "Failed to load heatmap data");
            console.error('Error fetching heatmap data:', err);
            
            // Implement retry logic for network errors
            if (retryCount < MAX_RETRIES && (err.message.includes('network') || err.code === 'ERR_NETWORK')) {
                setRetryCount(prev => prev + 1);
                setTimeout(fetchData, 1000 * (retryCount + 1)); // Exponential backoff
            }
        } finally {
            setLoading(false);
        }
    }, [username, retryCount]);

    useEffect(() => {
        if (username) {
            fetchData();
        }
    }, [username, fetchData]);

    // Provide a retry function for the consumer
    const refetch = () => {
        setRetryCount(0);
        setError(null);
        fetchData();
    };

    return { data, loading, error, refetch };
};