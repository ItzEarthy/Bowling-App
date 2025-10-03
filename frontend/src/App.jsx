import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import useGameStore from './stores/gameStore';
import appLifecycleManager from './services/appLifecycle';
import { setupUpdateCheckerWithRetry } from './services/serviceWorkerManager';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Layout Components
import Layout from './components/layout/Layout';
import GameRestorationModal from './components/features/GameRestorationModal';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GameSetupPage from './pages/GameSetupPage';
import GameEntryPage from './pages/GameEntryPage';
import GamePage from './pages/GamePage';
import GameLogPage from './pages/GameLogPage';
import FriendsPage from './pages/FriendsPage';
import ArsenalPage from './pages/ArsenalPage';
import StatsPage from './pages/StatsPage';
import TrendAnalysisPage from './pages/TrendAnalysisPage';
import GoalsPage from './pages/GoalsPage';
import EnhancedFriendsPage from './pages/EnhancedFriendsPage';
import BallMaintenancePage from './pages/BallMaintenancePage';
import PinCarryPage from './pages/PinCarryPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);
  const loadGameState = useGameStore((state) => state.loadGameState);

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    initialize();
    
    // Initialize app lifecycle manager for auto-save
    appLifecycleManager.initialize();
    
    // Setup service worker for updates with error handling
    try {
      setupUpdateCheckerWithRetry();
    } catch (error) {
      console.warn('Service worker setup failed:', error);
    }
    
    // Check for saved game state when app loads
    setTimeout(() => {
      try {
        loadGameState();
      } catch (error) {
        console.warn('Game state restoration failed:', error);
      }
    }, 1000); // Delay to ensure auth is initialized
    
    // Cleanup on unmount
    return () => {
      appLifecycleManager.cleanup();
    };
  }, [initialize, loadGameState]);

  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-cream-50">
          {/* Game Restoration Modal */}
          <GameRestorationModal />
          
          <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="game-setup" element={<GameSetupPage />} />
            <Route path="game-entry" element={<GameEntryPage />} />
            <Route path="game-log" element={<GameLogPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="trends" element={<TrendAnalysisPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="friends" element={<EnhancedFriendsPage />} />
            <Route path="ball-maintenance" element={<BallMaintenancePage />} />
            <Route path="pin-carry" element={<PinCarryPage />} />
            <Route path="arsenal" element={<ArsenalPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          {/* Temporary public game routes for testing */}
          <Route path="game" element={<Layout><GamePage /></Layout>} />
          <Route path="game/:gameId" element={<Layout><GamePage /></Layout>} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;