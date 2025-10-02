// Service Worker Registration with Auto-Update

export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered successfully');

          setInterval(() => {
            registration.update();
          }, 60000);

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New version available! Reloading...');
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }
            });
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed, reloading...');
        window.location.reload();
      });
    });
  }
}

export async function clearAllCaches() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('All caches cleared');
  }
}

export async function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
    }
  }
}
