/**
 * Cache Manager Utility
 * Provides comprehensive cache management for the PWA
 * to prevent stale authentication responses from being served
 */

const logger = {
  info: (message, data = {}) => {
    console.log(`[CACHE] ${message}`, {
      timestamp: new Date().toISOString(),
      ...data
    });
  },
  warn: (message, data = {}) => {
    console.warn(`[CACHE] ${message}`, {
      timestamp: new Date().toISOString(),
      ...data
    });
  },
  error: (message, data = {}) => {
    console.error(`[CACHE] ${message}`, {
      timestamp: new Date().toISOString(),
      ...data
    });
  }
};

class CacheManager {
  /**
   * Clear all caches (both CacheStorage API and service worker caches)
   * This is the nuclear option - use when auth state changes
   */
  async clearAllCaches(reason = 'unknown') {
    logger.info('Clearing all caches', { reason });
    
    const results = {
      cacheStorage: false,
      serviceWorker: false,
      errors: []
    };
    
    // Clear CacheStorage API caches
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        logger.info('Found caches to clear', { count: cacheNames.length, cacheNames });
        
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        results.cacheStorage = true;
        
        logger.info('CacheStorage cleared successfully', { 
          clearedCount: cacheNames.length 
        });
      }
    } catch (error) {
      logger.error('Failed to clear CacheStorage', { error: error.message });
      results.errors.push({ type: 'cacheStorage', error: error.message });
    }
    
    // Tell service worker to clear its internal caches
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_ALL_CACHES',
          reason
        });
        results.serviceWorker = true;
        
        logger.info('Sent CLEAR_ALL_CACHES message to service worker', { reason });
      }
    } catch (error) {
      logger.warn('Failed to message service worker', { error: error.message });
      results.errors.push({ type: 'serviceWorker', error: error.message });
    }
    
    return results;
  }
  
  /**
   * Clear only API-related caches
   * Less destructive than clearing all caches
   */
  async clearApiCaches() {
    logger.info('Clearing API caches');
    
    const results = {
      cacheStorage: false,
      serviceWorker: false,
      clearedCaches: [],
      errors: []
    };
    
    // Clear API caches from CacheStorage
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const apiCaches = cacheNames.filter(name => 
          name.includes('api-cache') || 
          name.includes('runtime') ||
          name.includes('auth')
        );
        
        logger.info('Found API caches to clear', { count: apiCaches.length, caches: apiCaches });
        
        await Promise.all(apiCaches.map(name => caches.delete(name)));
        results.cacheStorage = true;
        results.clearedCaches = apiCaches;
        
        logger.info('API caches cleared successfully', { 
          clearedCount: apiCaches.length 
        });
      }
    } catch (error) {
      logger.error('Failed to clear API caches', { error: error.message });
      results.errors.push({ type: 'cacheStorage', error: error.message });
    }
    
    // Tell service worker to clear API caches
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_API_CACHE'
        });
        results.serviceWorker = true;
        
        logger.info('Sent CLEAR_API_CACHE message to service worker');
      }
    } catch (error) {
      logger.warn('Failed to message service worker', { error: error.message });
      results.errors.push({ type: 'serviceWorker', error: error.message });
    }
    
    return results;
  }
  
  /**
   * Clear all storage (localStorage, sessionStorage, IndexedDB, caches)
   * This is the most destructive option - use only for complete reset
   */
  async clearAllStorage() {
    logger.warn('Clearing ALL storage (localStorage, sessionStorage, IndexedDB, caches)');
    
    const results = {
      localStorage: false,
      sessionStorage: false,
      indexedDB: false,
      caches: false,
      errors: []
    };
    
    // Clear localStorage
    try {
      localStorage.clear();
      results.localStorage = true;
      logger.info('localStorage cleared');
    } catch (error) {
      logger.error('Failed to clear localStorage', { error: error.message });
      results.errors.push({ type: 'localStorage', error: error.message });
    }
    
    // Clear sessionStorage
    try {
      sessionStorage.clear();
      results.sessionStorage = true;
      logger.info('sessionStorage cleared');
    } catch (error) {
      logger.error('Failed to clear sessionStorage', { error: error.message });
      results.errors.push({ type: 'sessionStorage', error: error.message });
    }
    
    // Clear IndexedDB
    try {
      if ('indexedDB' in window) {
        const dbs = await indexedDB.databases();
        await Promise.all(dbs.map(db => {
          return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(db.name);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }));
        results.indexedDB = true;
        logger.info('IndexedDB cleared', { count: dbs.length });
      }
    } catch (error) {
      logger.error('Failed to clear IndexedDB', { error: error.message });
      results.errors.push({ type: 'indexedDB', error: error.message });
    }
    
    // Clear all caches
    try {
      const cacheResults = await this.clearAllCaches('storage_reset');
      results.caches = cacheResults.cacheStorage;
    } catch (error) {
      logger.error('Failed to clear caches', { error: error.message });
      results.errors.push({ type: 'caches', error: error.message });
    }
    
    return results;
  }
  
  /**
   * Check current cache status
   */
  async getCacheStatus() {
    const status = {
      cacheNames: [],
      totalCaches: 0,
      serviceWorkerActive: false,
      serviceWorkerState: 'none'
    };
    
    // Get cache names
    try {
      if ('caches' in window) {
        status.cacheNames = await caches.keys();
        status.totalCaches = status.cacheNames.length;
      }
    } catch (error) {
      logger.warn('Failed to get cache status', { error: error.message });
    }
    
    // Get service worker status
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          status.serviceWorkerActive = !!registration.active;
          status.serviceWorkerState = registration.active?.state || 'none';
        }
      }
    } catch (error) {
      logger.warn('Failed to get service worker status', { error: error.message });
    }
    
    return status;
  }
  
  /**
   * Unregister service worker completely
   * Use this as a last resort when service worker is causing issues
   */
  async unregisterServiceWorker() {
    logger.warn('Unregistering service worker');
    
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        
        logger.info('Service worker unregistered', { 
          count: registrations.length 
        });
        
        return { success: true, count: registrations.length };
      }
    } catch (error) {
      logger.error('Failed to unregister service worker', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

export default cacheManager;

// Named exports for convenience
export const clearAllCaches = (reason) => cacheManager.clearAllCaches(reason);
export const clearApiCaches = () => cacheManager.clearApiCaches();
export const clearAllStorage = () => cacheManager.clearAllStorage();
export const getCacheStatus = () => cacheManager.getCacheStatus();
export const unregisterServiceWorker = () => cacheManager.unregisterServiceWorker();
