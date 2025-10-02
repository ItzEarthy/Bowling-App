import React from 'react';

/**
 * Reusable Button Component
 * Supports multiple variants and sizes with Clean Retro theme
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  isLoading = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-target inline-flex items-center justify-center';
  
  const variants = {
    primary: 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white shadow-retro focus:ring-teal-500',
    secondary: 'bg-coral-500 hover:bg-coral-600 active:bg-coral-700 text-white shadow-retro focus:ring-coral-500',
    outline: 'border-2 border-teal-500 text-teal-600 hover:bg-teal-50 active:bg-teal-100 focus:ring-teal-500',
    ghost: 'text-charcoal-600 hover:bg-cream-100 active:bg-cream-200 focus:ring-charcoal-500',
    danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-retro focus:ring-red-500'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base',
    lg: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg',
    xl: 'px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button 
      className={classes} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;