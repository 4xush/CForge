import { useState, useCallback, useEffect, useRef } from 'react';
import ApiService from '../services/ApiService';

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

const getCachedData = (username) => {
  try {
    const cached = localStorage.getItem(`heatmap_${username}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      // Return data if it's less than CACHE_DURATION old
      if (now - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Error reading cached heatmap data:', err);
  }
  return null;
};

const setCachedData = (username, data) => {
  try {
    localStorage.setItem(`heatmap_${username}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.warn('Error caching heatmap data:', err);
  }
};

export const useHeatmapData = (username, options = {}) => {
  const [data, setData] = useState(() => getCachedData(username));
  const [loading, setLoading] = useState(!data); // Only show loading if no cached data
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef(null);
  const lastFetchAttemptRef = useRef(0);

  const MAX_RETRIES = 2;
  const MIN_RETRY_INTERVAL = 30000; // 30 seconds between retries
  const {
    skipFetch = false,
    onError = () => { },
    enableRetry = true
  } = options;

  // Helper function to check if we should retry based on time interval
  const canRetryNow = () => {
    const now = Date.now();
    return now - lastFetchAttemptRef.current > MIN_RETRY_INTERVAL;
  };

  // Helper function to determine if error suggests server unavailability
  const isServerError = (err) => {
    const errorMessage = err.message || '';
    const errorCode = err.code || '';

    return (
      errorMessage.includes('network') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('ERR_NETWORK') ||
      errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
      errorMessage.includes('ERR_CONNECTION_REFUSED') ||
      errorCode === 'ERR_NETWORK' ||
      err.name === 'NetworkError' ||
      (err.response && err.response.status >= 500)
    );
  };

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Skip fetch if explicitly told to skip (offline mode)
    if (skipFetch && !forceRefresh) {
      setLoading(false);
      return;
    }

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = getCachedData(username);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }
    }

    // Prevent too frequent retry attempts
    if (!forceRefresh && !canRetryNow()) {
      setLoading(false);
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    lastFetchAttemptRef.current = Date.now();

    try {
      setLoading(true);

      // Check if we're online
      if (!navigator.onLine) {
        throw new Error('No internet connection available');
      }

      const response = await ApiService.get(`/u/hmap/${username}`, {
        signal: abortControllerRef.current.signal,
        timeout: 10000 // 10 second timeout
      });

      // Validate response format
      if (!response.data || !response.data.success || !response.data.heatmaps) {
        throw new Error("Invalid data format received from API");
      }

      // Cache the new data
      setCachedData(username, response.data.heatmaps);
      setData(response.data.heatmaps);
      setError(null);
      setRetryCount(0); // Reset retry count on success

    } catch (err) {
      // Don't set error if request was aborted (component unmounted or new request started)
      if (err.name === 'AbortError') {
        return;
      }

      const errorMessage = err.message || "Failed to load heatmap data";
      setError(errorMessage);
      console.error('Error fetching heatmap data:', err);

      // Call the error callback
      onError(errorMessage);

      // Implement retry logic only for network errors and if retries are enabled
      if (enableRetry && retryCount < MAX_RETRIES && isServerError(err)) {
        setRetryCount(prev => prev + 1);
        // Exponential backoff with jitter
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 30000);
        setTimeout(() => fetchData(forceRefresh), backoffDelay);
      }

    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [username, retryCount, skipFetch, onError, enableRetry]);

  useEffect(() => {
    if (username) {
      fetchData();
    }

    // Cleanup function to abort ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [username, fetchData]);

  // Provide a retry function for the consumer
  const refetch = useCallback((forceRefresh = false) => {
    setRetryCount(0);
    setError(null);
    fetchData(forceRefresh);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    isRetrying: retryCount > 0 && loading
  };
};