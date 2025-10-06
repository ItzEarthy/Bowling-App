/**
 * App Lifecycle Manager
 * Handles app suspension, resume, and visibility changes to auto-save game state
 */

import useGameStore from '../stores/gameStore';
import useAuthStore from '../stores/authStore';
import serviceWorkerManager from './serviceWorkerManager';

class AppLifecycleManager {
  constructor() {
    this.isInitialized = false;
    this.saveTimeout = null;
    this.lastSaveTime = 0;
    this.minSaveInterval = 2000; // Minimum 2 seconds between saves
  }

  /**
   * Initialize lifecycle event listeners
   */
  initialize() {
    if (this.isInitialized) return;

    console.log('🔄 Initializing App Lifecycle Manager');

    // Page visibility change (tab switching, mobile app backgrounding)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Before page unload (browser/tab closing)
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    // Page focus/blur events
    window.addEventListener('focus', this.handleFocus.bind(this));
    window.addEventListener('blur', this.handleBlur.bind(this));

    // Mobile-specific events
    if ('serviceWorker' in navigator) {
      // Listen for service worker messages about app state
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
        // Listen for window-level messages (for commands like CLEAR_API_CACHE)
        window.addEventListener('message', this.handleWindowMessage.bind(this));
    }

    // Page freeze/resume (mobile browsers)
    if ('onfreeze' in document) {
      document.addEventListener('freeze', this.handleFreeze.bind(this));
      document.addEventListener('resume', this.handleResume.bind(this));
    }

    // Memory pressure warnings
    if ('memory' in performance) {
      this.monitorMemoryPressure();
    }

    // Auto-save interval (backup mechanism)
    this.startAutoSaveInterval();

    this.isInitialized = true;
  }

  /**
   * Handle page visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      console.log('📱 App going to background - auto-saving...');
      this.saveGameState();
    } else {
      console.log('📱 App returning to foreground');
      this.checkForStateRestoration();
    }
  }

  /**
   * Handle before page unload
   */
  handleBeforeUnload(event) {
    console.log('🚪 Page unloading - saving game state...');
    this.saveGameState();
    
    const gameStore = useGameStore.getState();
    if (gameStore.currentGame && !gameStore.gameComplete) {
      // Show warning for unsaved game
      const message = 'You have a game in progress. Your progress has been auto-saved.';
      event.returnValue = message;
      return message;
    }
  }

  /**
   * Handle window focus
   */
  handleFocus() {
    console.log('👀 Window focused');
    this.checkForStateRestoration();
  }

  /**
   * Handle window blur
   */
  handleBlur() {
    console.log('👀 Window blurred - auto-saving...');
    this.saveGameState();
  }

  /**
   * Handle page freeze (mobile)
   */
  handleFreeze() {
    console.log('🧊 Page frozen - emergency save...');
    this.saveGameState();
  }

  /**
   * Handle page resume (mobile)
   */
  handleResume() {
    console.log('🔥 Page resumed');
    this.checkForStateRestoration();
  }

  /**
   * Handle service worker messages
   */
  handleServiceWorkerMessage(event) {
    if (event.data && event.data.type === 'APP_BACKGROUNDED') {
      console.log('📱 Service worker detected app backgrounded');
      this.saveGameState();
    }
  }

    handleWindowMessage(event) {
      // Forward to service worker manager for handling
      if (event && event.data && event.data.type) {
        serviceWorkerManager.handleClientMessage(event.data);
      }
    }

  /**
   * Save current game state with throttling
   */
  saveGameState() {
    const now = Date.now();
    
    // Throttle saves to prevent excessive localStorage writes
    if (now - this.lastSaveTime < this.minSaveInterval) {
      // Clear existing timeout and set a new one
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }

        // Remove window message listener
        window.removeEventListener('message', this.handleWindowMessage.bind(this));
      
      this.saveTimeout = setTimeout(() => {
        this.performSave();
      }, this.minSaveInterval - (now - this.lastSaveTime));
      
      return;
    }

    this.performSave();
  }

  /**
   * Perform the actual save operation
   */
  performSave() {
    try {
      const gameStore = useGameStore.getState();
      const authStore = useAuthStore.getState();

      // Only save if user is authenticated and has a game in progress
      if (authStore.isAuthenticated && gameStore.currentGame) {
        gameStore.saveGameState();
        this.lastSaveTime = Date.now();
        
        // Also save auth token refresh time to prevent session loss
        localStorage.setItem('lastActivityTime', Date.now().toString());
      }
    } catch (error) {
      console.warn('Failed to save app state:', error);
    }
  }

  /**
   * Check if we should restore a saved state
   */
  checkForStateRestoration() {
    try {
      const gameStore = useGameStore.getState();
      const authStore = useAuthStore.getState();

      // Only check for restoration if user is authenticated and no current game
      if (authStore.isAuthenticated && !gameStore.currentGame && gameStore.hasSavedGame()) {
        const savedGameInfo = gameStore.getSavedGameInfo();
        
        if (savedGameInfo && !savedGameInfo.gameComplete) {
          // Show restoration prompt
          this.showRestorationPrompt(savedGameInfo);
        }
      }
    } catch (error) {
      console.warn('Failed to check for state restoration:', error);
    }
  }

  /**
   * Show game restoration prompt (deprecated - handled by modal)
   */
  showRestorationPrompt(savedGameInfo) {
    // This is now handled by the GameRestorationModal component
    console.log('📋 Game restoration handled by modal component');
  }

  /**
   * Format time since last save
   */
  formatTimeSince(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Start auto-save interval as backup
   */
  startAutoSaveInterval() {
    // Auto-save every 30 seconds as a backup mechanism
    setInterval(() => {
      const gameStore = useGameStore.getState();
      const authStore = useAuthStore.getState();
      
      if (authStore.isAuthenticated && gameStore.currentGame && !gameStore.gameComplete) {
        this.saveGameState();
      }
    }, 30000); // 30 seconds
  }

  /**
   * Monitor memory pressure and save state if memory is low
   */
  monitorMemoryPressure() {
    // Check memory usage periodically
    setInterval(() => {
      if (performance.memory) {
        const memoryRatio = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        
        // If memory usage is above 80%, trigger a save
        if (memoryRatio > 0.8) {
          console.log('⚠️ High memory usage detected - auto-saving...');
          this.saveGameState();
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Cleanup listeners (call when app is destroyed)
   */
  cleanup() {
    if (!this.isInitialized) return;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('blur', this.handleBlur);

    if ('onfreeze' in document) {
      document.removeEventListener('freeze', this.handleFreeze);
      document.removeEventListener('resume', this.handleResume);
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.isInitialized = false;
  }
}

// Create singleton instance
const appLifecycleManager = new AppLifecycleManager();

export default appLifecycleManager;