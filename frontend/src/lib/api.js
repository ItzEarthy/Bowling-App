import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  searchUsers: (username) => api.get(`/users/search?username=${encodeURIComponent(username)}`),
};

// Games API calls
export const gameAPI = {
  createGame: (gameData) => api.post('/games', gameData),
  getGames: (page = 1, limit = 20) => api.get(`/games?page=${page}&limit=${limit}`),
  getGame: (gameId) => api.get(`/games/${gameId}`),
  submitFrame: (gameId, frameData) => api.post(`/games/${gameId}/frames`, frameData),
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