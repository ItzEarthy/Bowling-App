import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

/**
 * Main Layout Component
 * Provides the app structure with bottom navigation
 */
const Layout = ({ children }) => {
  const location = useLocation();

  // Don't show navigation on game screen for better UX
  // Note: check for exact '/game' paths only, not game-log or other game-related pages
  const hideNavigation = location.pathname === '/game' || location.pathname.startsWith('/game/');

  return (
    <div className="min-h-screen bg-cream-50 pb-28 sm:pb-32">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
        {/* If Layout was rendered with explicit children (e.g. <Layout><GamePage/></Layout>), render them.
            Otherwise, render the nested <Outlet /> for routes that nest children. */}
        {children ? children : <Outlet />}
      </main>

      {/* Bottom Navigation */}
      {!hideNavigation && <BottomNavigation />}
    </div>
  );
};

export default Layout;