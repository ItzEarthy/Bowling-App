import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

/**
 * Main Layout Component
 * Provides the app structure with bottom navigation
 */
const Layout = () => {
  const location = useLocation();
  
  // Don't show navigation on game screen for better UX
  const hideNavigation = location.pathname.includes('/game/');
  
  return (
    <div className="min-h-screen bg-cream-50 pb-20">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Outlet />
      </main>
      
      {/* Bottom Navigation */}
      {!hideNavigation && <BottomNavigation />}
    </div>
  );
};

export default Layout;