import axios from 'axios';

// Dynamically resolve the API host from the browser's current location.
// This means whether the app is accessed via localhost OR a network IP (e.g. 192.168.x.x),
// the API calls always point to the same machine that served the page.
const API_HOST = window.location.hostname;
const BASE_URL = `http://${API_HOST}/snad/backend/public/api/v1`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor to attach the auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to automatically handle 401 Unauthorized (token expiry / invalid session)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
