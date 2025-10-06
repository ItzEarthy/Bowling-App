import { useState, useEffect } from 'react';

/**
 * Custom hook for PWA functionality
 * Handles install prompts and PWA features
 */
const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSInstalled = window.navigator.standalone === true;
      const isInStandaloneMode = isStandalone || isIOSInstalled;
      setIsInstalled(isInStandaloneMode);
      
      // Also check for 'minimal-ui' display mode
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      if (isMinimalUI) {
        setIsInstalled(true);
      }
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA install prompt triggered');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    checkInstalled();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Also listen for display-mode changes
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    displayModeQuery.addEventListener('change', checkInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayModeQuery.removeEventListener('change', checkInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn('No install prompt available');
      return false;
    }

    try {
      console.log('Prompting PWA install');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('PWA install prompt result:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall
  };
};

export default usePWA;