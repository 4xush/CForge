import { useState, useCallback, useEffect, useRef } from 'react';
import ApiService from '../services/ApiService';

export const useHeatmapData = (username, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef(null);
  const lastFetchAttemptRef = useRef(0);
  
  const MAX_RETRIES = 2;
  const CACHE_EXPIRY_DAYS = 2;
  const MIN_RETRY_INTERVAL = 30000; // 30 seconds between retries
  const { 
    skipFetch = false, 
    onError = () => {}, 
    enableRetry = true 
  } = options;

  // Helper function to check if cached data is expired
  const isCacheExpired = (timestamp) => {
    const now = new Date().getTime();
    const cacheTime = new Date(timestamp).getTime();
    const diffInDays = (now - cacheTime) / (1000 * 60 * 60 * 24);
    return diffInDays > CACHE_EXPIRY_DAYS;
  };

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
      
      // Check localStorage first (unless forcing refresh)
      if (!forceRefresh) {
        const storedItem = localStorage.getItem(`heatmap-data-${username}`);
        
        if (storedItem) {
          try {
            const parsedItem = JSON.parse(storedItem);
            
            // Check if cached data exists and is not expired
            if (parsedItem && parsedItem.data && parsedItem.timestamp && !isCacheExpired(parsedItem.timestamp)) {
              // Validate the stored data format
              if (parsedItem.data.heatmaps) {
                setData(parsedItem.data.heatmaps);
                setError(null);
                setLoading(false);
                return;
              }
            } else if (parsedItem && parsedItem.timestamp && isCacheExpired(parsedItem.timestamp)) {
              // Remove expired cache
              localStorage.removeItem(`heatmap-data-${username}`);
            }
          } catch (parseError) {
            console.warn('Failed to parse cached heatmap data:', parseError);
            localStorage.removeItem(`heatmap-data-${username}`);
          }
        }
      }

      // Check if we're online
      if (!navigator.onLine) {
        throw new Error('No internet connection available');
      }

      const response = await ApiService.get(`/u/hmap/${username}`, {
        signal: abortControllerRef.current.signal,
        timeout: 10000 // 10 second timeout
      });
      
      // Validate response format
      if (!response.data || !response.data.heatmaps) {
        throw new Error("Invalid data format received from API");
      }

      // Store data with timestamp in localStorage
      const dataToStore = {
        data: response.data,
        timestamp: new Date().toISOString()
      };
      
      try {
        localStorage.setItem(`heatmap-data-${username}`, JSON.stringify(dataToStore));
      } catch (storageError) {
        console.warn('Failed to cache heatmap data:', storageError);
        // Continue without caching if storage fails
      }
      
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
      } else {
        // Try to load cached data as fallback if available
        const storedItem = localStorage.getItem(`heatmap-data-${username}`);
        if (storedItem) {
          try {
            const parsedItem = JSON.parse(storedItem);
            if (parsedItem && parsedItem.data && parsedItem.data.heatmaps) {
              setData(parsedItem.data.heatmaps);
              setError(`Using cached data. ${errorMessage}`);
            }
          } catch (parseError) {
            console.warn('Failed to parse cached fallback data:', parseError);
          }
        }
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

  // Function to manually clear cache (optional utility)
  const clearCache = useCallback(() => {
    localStorage.removeItem(`heatmap-data-${username}`);
  }, [username]);

  // Function to check if we have cached data
  const hasCachedData = useCallback(() => {
    const storedItem = localStorage.getItem(`heatmap-data-${username}`);
    if (!storedItem) return false;
    
    try {
      const parsedItem = JSON.parse(storedItem);
      return !!(parsedItem && parsedItem.data && parsedItem.data.heatmaps);
    } catch {
      return false;
    }
  }, [username]);

  return { 
    data, 
    loading, 
    error, 
    refetch, 
    clearCache, 
    hasCachedData: hasCachedData(),
    isRetrying: retryCount > 0 && loading
  };
};