import { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

const CACHE_KEY_PREFIX = 'leetcode_stats_';

export const useLeetCodeStats = (username) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        if (!username) {
            setLoading(false);
            return;
        }

        const cacheKey = `${CACHE_KEY_PREFIX}${username}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        if (cachedData) {
            try {
                const parsedData = JSON.parse(cachedData);
                setData(parsedData);
                setLoading(false);
                return;
            } catch (err) {
                console.error('Failed to parse cached data:', err);
            }
        }

        try {
            setLoading(true);
            setError(null);
            const response = await ApiService.get(`/u/lc-stats/${username}`);
            const newData = response.data;

            try {
                sessionStorage.setItem(cacheKey, JSON.stringify(newData));
            } catch (err) {
                console.error('Failed to cache data:', err);
            }

            setData(newData);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch LeetCode statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [username]);

    const refreshStats = async () => {
        if (!username) return;
        const cacheKey = `${CACHE_KEY_PREFIX}${username}`;
        sessionStorage.removeItem(cacheKey);
        await fetchStats();
    };

    return { data, loading, error, refreshStats };
};