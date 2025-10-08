import axios from 'axios';

/**
 * API client for Bowling App
 * Uses relative /api path which is:
 * - Proxied by Vite dev server to localhost:5000 in development
 * - Proxied by nginx to backend:5000 in production
 */

// Enhanced logging utility for frontend
const logger = {
  info: (message, data = {}) => {
    console.log(`[API] ${message}`, {
      timestamp: new Date().toISOString(),
      level: 'info',
      ...data
    });
  },
  warn: (message, data = {}) => {
    console.warn(`[API] ${message}`, {
      timestamp: new Date().toISOString(),
      level: 'warn',
      ...data
    });
  },
  error: (message, data = {}) => {
    console.error(`[API] ${message}`, {
      timestamp: new Date().toISOString(),
      level: 'error',
      ...data
    });
  },
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API] ${message}`, {
        timestamp: new Date().toISOString(),
        level: 'debug',
        ...data
      });
    }
  }
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the API base URL for debugging
logger.info('API client initialized', {
  baseURL: api.defaults.baseURL,
  timeout: api.defaults.timeout,
  environment: process.env.NODE_ENV
});

// Request interceptor to add auth token and logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add correlation ID for request tracking
    if (!config.headers['X-Correlation-ID']) {
      config.headers['X-Correlation-ID'] = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // For authentication endpoints, ensure we bypass caches/service-worker cached responses
    try {
      const url = config.url || '';
      if (url.includes('/auth')) {
        config.headers['Cache-Control'] = 'no-store';
        config.headers['Pragma'] = 'no-cache';
        config.headers['X-Bypass-SW'] = 'true';
      }
    } catch (e) {
      // ignore
    }
    
    // Log outgoing requests
    logger.debug('API Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      correlationId: config.headers['X-Correlation-ID'],
      hasAuth: !!token
    });
    
    return config;
  },
  (error) => {
    logger.error('Request interceptor error', {
      message: error.message,
      stack: error.stack
    });
    return Promise.reject(error);
  }
);

// Track ongoing refresh to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for success logging and error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    logger.debug('API Response', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      correlationId: response.headers['x-correlation-id'] || response.config.headers['X-Correlation-ID'],
      responseTime: response.headers['x-response-time']
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const correlationId = error.response?.headers['x-correlation-id'] || originalRequest?.headers['X-Correlation-ID'];
    
    // Log the error with context
    logger.error('API Error', {
      method: originalRequest?.method?.toUpperCase(),
      url: originalRequest?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      correlationId,
      errorId: error.response?.headers['x-error-id'],
      message: error.response?.data?.error || error.message,
      isNetworkError: !error.response
    });
    
    // Handle authentication errors (401 Unauthorized and 403 Forbidden for expired tokens)
    if ((error.response?.status === 401 || error.response?.status === 403) && 
        !originalRequest._retry) {
      
      logger.warn('Authentication failed, attempting token refresh', {
        status: error.response.status,
        correlationId,
        url: originalRequest?.url
      });
      
      // Mark this request as a retry to prevent infinite loops
      originalRequest._retry = true;
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        logger.warn('No token found, redirecting to login');
        // Only redirect if not already on login/register page
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If a refresh is already in progress, queue this request
        logger.debug('Token refresh in progress, queueing request', { correlationId });
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;

      try {
        logger.info('Attempting to refresh authentication token');
        
        // Add PWA context headers
        const refreshHeaders = { 
          Authorization: `Bearer ${token}`,
          'X-Correlation-ID': `refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          'X-PWA-Context': 'true'
        };
        
        // Check if this is shortly after a PWA reload
        const lastAuthCheck = sessionStorage.getItem('lastAuthCheck');
        if (lastAuthCheck && (Date.now() - parseInt(lastAuthCheck)) < 10000) {
          refreshHeaders['X-PWA-Reload'] = 'true';
        }
        
        const refreshResponse = await axios.post('/api/auth/refresh', {}, {
          headers: refreshHeaders,
          timeout: 15000 // Increased timeout for PWA scenarios
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
          logger.warn('Could not message service worker to clear cache', { error: swErr.message });
        }
        
        // Update the authorization header with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Process the queue with the new token
        processQueue(null, newToken);
        
        logger.info('Token refreshed successfully, retrying original request', {
          correlationId,
          originalUrl: originalRequest.url
        });
        
        // Retry the original request with new token
        return axios(originalRequest);
        
      } catch (refreshError) {
        logger.error('Token refresh failed', {
          error: refreshError.response?.data || refreshError.message,
          status: refreshError.response?.status,
          correlationId: refreshError.response?.headers['x-correlation-id']
        });
        
        // Process the queue with the error
        processQueue(refreshError, null);
        
        // Be more lenient for PWA-related errors
        const isPwaContext = refreshError.config?.headers?.['X-PWA-Context'] === 'true';
        if (isPwaContext && refreshError.response?.status >= 500) {
          logger.warn('Server error during PWA token refresh, not clearing auth data');
          return Promise.reject(refreshError);
        }
        
        // Clear auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login/register page
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          logger.info('Redirecting to login page due to refresh failure');
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle network errors
    if (!error.response) {
      logger.error('Network error occurred', {
        message: error.message,
        correlationId,
        url: originalRequest?.url
      });
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