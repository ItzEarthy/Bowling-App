import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Users, Target, Settings } from 'lucide-react';

/**
 * Bottom Navigation Component
 * Clean Retro themed navigation with icons
 */
const BottomNavigation = () => {
  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: BarChart3
    },
    {
      path: '/game-log',
      label: 'Games',
      icon: Target
    },
    {
      path: '/friends',
      label: 'Friends',
      icon: Users
    },
    {
      path: '/arsenal',
      label: 'Arsenal',
      icon: Settings // Using Settings icon as placeholder for bowling ball
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200 shadow-retro-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center py-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-charcoal-500 hover:text-charcoal-700 hover:bg-cream-50'
                }`
              }
            >
              <Icon size={24} />
              <span className="text-xs font-medium mt-1">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;