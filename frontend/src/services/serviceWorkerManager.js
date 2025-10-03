/**
 * Enhanced Service Worker Registration with better error handling
 */

import { setupUpdateChecker as originalSetupUpdateChecker } from '../registerSW';
import ServiceWorkerDebugger from '../utils/serviceWorkerDebugger';

// Service Worker Error Recovery System
class ServiceWorkerManager {
  constructor() {
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    this.updateCheckInterval = null;
  }

  async initialize() {
    if (!('serviceWorker' in navigator)) {
      console.log('ℹ️ Service Workers not supported in this browser');
      return;
    }

    try {
      await this.registerWithRetry();
    } catch (error) {
      console.error('❌ Service Worker registration failed after all retries:', error);
      // Continue without service worker - app should still work
    }
  }

  async registerWithRetry() {
    try {
      await originalSetupUpdateChecker();
      console.log('✅ Service Worker setup completed successfully');
      this.retryCount = 0; // Reset retry count on success
    } catch (error) {
      this.retryCount++;
      
      // Run diagnostics on failure
      const report = await ServiceWorkerDebugger.diagnose();
      ServiceWorkerDebugger.printReport(report);
      
      // Handle specific 403 errors
      if (error.message && error.message.includes('403')) {
        console.log('🛡️ Detected 403 error - attempting recovery...');
        await this.handle403Error();
        return;
      }
      
      if (this.retryCount <= this.maxRetries) {
        console.warn(`⚠️ Service Worker setup failed (attempt ${this.retryCount}/${this.maxRetries}):`, error);
        console.log(`🔄 Retrying in ${this.retryDelay / 1000} seconds...`);
        
        setTimeout(() => {
          this.registerWithRetry();
        }, this.retryDelay);
        
        // Increase delay for next retry
        this.retryDelay *= 1.5;
      } else {
        throw error;
      }
    }
  }

  // Handle 403 errors specifically
  async handle403Error() {
    console.log('🛡️ Handling service worker 403 error...');
    
    // Clear all service worker data
    await ServiceWorkerDebugger.clearAllServiceWorkerData();
    
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to re-register with a fresh start
    this.retryCount = 0;
    this.retryDelay = 5000;
    
    setTimeout(() => {
      this.registerWithRetry();
    }, 1000);
  }

  // Check if service worker is working properly
  async healthCheck() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        return true;
      }
    } catch (error) {
      console.warn('Service worker health check failed:', error);
    }
    return false;
  }

  cleanup() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

// Enhanced setup function that handles errors gracefully
export async function setupUpdateCheckerWithRetry() {
  await serviceWorkerManager.initialize();
}

// Export manager for use in other parts of the app
export { serviceWorkerManager };

export default serviceWorkerManager;