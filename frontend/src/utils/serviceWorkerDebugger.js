/**
 * Service Worker Debug Tools
 * Helps diagnose and fix service worker issues
 */

export class ServiceWorkerDebugger {
  static async diagnose() {
    const report = {
      timestamp: new Date().toISOString(),
      serviceWorkerSupported: 'serviceWorker' in navigator,
      currentUrl: window.location.href,
      issues: [],
      recommendations: []
    };

    // Check if service workers are supported
    if (!report.serviceWorkerSupported) {
      report.issues.push('Service Workers not supported in this browser');
      report.recommendations.push('Update to a modern browser');
      return report;
    }

    try {
      // Check current registration
      const registration = await navigator.serviceWorker.getRegistration();
      report.hasRegistration = !!registration;
      
      if (registration) {
        report.registration = {
          scope: registration.scope,
          updateViaCache: registration.updateViaCache,
          state: {
            installing: !!registration.installing,
            waiting: !!registration.waiting,
            active: !!registration.active
          }
        };

        if (registration.active) {
          report.activeWorker = {
            scriptURL: registration.active.scriptURL,
            state: registration.active.state
          };
        }
      } else {
        report.issues.push('No service worker registration found');
        report.recommendations.push('Service worker may have failed to register');
      }

      // Check if service worker file is accessible
      try {
        const swResponse = await fetch('/sw.js', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        report.serviceWorkerFileAccessible = swResponse.ok;
        report.serviceWorkerFileStatus = swResponse.status;
        
        if (!swResponse.ok) {
          report.issues.push(`Service worker file returns ${swResponse.status}`);
          if (swResponse.status === 403) {
            report.recommendations.push('Check server permissions for /sw.js');
          } else if (swResponse.status === 404) {
            report.recommendations.push('Service worker file not found - rebuild app');
          }
        }
      } catch (error) {
        report.issues.push(`Cannot fetch service worker file: ${error.message}`);
        report.recommendations.push('Check network connectivity');
      }

      // Check cache API
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        report.cacheNames = cacheNames;
        report.cacheCount = cacheNames.length;
      } else {
        report.issues.push('Cache API not supported');
      }

      // Check for update conflicts
      if (registration && registration.waiting) {
        report.issues.push('Service worker update waiting to activate');
        report.recommendations.push('Refresh page to activate update');
      }

    } catch (error) {
      report.issues.push(`Service worker check failed: ${error.message}`);
      report.recommendations.push('Clear browser cache and try again');
    }

    return report;
  }

  static async clearAllServiceWorkerData() {
    console.log('🧹 Clearing all service worker data...');
    
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('🗑️ Unregistered service worker:', registration.scope);
        }
      }

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          console.log('🗑️ Deleted cache:', cacheName);
        }
      }

      // Clear localStorage items related to service worker
      const swKeys = Object.keys(localStorage).filter(key => 
        key.includes('workbox') || 
        key.includes('sw') || 
        key.includes('serviceWorker') ||
        key.includes('pwa')
      );
      
      swKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ Removed localStorage key:', key);
      });

      console.log('✅ All service worker data cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear service worker data:', error);
      return false;
    }
  }

  static async forceServiceWorkerUpdate() {
    console.log('🔄 Forcing service worker update...');
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
          await registration.update();
          console.log('✅ Service worker update triggered');
          
          // If there's a waiting worker, skip waiting
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            console.log('⏭️ Skipped waiting for service worker');
          }
          
          return true;
        } else {
          console.warn('⚠️ No service worker registration found');
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Failed to force service worker update:', error);
      return false;
    }
  }

  static printReport(report) {
    console.group('🔍 Service Worker Diagnostic Report');
    console.log('Timestamp:', report.timestamp);
    console.log('Service Worker Supported:', report.serviceWorkerSupported);
    console.log('Has Registration:', report.hasRegistration);
    console.log('SW File Accessible:', report.serviceWorkerFileAccessible);
    console.log('SW File Status:', report.serviceWorkerFileStatus);
    
    if (report.registration) {
      console.log('Registration Info:', report.registration);
    }
    
    if (report.activeWorker) {
      console.log('Active Worker:', report.activeWorker);
    }
    
    if (report.cacheNames && report.cacheNames.length > 0) {
      console.log('Cache Names:', report.cacheNames);
    }
    
    if (report.issues.length > 0) {
      console.warn('Issues Found:', report.issues);
    }
    
    if (report.recommendations.length > 0) {
      console.info('Recommendations:', report.recommendations);
    }
    
    console.groupEnd();
  }
}

// Add debug tools to window for manual testing
if (typeof window !== 'undefined') {
  window.serviceWorkerDebugger = ServiceWorkerDebugger;
}

export default ServiceWorkerDebugger;