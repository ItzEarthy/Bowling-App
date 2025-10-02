import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Layout Components
import Layout from './components/layout/Layout';

// Pages
// Removed LandingPage import to restore original routing behavior

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
  return !isAuthenticated ? children : <Navigate to="/app/dashboard" replace />;
};

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-cream-50">
          <Routes>
          {/* Root: redirect to dashboard if authenticated, otherwise to login */}
          <Route
            path="/"
            element={<RootRedirect />}
          />
          
          {/* Public Auth Routes */}
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
            path="/app" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
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
          <Route path="/game" element={<Layout><GamePage /></Layout>} />
          <Route path="/game/:gameId" element={<Layout><GamePage /></Layout>} />

          {/* Legacy route redirects */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

// Small redirect component used for root path.
function RootRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Navigate to="/login" replace />;
}

export default App;