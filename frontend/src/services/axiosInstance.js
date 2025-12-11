import axios from 'axios';

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', // Updated to use port 5000
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Axios response error:', error);
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;