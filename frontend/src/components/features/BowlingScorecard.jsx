import React from 'react';

/**
 * Individual Frame Component for Bowling Scorecard
 */
const Frame = ({ 
  frameNumber, 
  throws = [], 
  cumulativeScore, 
  isActive = false, 
  isComplete = false,
  onClick 
}) => {
  // Display logic for throws
  const getThrowDisplay = (throwIndex, pins) => {
    if (pins === null || pins === undefined) return '';
    
    if (frameNumber === 10) {
      // 10th frame special display logic
      if (pins === 10) return 'X';
      if (throwIndex > 0 && throws[throwIndex - 1] !== 10 && (throws[throwIndex - 1] || 0) + pins === 10) return '/';
      return pins || '-';
    } else {
      // Regular frames 1-9
      if (throwIndex === 0 && pins === 10) return 'X';
      if (throwIndex === 1 && (throws[0] || 0) + pins === 10) return '/';
      return pins || '-';
    }
  };

  const isStrike = frameNumber < 10 ? throws[0] === 10 : false;
  const isSpare = frameNumber < 10 ? !isStrike && (throws[0] || 0) + (throws[1] || 0) === 10 : false;

  return (
    <div 
      className={`
        border-2 border-charcoal-300 bg-white relative cursor-pointer transition-all
        ${isActive ? 'border-vintage-red-500 bg-vintage-red-50' : ''}
        ${isComplete ? 'bg-mint-green-50' : ''}
        hover:bg-charcoal-50
        ${frameNumber === 10 ? 'w-24' : 'w-20'}
      `}
      onClick={onClick}
    >
      {/* Frame Number */}
      <div className="text-xs font-bold text-charcoal-600 text-center py-1 border-b border-charcoal-200">
        {frameNumber}
      </div>
      
      {/* Throws Section */}
      <div className="h-12 flex">
        {frameNumber === 10 ? (
          // 10th frame has 3 possible throws
          <>
            <div className="flex-1 border-r border-charcoal-200 flex items-center justify-center text-sm font-bold">
              {getThrowDisplay(0, throws[0])}
            </div>
            <div className="flex-1 border-r border-charcoal-200 flex items-center justify-center text-sm font-bold">
              {getThrowDisplay(1, throws[1])}
            </div>
            <div className="flex-1 flex items-center justify-center text-sm font-bold">
              {getThrowDisplay(2, throws[2])}
            </div>
          </>
        ) : (
          // Regular frames have 2 throws max
          <>
            <div className="flex-1 border-r border-charcoal-200 flex items-center justify-center text-sm font-bold">
              {isStrike ? '' : getThrowDisplay(0, throws[0])}
            </div>
            <div className="flex-1 flex items-center justify-center text-sm font-bold">
              {getThrowDisplay(isStrike ? 0 : 1, isStrike ? throws[0] : throws[1])}
            </div>
          </>
        )}
      </div>
      
      {/* Cumulative Score */}
      <div className="h-8 border-t border-charcoal-200 flex items-center justify-center font-bold text-charcoal-900">
        {cumulativeScore !== null && cumulativeScore !== undefined ? cumulativeScore : ''}
      </div>
      
      {/* Status Indicators */}
      {isStrike && frameNumber < 10 && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-vintage-red-500 rounded-full"></div>
      )}
      {isSpare && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-mustard-yellow-500 rounded-full"></div>
      )}
    </div>
  );
};

/**
 * Complete Bowling Scorecard Component
 */
const BowlingScorecard = ({ 
  frames = [], 
  currentFrame = 1, 
  onFrameClick,
  totalScore = 0,
  gameComplete = false,
  entryMode = 'pin_by_pin',
  strikes = 0,
  spares = 0
}) => {
  // Initialize empty frames if not provided
  const normalizeFrame = (f, frameNumber) => {
    // Frame can come from store (throws: []) or from backend (throws_data: '[]')
    const throwsFromStore = Array.isArray(f?.throws) ? f.throws : undefined;
    let throwsArr = [];

    if (throwsFromStore !== undefined) {
      throwsArr = throwsFromStore;
    } else if (typeof f?.throws_data === 'string') {
      try {
        throwsArr = JSON.parse(f.throws_data || '[]');
      } catch (e) {
        throwsArr = [];
      }
    } else {
      throwsArr = [];
    }

    return {
      frame_number: frameNumber,
      throws: throwsArr,
      cumulative_score: f?.cumulative_score ?? null,
      is_complete: Boolean(f?.is_complete)
    };
  };

  const displayFrames = Array.from({ length: 10 }, (_, index) => {
    const frameNumber = index + 1;
    const existingFrame = frames.find(f => f.frame_number === frameNumber) || frames[index];
    return normalizeFrame(existingFrame || {}, frameNumber);
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-charcoal-900 font-heading">
          Bowling Score
        </h2>
        <div className="text-right">
          <div className="text-sm text-charcoal-600">Total Score</div>
          <div className="text-3xl font-bold text-vintage-red-600">
            {totalScore}
          </div>
          {gameComplete && (
            <div className="text-sm text-mint-green-600 font-semibold">
              Game Complete!
            </div>
          )}
        </div>
      </div>
      
      {/* Scorecard Grid */}
      <div className="overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {displayFrames.map((frame) => (
            <Frame
              key={frame.frame_number}
              frameNumber={frame.frame_number}
              throws={frame.throws}
              cumulativeScore={frame.cumulative_score}
              isActive={frame.frame_number === currentFrame}
              isComplete={frame.is_complete}
              onClick={() => onFrameClick && onFrameClick(frame.frame_number)}
            />
          ))}
        </div>
      </div>
      
      {/* Frame Statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-charcoal-50 rounded-lg">
          <div className="text-sm text-charcoal-600">Strikes</div>
          <div className="text-2xl font-bold text-vintage-red-600">
            {entryMode === 'final_score' && strikes !== undefined 
              ? strikes 
              : displayFrames.filter(f => f.throws[0] === 10 && f.frame_number < 10).length
            }
          </div>
        </div>
        <div className="text-center p-3 bg-charcoal-50 rounded-lg">
          <div className="text-sm text-charcoal-600">Spares</div>
          <div className="text-2xl font-bold text-mustard-yellow-600">
            {entryMode === 'final_score' && spares !== undefined
              ? spares
              : displayFrames.filter(f => 
                  f.frame_number < 10 && 
                  f.throws[0] !== 10 && 
                  (f.throws[0] || 0) + (f.throws[1] || 0) === 10
                ).length
            }
          </div>
        </div>
        <div className="text-center p-3 bg-charcoal-50 rounded-lg">
          <div className="text-sm text-charcoal-600">
            {entryMode === 'final_score' ? 'Entry Mode' : 'Frame'}
          </div>
          <div className="text-2xl font-bold text-charcoal-900">
            {entryMode === 'final_score' 
              ? 'Final' 
              : `${currentFrame}/10`
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default BowlingScorecard;