// Enhanced Service Worker update checking
// This works WITH vite-plugin-pwa's auto-registration
// to provide more aggressive update detection for Portainer deployments

export function setupUpdateChecker() {
  if ('serviceWorker' in navigator) {
    // Wait for page load
    window.addEventListener('load', async () => {
      try {
        // Get the registration created by vite-plugin-pwa
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (!registration) {
          console.log('⚠️ No service worker registration found');
          return;
        }

        console.log('✅ Service Worker found, setting up update checker');

        // Check for updates every 30 seconds
        setInterval(() => {
          console.log('🔄 Checking for updates...');
          registration.update().catch(err => {
            console.warn('Update check failed:', err);
          });
        }, 30000);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🆕 New version found, installing...');

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('✨ New version installed! Auto-reloading in 3 seconds...');
                
                // Show notification to user
                showUpdateNotification();
                
                // Auto-reload after 3 seconds
                setTimeout(() => {
                  console.log('🔄 Reloading to apply update...');
                  window.location.reload();
                }, 3000);
              }
            });
          }
        });

        // Handle controller change (when skipWaiting is used)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Service Worker controller changed');
          // Don't reload here as it might cause double reload
        });

      } catch (error) {
        console.error('❌ Error setting up update checker:', error);
      }
    });
  } else {
    console.log('ℹ️ Service Workers not supported in this browser');
  }
}

function showUpdateNotification() {
  // Create a simple toast notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #14B8A6;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: slideDown 0.3s ease-out;
  `;
  notification.textContent = '🎉 New version available! Updating...';
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(notification);
  
  // Remove after 3 seconds (before reload)
  setTimeout(() => {
    notification.remove();
  }, 2500);
}

export async function clearAllCaches() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('🗑️ All caches cleared');
  }
}

export async function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log('🔍 Manual update check triggered');
      await registration.update();
    }
  }
}
