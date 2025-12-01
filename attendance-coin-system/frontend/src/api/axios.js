// frontend/src/api/axios.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000
});

// Attach the token from localStorage automatically
api.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem('token');
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
        // ignore if localStorage not available
    }
    return config;
}, (error) => Promise.reject(error));

// Optional: central response error handling (useful during dev)
api.interceptors.response.use(
    (res) => res,
    (err) => {
        // you can log errors or show a toast here
        return Promise.reject(err);
    }
);

export default api;
