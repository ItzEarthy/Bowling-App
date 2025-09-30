import React, { forwardRef } from 'react';

/**
 * Reusable Input Component
 * Clean Retro themed form input with validation states
 */
const Input = forwardRef(({ 
  label,
  error,
  helperText,
  required = false,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  const baseClasses = 'w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
  
  const stateClasses = error 
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
    : 'border-cream-300 focus:border-teal-500 focus:ring-teal-500';
    
  const classes = `${baseClasses} ${stateClasses} ${className}`;
  
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className="block text-charcoal-700 font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        className={classes}
        {...props}
      />
      
      {error && (
        <p className="text-red-600 text-sm font-medium">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-charcoal-500 text-sm">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;