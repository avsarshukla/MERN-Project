import axios from 'axios';

/**
 * Central Axios instance for API communication.
 * Base URL defaults to relative '/api' which works seamlessly with Vite proxy
 * or can be overridden with VITE_API_URL.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to automatically attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is invalid or expired (401), we can optionally clear stored token
    if (error.response && error.response.status === 401) {
      // Clear token if it was unauthorized
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        // You could trigger logout or dispatch here
      }
    }
    return Promise.reject(error);
  }
);

export default api;
