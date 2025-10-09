import React, { useState, useEffect } from 'react';

/**
 * PinSweepAnimation Component
 * Animates a sweep bar moving from bottom to top and triggers pin falls
 */
const PinSweepAnimation = ({ 
  isAnimating, 
  onAnimationComplete,
  remainingPins = [], // Array of pin numbers that should drop when sweep touches them
  onPinHit // Callback when sweep hits a pin: (pinNumber, randomRotation) => void
}) => {
  const [sweepPosition, setSweepPosition] = useState(120); // Start at bottom (120%)

  useEffect(() => {
    if (!isAnimating) {
      setSweepPosition(120);
      return;
    }

    // Pin positions (Y-axis percentages from top) - matching PinDeck layout
    const pinPositions = {
      1: 55,   // Closest to bowler (bottom)
      2: 43,
      3: 43,
      4: 31,
      5: 31,
      6: 31,
      7: 19,   // Furthest from bowler (top)
      8: 19,
      9: 19,
      10: 19
    };

    // Track which pins have been hit
    const hitPins = new Set();

    // Animate sweep bar moving from bottom to top
    let progress = 0;
    const sweepDuration = 1000; // ms
    const startTime = Date.now();

    const animateSweep = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / sweepDuration, 1);
      
      // Move from 120% (bottom, off-screen) to -20% (top, off-screen)
      const position = 120 - (progress * 140);
      setSweepPosition(position);

      // Check if sweep has hit any remaining pins
      remainingPins.forEach(pinNum => {
        if (!hitPins.has(pinNum)) {
          const pinY = pinPositions[pinNum];
          // Trigger pin fall when sweep passes the pin's center
          if (position <= pinY && position >= pinY - 5) {
            hitPins.add(pinNum);
            // Generate random rotation direction (-90 to 90 degrees, favoring sides)
            const randomRotation = Math.random() > 0.5 
              ? 60 + Math.random() * 30  // Right: 60-90
              : -(60 + Math.random() * 30); // Left: -60 to -90
            
            if (onPinHit) {
              onPinHit(pinNum, randomRotation);
            }
          }
        }
      });

      if (progress < 1) {
        requestAnimationFrame(animateSweep);
      } else {
        // Sweep complete - wait for pins to finish falling
        setTimeout(() => {
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }, 600); // Pin drop duration
      }
    };

    animateSweep();
  }, [isAnimating, remainingPins, onAnimationComplete, onPinHit]);

  if (!isAnimating) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* Sweep Bar - moving bottom to top */}
      <div
        className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-gray-800 to-transparent opacity-60 shadow-lg"
        style={{
          top: `${sweepPosition}%`,
          transform: 'translateY(-50%)',
          transition: 'none'
        }}
      >
        {/* Sweep bar glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-600 to-transparent blur-md opacity-80" />
      </div>
    </div>
  );
};

export default PinSweepAnimation;
