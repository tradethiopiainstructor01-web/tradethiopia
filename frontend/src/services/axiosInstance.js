// src/services/axiosInstance.js

import axios from 'axios';
import { useUserStore } from '../store/user';
import { useNavigate } from 'react-router-dom';

// Create axios instance with baseURL and authorization header setup
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const axiosInstance = axios.create({
  baseURL,
});

// Add an interceptor to add JWT token to every request if it's available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken'); // Get token from localStorage
  console.log('Axios interceptor - Token:', token ? 'Present' : 'Missing');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`; // Add token to request header
    console.log('Axios interceptor - Token attached to request');
  } else {
    console.log('Axios interceptor - No token to attach');
  }
  console.log('Axios interceptor - Request config:', config);
  return config;
}, (error) => {
  console.error('Axios interceptor - Request error:', error);
  return Promise.reject(error);
});

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Axios response:', response);
    return response;
  },
  (error) => {
    console.error('Axios response error:', error);
    // If the server returns 401 (unauthorized), clear local user and redirect to login
    try {
      const status = error?.response?.status;
      if (status === 401) {
        // Clear Zustand store and localStorage
        const clearUser = useUserStore.getState().clearUser;
        if (typeof clearUser === 'function') {
          clearUser();
        } else {
          // Fallback
          localStorage.removeItem('userToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userName');
          localStorage.removeItem('userStatus');
          localStorage.removeItem('infoStatus');
          localStorage.removeItem('userId');
        }

        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } catch (e) {
      console.error('Error handling 401 response:', e);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;