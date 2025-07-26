import axios from 'axios';
import { getToken, logout } from './auth';

const API_BASE_URL = 'https://tax-auto-backend-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Log requests for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      console.log('Token expired, logging out...');
      logout();
      window.location.href = '/login?reason=expired';
    } else if (error.response?.status === 404) {
      console.warn('Endpoint not found:', error.config?.url);
    } else if (error.response?.status === 422) {
      console.warn('Validation error:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default api;