import axios from 'axios';

/**
 * API client for Bowling App
 * Uses relative /api path which is:
 * - Proxied by Vite dev server to localhost:5000 in development
 * - Proxied by nginx to backend:5000 in production
 */

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the API base URL for debugging
console.log('API Base URL:', api.defaults.baseURL);

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
  async (error) => {
    // Handle authentication errors (401 Unauthorized and 403 Forbidden for expired tokens)
    if (error.response?.status === 401 || 
        (error.response?.status === 403 && error.response?.data?.error?.includes('expired token'))) {
      console.warn('Authentication failed - attempting token refresh');
      
      // Try to refresh the token before redirecting to login
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const refreshResponse = await axios.post('/api/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const { user, token: newToken } = refreshResponse.data;
          
          // Update localStorage with new data
          localStorage.setItem('authToken', newToken);
          localStorage.setItem('user', JSON.stringify(user));

          // Inform service worker to clear API cache so it won't serve a stale 403
          try {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_API_CACHE' });
            }
          } catch (swErr) {
            console.warn('Could not message service worker to clear cache:', swErr);
          }
          
          // Retry the original request with new token
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          console.log('Token refreshed successfully, retrying request');
          return axios(originalRequest);
          
        } catch (refreshError) {
          console.warn('Token refresh failed, clearing session and redirecting to login');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          // Only redirect if not already on login/register page
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
          }
        }
      } else {
        console.warn('No token found, redirecting to login');
        // Only redirect if not already on login/register page
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
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
  refresh: () => api.post('/auth/refresh'),
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