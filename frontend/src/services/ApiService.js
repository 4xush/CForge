import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URI = import.meta.env.VITE_API_URI2;


const isTokenExpired = (token) => {
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        // Check if token has expiration claim and is expired
        if (decoded.exp && decoded.exp < currentTime) {
            return true;
        }
        return false;
    } catch (error) {
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
                console.error('API Error:', error.response?.data || error.message);
                return Promise.reject(error);
            }
        );
    }

    // Generic methods
    async get(url, params = {}) {
        return this.api.get(url, { params });
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