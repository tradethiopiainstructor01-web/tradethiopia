// src/services/axiosInstance.js

import axios from 'axios';

// Create axios instance with baseURL and authorization header setup
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const axiosInstance = axios.create({
  baseURL,
});

// Add an interceptor to add JWT token to every request if it's available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Get token from localStorage
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`; // Add token to request header
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosInstance;
