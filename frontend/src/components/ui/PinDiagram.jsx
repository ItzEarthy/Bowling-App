import React from 'react';

/**
 * Pin Diagram Component
 * Displays a visual representation of bowling pins with color-coded hit/leave percentages
 */
const PinDiagram = ({ pinData, title, throwNumber = 1 }) => {
  // Pin positions in a standard bowling pin layout
  // Pin 1 at bottom (closest to bowler), pins 7-10 at top (furthest from bowler)
  const pinPositions = {
    1: { x: 50, y: 55, row: 1 },   // Head pin (closest to bowler)
    2: { x: 40, y: 43, row: 2 },
    3: { x: 60, y: 43, row: 2 },
    4: { x: 30, y: 31, row: 3 },
    5: { x: 50, y: 31, row: 3 },
    6: { x: 70, y: 31, row: 3 },
    7: { x: 20, y: 19, row: 4 },   // Back pins (furthest from bowler)
    8: { x: 40, y: 19, row: 4 },
    9: { x: 60, y: 19, row: 4 },
    10: { x: 80, y: 19, row: 4 }
  };

  /**
   * Get color based on percentage
   * High hit percentage = red/hot colors
   * Low hit percentage = blue/cold colors
   */
  const getColorForPercentage = (percentage, isHit = true) => {
    if (percentage === 0 || percentage === null || percentage === undefined) {
      return '#E5E7EB'; // Gray for no data
    }

    if (isHit) {
      // Color scale for HIT percentages (high is red, low is light)
      if (percentage >= 80) return '#DC2626'; // Dark red - very high hit rate
      if (percentage >= 60) return '#EF4444'; // Red
      if (percentage >= 40) return '#F97316'; // Orange
      if (percentage >= 20) return '#FBBF24'; // Yellow
      return '#FDE047'; // Light yellow - low hit rate
    } else {
      // Color scale for LEAVE percentages (high is blue, low is light)
      if (percentage >= 80) return '#1E3A8A'; // Dark blue - very high leave rate
      if (percentage >= 60) return '#2563EB'; // Blue
      if (percentage >= 40) return '#3B82F6'; // Light blue
      if (percentage >= 20) return '#60A5FA'; // Lighter blue
      return '#DBEAFE'; // Very light blue - low leave rate
    }
  };

  /**
   * Get text color for readability
   */
  const getTextColor = (percentage) => {
    if (percentage === 0 || percentage === null || percentage === undefined) {
      return '#374151';
    }
    // Always use dark text with white background circle for maximum readability
    return '#1F2937';
  };

  return (
    <div className="pin-diagram-container">
      {title && (
        <h4 className="text-center font-semibold mb-3 text-gray-700">{title}</h4>
      )}
      
      {/* SVG Pin Diagram */}
      <div className="relative w-full" style={{ maxWidth: '300px', margin: '0 auto' }}>
        <svg viewBox="0 0 100 65" className="w-full h-auto">
          {/* Render pins */}
          {Object.entries(pinPositions).map(([pinNumber, position]) => {
            const pinNum = parseInt(pinNumber);
            const hitPercentage = pinData?.hit?.[pinNum] || 0;
            const leavePercentage = pinData?.leave?.[pinNum] || 0;
            
            // For display purposes, show hit percentage on throw 1, leave percentage on throw 2
            const displayPercentage = throwNumber === 1 ? hitPercentage : leavePercentage;
            const isHitDisplay = throwNumber === 1;
            
            const fillColor = getColorForPercentage(displayPercentage, isHitDisplay);
            const textColor = getTextColor(displayPercentage);
            
            return (
              <g key={pinNum}>
                {/* Bowling Pin Shape (realistic proportions) */}
                <path
                  d={`
                    M ${position.x} ${position.y - 7}
                    C ${position.x - 1.8} ${position.y - 7}, ${position.x - 2.2} ${position.y - 6}, ${position.x - 2.2} ${position.y - 4.5}
                    C ${position.x - 2.2} ${position.y - 3}, ${position.x - 1.5} ${position.y - 1.5}, ${position.x - 1.5} ${position.y}
                    L ${position.x - 1.8} ${position.y + 3}
                    C ${position.x - 1.8} ${position.y + 4}, ${position.x - 2.5} ${position.y + 5}, ${position.x - 3} ${position.y + 6}
                    L ${position.x - 3} ${position.y + 7}
                    L ${position.x + 3} ${position.y + 7}
                    L ${position.x + 3} ${position.y + 6}
                    C ${position.x + 2.5} ${position.y + 5}, ${position.x + 1.8} ${position.y + 4}, ${position.x + 1.8} ${position.y + 3}
                    L ${position.x + 1.5} ${position.y}
                    C ${position.x + 1.5} ${position.y - 1.5}, ${position.x + 2.2} ${position.y - 3}, ${position.x + 2.2} ${position.y - 4.5}
                    C ${position.x + 2.2} ${position.y - 6}, ${position.x + 1.8} ${position.y - 7}, ${position.x} ${position.y - 7}
                    Z
                  `}
                  fill={fillColor}
                  stroke="#1F2937"
                  strokeWidth="0.4"
                  className="transition-all duration-200"
                />
                
                {/* Pin number below pin */}
                <text
                  x={position.x}
                  y={position.y + 11}
                  textAnchor="middle"
                  fontSize="5"
                  fill="#1F2937"
                  fontWeight="bold"
                >
                  {pinNum}
                </text>
                
                {/* Percentage text inside pin */}
                {displayPercentage > 0 && (
                  <>
                    {/* Background circle for better text visibility */}
                    <circle
                      cx={position.x}
                      cy={position.y + 0.5}
                      r="4"
                      fill="white"
                      opacity="0.7"
                    />
                    <text
                      x={position.x}
                      y={position.y + 1.5}
                      textAnchor="middle"
                      fontSize="3.5"
                      fill={textColor}
                      fontWeight="bold"
                    >
                      {displayPercentage.toFixed(0)}%
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {throwNumber === 1 ? (
          <>
            <div className="text-xs text-center font-semibold text-gray-700 mb-2">
              Pin Hit Frequency
            </div>
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FDE047' }}></div>
                <span>Low</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#DC2626' }}></div>
                <span>High</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-xs text-center font-semibold text-gray-700 mb-2">
              Pin Leave Frequency
            </div>
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#DBEAFE' }}></div>
                <span>Low</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1E3A8A' }}></div>
                <span>High</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Dual Pin Diagram Component
 * Shows both first and second throw diagrams side by side
 */
export const DualPinDiagram = ({ firstThrowData, secondThrowData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <PinDiagram 
          pinData={firstThrowData}
          title="First Throw"
          throwNumber={1}
        />
        <p className="text-xs text-center text-gray-500 mt-3">
          Shows which pins you hit most often on your first throw
        </p>
      </div>
      
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <PinDiagram 
          pinData={secondThrowData}
          title="Second Throw"
          throwNumber={2}
        />
        <p className="text-xs text-center text-gray-500 mt-3">
          Shows which pins you leave most often for your second throw
        </p>
      </div>
    </div>
  );
};

export default PinDiagram;
