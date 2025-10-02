import React from 'react';

/**
 * Reusable Card Component
 * Clean Retro themed card with multiple variants
 */
const Card = ({ 
  children, 
  variant = 'default', 
  className = '',
  padding = 'default',
  onClick,
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-2xl transition-all duration-200 w-full max-w-full overflow-hidden';
  
  const variants = {
    default: 'shadow-retro',
    elevated: 'shadow-retro-lg',
    interactive: 'shadow-retro hover:shadow-retro-lg cursor-pointer hover:-translate-y-1',
    flat: 'border border-cream-200'
  };
  
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${paddings[padding]} ${className}`;
  
  const CardComponent = onClick ? 'button' : 'div';
  
  return (
    <CardComponent 
      className={classes}
      onClick={onClick}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

/**
 * Card Header Component
 */
export const CardHeader = ({ children, className = '' }) => (
  <div className={`border-b border-cream-200 pb-4 mb-6 ${className}`}>
    {children}
  </div>
);

/**
 * Card Title Component
 */
export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-semibold text-charcoal-900 font-heading ${className}`}>
    {children}
  </h3>
);

/**
 * Card Content Component
 */
export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

/**
 * Card Footer Component
 */
export const CardFooter = ({ children, className = '' }) => (
  <div className={`border-t border-cream-200 pt-4 mt-6 ${className}`}>
    {children}
  </div>
);

export default Card;