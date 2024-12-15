import axios from 'axios';

const API_URI = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URI,
});
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('app-token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;