import { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

export const useHeatmapData = (username) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHeatmapData = async () => {
            try {
                // Check session storage first
                const storedData = sessionStorage.getItem(`heatmap-data-${username}`);

                if (storedData) {
                    // If data exists in session storage, parse and use it
                    const parsedData = JSON.parse(storedData);
                    setData(parsedData.heatmaps);
                    setLoading(false);
                    return;
                }

                // If no data in session storage, fetch from API
                const response = await ApiService.get(`/u/hmap/${username}`);

                // Store the entire response in session storage
                sessionStorage.setItem(`heatmap-data-${username}`, JSON.stringify(response.data));

                // Set only the heatmaps data in state
                setData(response.data.heatmaps);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching heatmap data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchHeatmapData();
        }
    }, [username]);

    return { data, loading, error };
};