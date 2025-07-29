import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

const API_URI = import.meta.env.VITE_API_URI;
const isDevelopment = import.meta.env.MODE !== 'production';

// Track rate limit toasts to prevent duplicates
let lastRateLimitToastTime = 0;
const RATE_LIMIT_TOAST_COOLDOWN = 3000; // 3 seconds between rate limit toasts


const isTokenExpired = (token) => {
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        // Check if token has expiration claim and is expired
        if (decoded.exp && decoded.exp < currentTime) {
            return true;
        }
        return false;
    } catch {
        // If token can't be decoded, consider it expired
        return true;
    }
};
class ApiService {
    constructor() {
        this.api = axios.create({
            baseURL: API_URI,
        });

        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('app-token');
                if (token) {
                    if (isTokenExpired(token)) {
                        // Clear token and redirect to login if expired
                        localStorage.removeItem('app-token');
                        window.location.href = '/login';
                        throw new Error('Token expired');
                    }
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Global error handling
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                // Centralized error handling
                if (isDevelopment) {
                    console.error('API Error:', error.response?.data || error.message);
                }

                // Handle rate limiting globally - with debouncing to prevent duplicate toasts
                if (error.response?.status === 429) {
                    const currentTime = Date.now();
                    if (currentTime - lastRateLimitToastTime > RATE_LIMIT_TOAST_COOLDOWN) {
                        const { error: errorMsg, retryAfter } = error.response.data || {};
                        toast.error(
                            `${errorMsg || 'Rate limit exceeded'}${retryAfter ? ` Please try again in ${retryAfter}.` : ''}`,
                            { id: 'rate-limit-toast' } // Using an ID ensures only one toast with this ID can exist
                        );
                        lastRateLimitToastTime = currentTime;
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // Generic methods
    async get(url, config = {}) {
        return this.api.get(url, config);
    }

    async post(url, data) {
        return this.api.post(url, data);
    }

    async put(url, data) {
        return this.api.put(url, data);
    }

    async delete(url, data) {
        return this.api.delete(url, { data }); // Pass the data here as part of config
    }
}

export default new ApiService();