import axios from 'axios';
import { jwtDecode } from 'jwt-decode';  // Changed to named import

const API_URI = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URI,
});

// Function to check if token is expired
const isTokenExpired = (token) => {
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp < currentTime) {
            return true;
        }
        return false;
    } catch (error) {
        return true;
    }
};

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('app-token');

        if (token) {
            // Check if token is expired
            if (isTokenExpired(token)) {
                // Clear token and redirect to login if expired
                localStorage.removeItem('app-token');
                window.location.href = '/login';
                throw new Error('Token expired');
            }

            // Add valid token to headers
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login on authentication errors
            localStorage.removeItem('app-token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;