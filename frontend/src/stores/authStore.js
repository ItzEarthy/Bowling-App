import { create } from 'zustand';
import { authAPI } from '../lib/api';

/**
 * Authentication store using Zustand
 * Manages user authentication state and provides auth methods
 */

// Enhanced logging utility
const logger = {
  info: (message, data = {}) => {
    console.log(`[AUTH] ${message}`, {
      timestamp: new Date().toISOString(),
      level: 'info',
      ...data
    });
  },
  warn: (message, data = {}) => {
    console.warn(`[AUTH] ${message}`, {
      timestamp: new Date().toISOString(),
      level: 'warn',
      ...data
    });
  },
  error: (message, data = {}) => {
    console.error(`[AUTH] ${message}`, {
      timestamp: new Date().toISOString(),
      level: 'error',
      ...data
    });
  },
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[AUTH] ${message}`, {
        timestamp: new Date().toISOString(),
        level: 'debug',
        ...data
      });
    }
  }
};
const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Initialize auth from localStorage
  initialize: () => {
    logger.info('Initializing authentication store');
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        logger.info('Restoring authentication from localStorage', {
          userId: user.id,
          username: user.username
        });
        
        set({
          user,
          token,
          isAuthenticated: true,
          error: null
        });
        
        // Check token validity and start periodic refresh
        get().validateAndRefreshToken();
        
      } catch (error) {
        logger.error('Failed to parse stored user data', {
          error: error.message
        });
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    } else {
      logger.debug('No stored authentication found');
    }
  },

  // Validate token and set up periodic refresh
  validateAndRefreshToken: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      // Decode token to check expiration (without verifying signature)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      
      logger.debug('Token validation check', {
        userId: payload.userId,
        expiresIn: `${Math.floor(timeUntilExpiry / 3600)} hours`,
        expiresAt: new Date(payload.exp * 1000).toISOString()
      });
      
      // If token expires in less than 7 days, refresh it
      if (timeUntilExpiry < 604800) { // 7 days in seconds
        logger.info('Token expires within 7 days, refreshing');
        await get().refreshToken();
      }
      
      // Set up next check - check more frequently as expiration approaches
      let nextCheckInterval;
      if (timeUntilExpiry < 86400) { // Less than 1 day
        nextCheckInterval = 3600000; // Check every hour
      } else if (timeUntilExpiry < 604800) { // Less than 7 days
        nextCheckInterval = 43200000; // Check every 12 hours
      } else {
        nextCheckInterval = 86400000; // Check once per day
      }
      
      logger.debug('Scheduling next token validation', {
        nextCheckIn: `${Math.floor(nextCheckInterval / 3600000)} hours`
      });
      
      setTimeout(() => {
        if (get().isAuthenticated) {
          get().validateAndRefreshToken();
        }
      }, nextCheckInterval);
      
    } catch (error) {
      logger.warn('Token validation failed', {
        error: error.message
      });
      // Token is invalid, clear it
      get().logout();
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      logger.info('Refreshing authentication token');
      const response = await authAPI.refresh();
      const { user, token } = response.data;
      
      // Store updated data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        error: null
      });
      
      logger.info('Token refreshed successfully', {
        userId: user.id,
        username: user.username
      });
      return { success: true };
      
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        isNetworkError: !error.response
      });
      
      // If refresh fails due to network error, don't logout immediately
      if (!error.response) {
        logger.warn('Network error during refresh, keeping current session');
        return { success: false, networkError: true };
      }
      
      // Only logout on authentication errors (401, 403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        logger.warn('Authentication failed during refresh, logging out');
        get().logout();
      }
      
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Login action
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    logger.info('Login attempt', { identifier: credentials.emailOrUsername });
    
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data;
      
      // Store in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      logger.info('Login successful', {
        userId: user.id,
        username: user.username
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      logger.error('Login failed', {
        error: errorMessage,
        status: error.response?.status,
        correlationId: error.response?.data?.correlationId
      });
      
      set({
        isLoading: false,
        error: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  },

  // Register action
  register: async (userData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data;
      
      // Store in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      set({
        isLoading: false,
        error: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  },

  // Logout action
  logout: async () => {
    const user = get().user;
    logger.info('User logout', {
      userId: user?.id,
      username: user?.username
    });
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear service worker caches to ensure fresh data on next login
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.includes('api-cache'))
            .map(name => caches.delete(name))
        );
        logger.debug('API cache cleared on logout');
      } catch (error) {
        logger.warn('Failed to clear caches', { error: error.message });
      }
    }
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  },

  // Update user profile
  updateUser: (userData) => {
    const updatedUser = { ...get().user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

export default useAuthStore;