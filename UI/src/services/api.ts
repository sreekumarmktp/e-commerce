import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : '/api',
  timeout: 60000, // 60 seconds timeout for file uploads
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Increase timeout for file uploads
    if (config.url?.includes('images')) {
      config.timeout = 120000; // 2 minutes for image uploads
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

