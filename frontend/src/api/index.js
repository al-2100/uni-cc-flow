import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor: Agregar token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== AUTH ====================

export const authService = {
  async register(email, password) {
    const { data } = await api.post('/register', { email, password });
    localStorage.setItem('token', data.access_token);
    return data;
  },

  async login(email, password) {
    const { data } = await api.post('/login', 
      `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    localStorage.setItem('token', data.access_token);
    return data;
  },

  async getMe() {
    const { data } = await api.get('/me');
    return data;
  },

  logout() {
    localStorage.removeItem('token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};

// ==================== GRAPH ====================

export const graphService = {
  async getGraph() {
    const { data } = await api.get('/graph');
    return data;
  }
};

// ==================== PROGRESS ====================

export const progressService = {
  async getProgress() {
    const { data } = await api.get('/progress');
    return data;
  },

  async syncProgress(progressList) {
    const { data } = await api.post('/sync-progress', { progress: progressList });
    return data;
  }
};

export default api;
