import axios from "axios";

// Resolve base URL safely for dev & production
const BASE_URL =
  import.meta.env.VITE_API_URL 
  (import.meta.env.DEV ? "http://localhost:5000" : "");

if (!BASE_URL) {
  console.error("❌ VITE_API_URL is not defined in production");
}

// Create axios instance
const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor – attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – global auth handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Axios response error:", error?.response  error);

    if (error.response?.status === 401) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userRole");

      // Prevent redirect loop
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
