import React from 'react';

/**
 * Loading Spinner Component
 * Clean Retro themed loading indicator
 */
const Spinner = ({ size = 'md', color = 'teal', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  const colors = {
    teal: 'border-teal-500',
    coral: 'border-coral-500',
    white: 'border-white',
    charcoal: 'border-charcoal-500'
  };
  
  return (
    <div className={`animate-spin rounded-full border-b-2 ${sizes[size]} ${colors[color]} ${className}`}></div>
  );
};

/**
 * Loading Screen Component
 * Full screen loading with optional message
 */
export const LoadingScreen = ({ message = 'Loading...' }) => (
  <div className="fixed inset-0 bg-cream-50 flex items-center justify-center z-50">
    <div className="text-center">
      <Spinner size="xl" className="mx-auto mb-4" />
      <p className="text-charcoal-600 font-medium">{message}</p>
    </div>
  </div>
);

/**
 * Loading Card Component
 * Loading state for card components
 */
export const LoadingCard = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-retro p-6 animate-pulse ${className}`}>
    <div className="space-y-4">
      <div className="h-4 bg-cream-200 rounded w-3/4"></div>
      <div className="h-4 bg-cream-200 rounded w-1/2"></div>
      <div className="h-4 bg-cream-200 rounded w-2/3"></div>
    </div>
  </div>
);

export default Spinner;