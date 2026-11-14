import axios from 'axios';
import useAuthStore from '../context/authStore';
import useTenantStore from '../context/tenantStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const slug = useTenantStore.getState().slug;
  if (slug && !String(config.url || '').startsWith('/refugios')) {
    config.headers['X-Refugio-Slug'] = slug;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/registro')) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
