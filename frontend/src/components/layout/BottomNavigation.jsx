import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Users, Target, Settings, User, Shield, LogOut, TrendingUp, LineChart, Flame, Zap, Droplets, Wrench, Activity } from 'lucide-react';
import useAuthStore from '../../stores/authStore';

/**
 * Bottom Navigation Component
 * Clean Retro themed navigation with icons
 */
const BottomNavigation = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: Home
    },
    {
      path: '/game-log',
      label: 'Games',
      icon: BarChart3
    },
    {
      path: '/stats',
      label: 'Stats',
      icon: TrendingUp
    },
    {
      path: '/friends',
      label: 'Social',
      icon: Users
    },
    {
      path: '/arsenal',
      label: 'Arsenal',
      icon: Target
    },
    ...(isAdmin ? [{
      path: '/admin',
      label: 'Admin',
      icon: Shield
    }] : [{
      path: '/profile',
      label: 'Profile',
      icon: User
    }])
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200 shadow-retro-lg z-50 safe-area-bottom">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex justify-around items-center py-2 sm:py-3">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-2 sm:px-3 rounded-xl transition-all duration-200 min-w-[60px] touch-target ${
                  isActive
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-charcoal-500 hover:text-charcoal-700 hover:bg-cream-50'
                }`
              }
            >
              <Icon size={20} className="sm:w-6 sm:h-6" />
              <span className="text-xs font-medium mt-1 hidden xs:block sm:block">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;