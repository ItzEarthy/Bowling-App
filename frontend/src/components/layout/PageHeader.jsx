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
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal-900 font-heading">
            {title}
          </h1>
          {subtitle && (
            <p className="text-charcoal-600 mt-2">
              {subtitle}
            </p>
          )}
        </div>
        
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;