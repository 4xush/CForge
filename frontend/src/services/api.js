import axios from 'axios';

const API_URI = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.api = axios.create({
            baseURL: API_URI,
        });

        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('app-token');
                if (token) {
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

    async delete(url) {
        return this.api.delete(url);
    }
}

export default new ApiService();