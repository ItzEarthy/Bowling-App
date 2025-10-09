/**
 * Custom Service Worker Extensions
 * 
 * This file is imported by the Workbox-generated service worker
 * to add custom message handlers for cache management.
 */

// Listen for messages from the client
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (!event.data || !event.data.type) return;
  
  // Handle cache clearing requests
  if (event.data.type === 'CLEAR_ALL_CACHES') {
    console.log(`[SW] Clearing all caches (reason: ${event.data.reason || 'unknown'})`);
    
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('[SW] All caches cleared successfully');
        
        // Notify the client that caches were cleared
        if (event.source) {
          event.source.postMessage({
            type: 'CACHES_CLEARED',
            reason: event.data.reason
          });
        }
      }).catch((error) => {
        console.error('[SW] Failed to clear caches:', error);
      })
    );
  }
  
  // Handle API cache clearing (partial clear)
  if (event.data.type === 'CLEAR_API_CACHE') {
    console.log('[SW] Clearing API caches');
    
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        const apiCaches = cacheNames.filter(name => 
          name.includes('api-cache') || 
          name.includes('runtime') ||
          name.includes('auth')
        );
        
        return Promise.all(
          apiCaches.map((cacheName) => {
            console.log('[SW] Deleting API cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('[SW] API caches cleared successfully');
        
        if (event.source) {
          event.source.postMessage({
            type: 'API_CACHES_CLEARED'
          });
        }
      }).catch((error) => {
        console.error('[SW] Failed to clear API caches:', error);
      })
    );
  }
  
  // Handle skip waiting (for PWA updates)
  if (event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
});

// Intercept fetch requests to prevent caching of auth errors
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Never cache authentication endpoints
  if (url.pathname.includes('/api/auth/')) {
    console.log('[SW] Auth endpoint detected, bypassing cache:', url.pathname);
    
    event.respondWith(
      fetch(event.request).catch((error) => {
        console.error('[SW] Auth fetch failed:', error);
        // Return a network error instead of a cached response
        return new Response(
          JSON.stringify({ error: 'Network error. Please check your connection.' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }
  
  // Check for X-Bypass-SW header (set by API client for auth requests)
  if (event.request.headers.get('X-Bypass-SW') === 'true') {
    console.log('[SW] Bypass header detected, using network only:', url.pathname);
    
    event.respondWith(
      fetch(event.request).catch((error) => {
        console.error('[SW] Bypass fetch failed:', error);
        return new Response(
          JSON.stringify({ error: 'Network error. Please check your connection.' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }
});

console.log('[SW] Custom service worker extensions loaded');
