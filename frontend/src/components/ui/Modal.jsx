import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

/**
 * Reusable Modal Component
 * Clean Retro themed modal with animations
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOverlay = true
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-28 sm:pb-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-white rounded-t-3xl sm:rounded-3xl shadow-retro-lg w-full ${sizes[size]} 
        mx-0 sm:mx-4 max-h-[calc(100vh-140px)] sm:max-h-[85vh] overflow-hidden
        animate-fade-in transform transition-all duration-300
      `}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-cream-200">
            {title && (
              <h2 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-heading">
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-cream-100 rounded-lg transition-colors duration-200 touch-target"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="border-t border-cream-200 p-4 sm:p-6 bg-cream-50 rounded-b-3xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;