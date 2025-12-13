import axios, { type AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/api';

// Spring Boot API instance
export const springApi: AxiosInstance = axios.create({
  baseURL: API_CONFIG.SPRING_BOOT_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// FastAPI instance
export const fastApi: AxiosInstance = axios.create({
  baseURL: API_CONFIG.FASTAPI_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token (for both Spring Boot and FastAPI)
const addTokenInterceptor = (config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

springApi.interceptors.request.use(addTokenInterceptor, (error) => Promise.reject(error));
fastApi.interceptors.request.use(addTokenInterceptor, (error) => Promise.reject(error));

// Response interceptor for error handling
springApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// FastAPI response interceptor (same error handling)
fastApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default { springApi, fastApi };
