import React from 'react';

/**
 * Quick Select Buttons Component
 * Provides consistent quick-action buttons (Strike, Spare, Gutter, etc.)
 * with tooltips and proper mobile scaling
 */
const QuickSelectButtons = ({ 
  onStrike, 
  onSpare, 
  onGutter, 
  onHalf,
  showSpare = false,
  spareValue = null,
  strikeLabel = 'Strike',
  spareLabel = 'Spare',
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      <button
        onClick={onGutter}
        className="p-2.5 rounded-lg font-semibold text-sm border-2 border-charcoal-300 bg-white text-charcoal-800 hover:border-charcoal-400 hover:bg-charcoal-50 transition-all active:scale-95 touch-manipulation"
        aria-label="Gutter ball - 0 pins"
      >
        <div className="text-base">Gutter</div>
        <div className="text-xs text-charcoal-500">(0)</div>
      </button>

      {showSpare && spareValue !== null ? (
        <button
          onClick={onSpare}
          className="p-2.5 rounded-lg font-semibold text-sm border-2 border-blue-400 bg-blue-50 text-blue-800 hover:border-blue-500 hover:bg-blue-100 transition-all active:scale-95 touch-manipulation"
          aria-label={`Spare - ${spareValue} pins`}
        >
          <div className="text-base">{spareLabel}</div>
          <div className="text-xs text-blue-600">({spareValue})</div>
        </button>
      ) : (
        <button
          onClick={onStrike}
          className="p-2.5 rounded-lg font-semibold text-sm border-2 border-green-400 bg-green-50 text-green-800 hover:border-green-500 hover:bg-green-100 transition-all active:scale-95 touch-manipulation"
          aria-label="Strike - 10 pins"
        >
          <div className="text-base">{strikeLabel}</div>
          <div className="text-xs text-green-600">(10)</div>
        </button>
      )}

      <button
        onClick={onHalf}
        className="p-2.5 rounded-lg font-semibold text-sm border-2 border-charcoal-300 bg-white text-charcoal-800 hover:border-charcoal-400 hover:bg-charcoal-50 transition-all active:scale-95 touch-manipulation"
        aria-label="Half - 5 pins"
      >
        <div className="text-base">Half</div>
        <div className="text-xs text-charcoal-500">(5)</div>
      </button>
    </div>
  );
};

/**
 * Legend component to explain quick select buttons
 */
export const QuickSelectLegend = ({ className = '' }) => {
  return (
    <div className={`bg-charcoal-50 border border-charcoal-200 rounded-lg p-3 ${className}`}>
      <h4 className="font-semibold text-xs text-charcoal-700 mb-2">Quick Actions</h4>
      <div className="space-y-1 text-xs text-charcoal-600">
        <div className="flex items-center">
          <span className="font-semibold w-16">Strike:</span>
          <span>All 10 pins knocked down (1st throw)</span>
        </div>
        <div className="flex items-center">
          <span className="font-semibold w-16">Spare:</span>
          <span>Remaining pins knocked down (2nd throw)</span>
        </div>
        <div className="flex items-center">
          <span className="font-semibold w-16">Gutter:</span>
          <span>No pins knocked down (0)</span>
        </div>
        <div className="flex items-center">
          <span className="font-semibold w-16">Half:</span>
          <span>5 pins knocked down</span>
        </div>
      </div>
    </div>
  );
};

export default QuickSelectButtons;
