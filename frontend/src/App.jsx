import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Layout Components
import Layout from './components/layout/Layout';

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

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-cream-50">
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
            <Route path="friends" element={<FriendsPage />} />
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