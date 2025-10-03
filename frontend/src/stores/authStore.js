import { create } from 'zustand';
import { authAPI } from '../lib/api';

/**
 * Authentication store using Zustand
 * Manages user authentication state and provides auth methods
 */
const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Initialize auth from localStorage
  initialize: () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        set({
          user,
          token,
          isAuthenticated: true,
          error: null
        });
        
        // Check token validity and start periodic refresh
        get().validateAndRefreshToken();
        
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
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
      
      // If token expires in less than 1 day, refresh it
      if (timeUntilExpiry < 86400) { // 24 hours
        console.log('Token expires soon, refreshing...');
        await get().refreshToken();
      }
      
      // Set up periodic check every hour
      setTimeout(() => {
        if (get().isAuthenticated) {
          get().validateAndRefreshToken();
        }
      }, 3600000); // 1 hour
      
    } catch (error) {
      console.warn('Token validation failed:', error);
      // Token is invalid, clear it
      get().logout();
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
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
      
      console.log('Token refreshed successfully');
      return { success: true };
      
    } catch (error) {
      console.warn('Token refresh failed:', error);
      // Refresh failed, logout user
      get().logout();
      return { success: false };
    }
  },

  // Login action
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    
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
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
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
        console.log('API cache cleared on logout');
      } catch (error) {
        console.warn('Failed to clear caches:', error);
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