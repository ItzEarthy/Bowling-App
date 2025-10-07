import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Shared Ball Selector Component
 * Compact, reusable ball selection UI for all entry modes
 */
const BallSelector = ({ 
  selectedBall, 
  onBallSelect, 
  availableBalls = [], 
  houseBallWeights = [8, 9, 10, 11, 12, 13, 14, 15, 16],
  compact = false,
  className = ''
}) => {
  const [showSelector, setShowSelector] = useState(false);

  const handleBallSelect = (ball, isHouse = false, weight = null) => {
    const ballToSelect = isHouse ? {
      id: `house-${weight}`,
      name: `House Ball`,
      weight: weight,
      type: 'house',
      color: '#6B7280',
      brand: 'House',
      model: `${weight}lb`
    } : {
      ...ball,
      type: 'personal'
    };
    
    onBallSelect(ballToSelect);
    setShowSelector(false);
  };

  const handleClear = () => {
    onBallSelect(null);
    setShowSelector(false);
  };

  if (compact) {
    // Compact inline dropdown version
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="w-full p-2 border border-charcoal-300 rounded-lg bg-white hover:bg-charcoal-50 text-left flex items-center justify-between transition-colors text-sm"
        >
          {selectedBall ? (
            <div className="flex items-center space-x-2">
              <div 
                className="w-5 h-5 rounded-full border border-charcoal-300 flex-shrink-0"
                style={{ backgroundColor: selectedBall.color || '#6B7280' }}
              />
              <span className="truncate">{selectedBall.brand || selectedBall.name} {selectedBall.weight}lb</span>
            </div>
          ) : (
            <span className="text-charcoal-500">Select ball...</span>
          )}
          <Plus className="w-4 h-4 text-charcoal-400 flex-shrink-0" />
        </button>

        {showSelector && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowSelector(false)}
            />
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-charcoal-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              <button
                onClick={handleClear}
                className="w-full p-2 text-left hover:bg-charcoal-50 text-sm text-charcoal-600 border-b border-charcoal-200"
              >
                No ball selected
              </button>

              {availableBalls.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-xs font-semibold text-charcoal-700 bg-charcoal-100">Personal Balls</div>
                  {availableBalls.map((ball) => (
                    <button
                      key={ball.id}
                      onClick={() => handleBallSelect(ball)}
                      className="w-full p-2 text-left hover:bg-charcoal-50 flex items-center space-x-2"
                    >
                      <div 
                        className="w-5 h-5 rounded-full border border-charcoal-300 flex-shrink-0"
                        style={{ backgroundColor: ball.color || '#374151' }}
                      />
                      <span className="text-sm truncate">{ball.brand || ball.name} ({ball.weight}lb)</span>
                    </button>
                  ))}
                </>
              )}

              <div className="px-3 py-1.5 text-xs font-semibold text-charcoal-700 bg-charcoal-100">House Balls</div>
              {houseBallWeights.map((weight) => (
                <button
                  key={weight}
                  onClick={() => handleBallSelect(null, true, weight)}
                  className="w-full p-2 text-left hover:bg-charcoal-50 flex items-center space-x-2"
                >
                  <div className="w-5 h-5 rounded-full border border-charcoal-300 bg-charcoal-400 flex-shrink-0" />
                  <span className="text-sm">House Ball ({weight}lb)</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full modal version
  return (
    <>
      <div className={`text-center p-2 bg-white rounded-lg border ${className}`}>
        {selectedBall ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded-full border border-charcoal-300"
                style={{ backgroundColor: selectedBall.color || '#6B7280' }}
              />
              <div className="text-left">
                <div className="font-medium text-sm">{selectedBall.brand || selectedBall.name}</div>
                <div className="text-xs text-charcoal-600">{selectedBall.weight}lb</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <span className="text-sm text-charcoal-500">No ball selected</span>
        )}
      </div>

      <Button
        variant="outline"
        onClick={() => setShowSelector(true)}
        className="w-full mt-2"
        size="sm"
      >
        <Plus className="w-4 h-4 mr-1" />
        {selectedBall ? 'Change Ball' : 'Select Ball'}
      </Button>

      {showSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-charcoal-200 p-4 flex justify-between items-center">
              <h3 className="font-semibold text-charcoal-800">Select Ball</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSelector(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {availableBalls.length > 0 && (
                <div>
                  <h4 className="font-medium text-charcoal-800 mb-2 text-sm">Personal Balls</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {availableBalls.map((ball) => (
                      <button
                        key={ball.id}
                        onClick={() => handleBallSelect(ball)}
                        className="p-3 border border-charcoal-200 rounded-lg hover:bg-charcoal-50 text-left transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded-full border border-charcoal-300"
                            style={{ backgroundColor: ball.color || '#374151' }}
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{ball.brand || ball.name}</div>
                            <div className="text-xs text-charcoal-600">{ball.weight}lb</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-charcoal-800 mb-2 text-sm">House Balls</h4>
                <div className="grid grid-cols-5 gap-2">
                  {houseBallWeights.map((weight) => (
                    <button
                      key={weight}
                      onClick={() => handleBallSelect(null, true, weight)}
                      className="p-2 border border-charcoal-200 rounded-lg hover:bg-charcoal-50 text-center transition-colors"
                    >
                      <div className="text-lg mb-1">🎳</div>
                      <div className="font-medium text-xs">{weight}lb</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BallSelector;
