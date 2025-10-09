import { create } from 'zustand';
import { authAPI } from '../lib/api';
import cacheManager from '../utils/cacheManager';

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
  initialize: async () => {
    logger.info('Initializing authentication store');
    
    // Check if this is a PWA update reload
    const isPwaReload = sessionStorage.getItem('pwaUpdateReload') === 'true';
    if (isPwaReload) {
      logger.info('Detected PWA update reload - preserving authentication');
      sessionStorage.removeItem('pwaUpdateReload');
    }
    
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        
        // CRITICAL FIX: Validate token BEFORE setting authenticated state
        // Decode token to check expiration
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          const timeUntilExpiry = payload.exp - currentTime;
          
          logger.debug('Token validation on init', {
            userId: payload.userId,
            expiresIn: `${Math.floor(timeUntilExpiry / 3600)} hours`,
            expiresAt: new Date(payload.exp * 1000).toISOString(),
            isExpired: timeUntilExpiry <= 0
          });
          
          // If token is expired, clear it immediately and don't set authenticated state
          if (timeUntilExpiry <= 0) {
            logger.warn('Token expired on initialization - clearing auth state', {
              userId: payload.userId,
              expiredAgo: `${Math.floor(Math.abs(timeUntilExpiry) / 3600)} hours`
            });
            
            // Clear everything
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            
            // Clear all caches to prevent stale auth responses
            await cacheManager.clearAllCaches('expired_token');
            
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              error: 'Your session has expired. Please log in again.'
            });
            
            return; // Exit early - don't restore expired session
          }
        } catch (decodeError) {
          logger.error('Failed to decode token during initialization', {
            error: decodeError.message
          });
          // Token is malformed, clear it
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          return;
        }
        
        // Token is valid, restore session
        logger.info('Restoring valid authentication from localStorage', {
          userId: user.id,
          username: user.username,
          isPwaReload
        });
        
        set({
          user,
          token,
          isAuthenticated: true,
          error: null
        });
        
        // For PWA reloads, be more lenient with token validation
        if (isPwaReload) {
          // Delay token validation slightly to allow the app to stabilize
          setTimeout(() => {
            get().validateAndRefreshToken();
          }, 2000);
        } else {
          // Check token validity and start periodic refresh
          get().validateAndRefreshToken();
        }
        
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
      
      // Add extra headers for PWA context
      const headers = {
        'X-PWA-Context': 'true'
      };
      
      // Check if this is shortly after a PWA reload
      const lastAuthCheck = sessionStorage.getItem('lastAuthCheck');
      if (lastAuthCheck && (Date.now() - parseInt(lastAuthCheck)) < 10000) {
        headers['X-PWA-Reload'] = 'true';
        sessionStorage.removeItem('lastAuthCheck');
      }
      
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
      
      // For PWA contexts, be more lenient with certain errors
      const isPwaContext = error.config?.headers?.['X-PWA-Context'] === 'true';
      if (isPwaContext && error.response?.status === 500) {
        logger.warn('Server error during PWA refresh, retrying later');
        return { success: false, retryLater: true };
      }
      
      // Only logout on authentication errors (401, 403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        logger.warn('Authentication failed during refresh');
        // For PWA/offline contexts, surface a recoverable error rather than forcibly logging out
        // Set an error flag so UI can prompt the user to re-authenticate when they return online
        set({ error: 'Session expired. Please sign in again.' });
        return { success: false, authError: true };
      }
      
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Login action
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    logger.info('Login attempt', { identifier: credentials.emailOrUsername });
    
    // CRITICAL FIX: Clear all caches before login to prevent stale auth responses
    try {
      await cacheManager.clearAllCaches('pre_login');
    } catch (cacheError) {
      logger.warn('Failed to clear caches before login', { 
        error: cacheError.message 
      });
      // Continue with login even if cache clearing fails
    }
    
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
    
    // Clear localStorage first
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Comprehensive cache clearing - clear ALL caches to prevent stale auth data
    try {
      await cacheManager.clearAllCaches('logout');
    } catch (error) {
      logger.error('Failed to clear caches during logout', { error: error.message });
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