import axios from 'axios';

/**
 * Determine the API base URL based on environment
 * 
 * Priority:
 * 1. VITE_API_BASE_URL environment variable (for Cloudflare Pages, Netlify, etc.)
 * 2. Production: Use /api (assumes reverse proxy or Cloudflare Worker handles routing)
 * 3. Development: Use localhost:8032/api
 */
const getApiBaseUrl = () => {
  // Check for environment variable first (highest priority)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Server-side rendering fallback
  if (typeof window === 'undefined') {
    return 'http://localhost:8032/api';
  }
  
  // Production: Use relative path /api
  // This works with:
  // - Reverse proxy (Nginx/Traefik) routing /api to backend
  // - Cloudflare Workers proxying /api requests
  // - _redirects file handling /api routing
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  
  // Development: Use localhost with backend port
  return `${window.location.protocol}//${window.location.hostname}:8032/api`;
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the API base URL in development for debugging
if (import.meta.env.DEV) {
  console.log('API Base URL:', api.defaults.baseURL);
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/password', data),
  deleteAccount: () => api.delete('/users/me'),
  searchUsers: (username) => api.get(`/users/search?username=${encodeURIComponent(username)}`),
  getAchievements: () => api.get('/users/me/achievements'),
  // Admin endpoints
  getAllUsers: () => api.get('/admin/users'),
  deleteUserAsAdmin: (userId) => api.delete(`/admin/users/${userId}`),
  updateUserStatus: (userId, status, role) => api.put(`/admin/users/${userId}/status`, { status, role }),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  forceLogout: (userId) => api.post(`/admin/users/${userId}/force-logout`),
  createUser: (userData) => api.post('/admin/users', userData),
  getAdminStats: () => api.get('/admin/stats'),
  getAdminSettings: () => api.get('/admin/settings'),
  updateAdminSetting: (key, value) => api.put(`/admin/settings/${key}`, { value }),
  getSystemLogs: (page = 1, limit = 50) => api.get(`/admin/logs?page=${page}&limit=${limit}`),
  bulkUserOperation: (action, userIds) => api.post('/admin/users/bulk', { action, userIds }),
  createBackup: () => api.post('/admin/backup'),
  // Admin user functionality (same as regular users but for admins)
  getAdminProfile: () => api.get('/admin/user-profile'),
  updateAdminProfile: (data) => api.put('/admin/user-profile', data),
  changeAdminPassword: (data) => api.put('/admin/user-password', data),
};

// Games API calls
export const gameAPI = {
  createGame: (gameData) => api.post('/games', gameData),
  getGames: (page = 1, limit = 20) => api.get(`/games?page=${page}&limit=${limit}`),
  getGame: (gameId) => api.get(`/games/${gameId}`),
  updateGame: (gameId, gameData) => api.put(`/games/${gameId}`, gameData),
  deleteGame: (gameId) => api.delete(`/games/${gameId}`),
  submitFrame: (gameId, frameData) => api.post(`/games/${gameId}/frames`, frameData),
  getUserGames: (userId) => api.get(`/games/user/${userId}`),
};

// Balls API calls
export const ballAPI = {
  getBalls: () => api.get('/balls'),
  createBall: (ballData) => api.post('/balls', ballData),
  getBall: (ballId) => api.get(`/balls/${ballId}`),
  updateBall: (ballId, ballData) => api.put(`/balls/${ballId}`, ballData),
  deleteBall: (ballId) => api.delete(`/balls/${ballId}`),
};

// Friends API calls
export const friendAPI = {
  getFriends: () => api.get('/friends'),
  getFriendRequests: () => api.get('/friends/requests'),
  sendFriendRequest: (userId) => api.post('/friends/requests', { userId }),
  respondToRequest: (requestId, status) => api.put(`/friends/requests/${requestId}`, { status }),
};

export default api;
// Named export for convenience (some files import { api })
export { api };