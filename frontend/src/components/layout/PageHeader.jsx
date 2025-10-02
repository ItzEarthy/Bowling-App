import React from 'react';

/**
 * Page Header Component
 * Consistent header styling across pages
 */
const PageHeader = ({ 
  title, 
  subtitle, 
  action, 
  className = '' 
}) => {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 font-heading">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-charcoal-600 mt-1 sm:mt-2">
              {subtitle}
            </p>
          )}
        </div>
        
        {action && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;