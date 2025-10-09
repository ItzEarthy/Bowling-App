import React, { useState, useEffect } from 'react';
import { Zap, Save, RotateCcw, Target, Eye, EyeOff, AlertTriangle, Plus } from 'lucide-react';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import BowlingScorecard from './BowlingScorecard';
import BowlingScoreCalculator from '../../utils/bowlingScoring';
import { analyzeSplitFromPins, getSplitAdvice } from '../../utils/splitDetection';
import { ballAPI } from '../../lib/api';
import { getLocalISOString, getLocalDateString } from '../../utils/dateUtils';
import useGameStore from '../../stores/gameStore';
import BallSelector from '../shared/BallSelector';
import QuickSelectButtons, { QuickSelectLegend } from '../shared/QuickSelectButtons';
import { saveGameEntryState, loadGameEntryState, clearGameEntryState } from '../../utils/gameEntryPersistence';
import { withErrorHandling, validateGameData, safeCalculation } from '../../utils/errorHandling';
import PinSweepAnimation from './PinSweepAnimation';

/**
 * Individual Pin Component for Pin Selection (using pin.png image)
 */
const Pin = ({ pinNumber, isKnockedDown, isDisabled = false, animationState = null, hidden = false }) => {
  // animationState: { rotating: degrees, falling: boolean }
  const getAnimationStyle = () => {
    if (!animationState) return {};
    
    if (animationState.falling) {
      const delay = animationState.delay || 0;
      return {
        animation: `pinFall-${pinNumber} 0.6s ease-out ${delay}ms forwards`,
        transformOrigin: 'center bottom'
      };
    }
    return {};
  };

  const getAnimationKeyframes = () => {
    if (!animationState || !animationState.falling) return '';
    
    const rotation = animationState.rotation || 90;
    const translateX = rotation > 0 ? 20 : -20;
    
    return `
      @keyframes pinFall-${pinNumber} {
        0% {
          transform: rotate(0deg) translateY(0);
          opacity: 1;
        }
        50% {
          transform: rotate(${rotation * 0.5}deg) translateY(10px) translateX(${translateX * 0.3}px);
          opacity: 0.7;
        }
        100% {
          transform: rotate(${rotation}deg) translateY(40px) translateX(${translateX}px);
          opacity: 0;
        }
      }
    `;
  };

  if (hidden) {
    // Render an invisible placeholder to maintain layout and prevent duplicate pin rendering
    return <div style={{ width: '100%', height: '100%' }} />;
  }

  return (
    <div className="pointer-events-none select-none flex items-center justify-center relative" style={{ width: '100%', height: '100%' }}>
      <style>{getAnimationKeyframes()}</style>
      <img 
        src="/pin.png"
        alt={`Bowling Pin ${pinNumber}`}
        className={`w-full h-full object-contain drop-shadow-sm ${
          isKnockedDown ? 'opacity-50 grayscale scale-90' : 'opacity-100 scale-100'
        }`}
        style={{
          filter: isKnockedDown ? 'grayscale(100%) brightness(0.7)' : 'none',
          transformOrigin: '50% 50%',
          ...getAnimationStyle()
        }}
      />
      {/* Pin number overlay - vertically centered over the visual pin */}
      <div 
        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        <span 
          className={`text-base sm:text-lg font-extrabold drop-shadow-md ${
            isKnockedDown ? 'text-red-600' : 'text-gray-800'
          }`}
          style={{ 
            fontSize: 'clamp(14px, 2.8vw, 20px)',
            textShadow: '0 1px 0 rgba(255,255,255,0.8)'
          }}
        >
          {pinNumber}
        </span>
      </div>
    </div>
  );
};

/**
 * Pin Deck Layout Component (row-based, centered rows)
 * Rows are: [7,8,9,10], [4,5,6], [2,3], [1]
 */
const PinDeck = ({
  knockedDownPins = [],
  availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  onPinClick,
  pinAnimations = {} // { pinNumber: { falling: true, rotation: 90 } }
}) => {
  const rows = [
    [7, 8, 9, 10],
    [4, 5, 6],
    [2, 3],
    [1]
  ];

  return (
    <div className="pin-deck mx-auto bg-gradient-to-b from-amber-50 to-amber-100 rounded-lg border-2 border-amber-200 shadow-inner p-4" style={{ maxWidth: 520 }}>
      <div className="flex flex-col items-center space-y-3">
        {rows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex items-end justify-center gap-3 w-full">
            {row.map((pinNumber) => {
              const isKnocked = knockedDownPins.includes(pinNumber);
              const isAvailable = availablePins.includes(pinNumber);
              const animationState = pinAnimations[pinNumber];

              // Responsive width for pin touch target
              const widthStyle = 'clamp(48px, 9vw, 90px)';

              return (
                <button
                  key={pinNumber}
                  onClick={() => isAvailable && onPinClick && onPinClick(Number(pinNumber))}
                  disabled={!isAvailable}
                  aria-pressed={isKnocked}
                  aria-label={`Pin ${pinNumber}`}
                  className={`${animationState && animationState.falling ? '' : 'transition-transform duration-150'} p-0 focus:outline-none focus:ring-2 focus:ring-vintage-red-400 rounded ${
                    isKnocked ? 'opacity-60 scale-95' : 'opacity-100 hover:scale-105'
                  } ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  style={{
                    width: widthStyle,
                    aspectRatio: '2 / 3',
                    minWidth: 44,
                    maxWidth: 110,
                    zIndex: isKnocked ? 1 : 6,
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Pin pinNumber={Number(pinNumber)} isKnockedDown={isKnocked} isDisabled={!isAvailable} animationState={animationState} />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Pin-by-Pin Entry Component
 * Enhanced full-game pin entry interface
 */
const PinByPinEntry = ({ onGameComplete, initialData = {} }) => {
  const ENTRY_MODE = 'pin_by_pin';
  
  // Use game store for consistent state management
  const gameStore = useGameStore();
  
  // Safety check for game store availability
  if (!gameStore) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold text-red-800 mb-2">Error: Game Store Unavailable</h3>
            <p className="text-sm text-red-600">The game store could not be initialized. Please refresh and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Safely destructure store methods and state
  const { 
    currentGame, 
    currentFrame: storeCurrentFrame, 
    currentThrow: storeCurrentThrow,
    setCurrentFrameAndThrow,
    addThrow,
    updateFrame,
    initializeGame,
    setCurrentGame
  } = gameStore;

  // Initialize game if not already present
  useEffect(() => {
    if (!currentGame && initializeGame) {
      initializeGame({
        entryMode: 'pin_by_pin',
        entry_mode: 'pin_by_pin',
        ...initialData
      });
    }
  }, [currentGame, initializeGame, initialData]);

  // Local state for pin-by-pin specific data
  const [currentFrame, setCurrentFrame] = useState(storeCurrentFrame || 1);
  const [currentThrow, setCurrentThrow] = useState(storeCurrentThrow || 1);
  
  const [selectedPins, setSelectedPins] = useState([]);
  const [frameThrowPins, setFrameThrowPins] = useState({});
  const [editingThrowSelectorOpen, setEditingThrowSelectorOpen] = useState(false);
  
  // Get frames from game store
  const frames = currentGame?.frames || BowlingScoreCalculator.createEmptyGame();
  const gameComplete = currentGame?.is_complete || false;
  
  const [showScorecard, setShowScorecard] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameDate, setGameDate] = useState(initialData.gameDate || getLocalDateString());
  const [currentSplit, setCurrentSplit] = useState(null);
  const [showSplitAdvice, setShowSplitAdvice] = useState(false);
  const [availableBalls, setAvailableBalls] = useState([]);
  const [houseBallWeights] = useState([8, 9, 10, 11, 12, 13, 14, 15, 16]);
  const [frameBalls, setFrameBalls] = useState({});
  
  // Sweep animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [pinsToSweep, setPinsToSweep] = useState([]);
  const [pinAnimations, setPinAnimations] = useState({}); // { pinNumber: { falling: true, rotation: 90 } }

  // Load saved state on mount
  useEffect(() => {
    const savedState = loadGameEntryState(ENTRY_MODE);
    if (savedState && Object.keys(initialData).length === 0) {
      if (savedState.currentFrame) setCurrentFrame(savedState.currentFrame);
      if (savedState.currentThrow) setCurrentThrow(savedState.currentThrow);
      if (savedState.frameThrowPins) setFrameThrowPins(savedState.frameThrowPins);
      if (savedState.frameBalls) setFrameBalls(savedState.frameBalls);
      if (savedState.gameDate) setGameDate(savedState.gameDate);
    }
  }, []);

  // Auto-save state when data changes
  useEffect(() => {
    const hasData = Object.keys(frameThrowPins).length > 0 || Object.keys(frameBalls).length > 0;
    if (hasData) {
      saveGameEntryState(ENTRY_MODE, {
        currentFrame,
        currentThrow,
        frameThrowPins,
        frameBalls,
        gameDate,
      });
    }
  }, [currentFrame, currentThrow, frameThrowPins, frameBalls, gameDate]);

  useEffect(() => {
    loadAvailableBalls();
  }, []);

  // Listen for frame changes and dismiss split advice popup
  useEffect(() => {
    const handleFrameChange = () => {
      setShowSplitAdvice(false);
    };

    window.addEventListener('bowlingFrameChanged', handleFrameChange);
    return () => {
      window.removeEventListener('bowlingFrameChanged', handleFrameChange);
    };
  }, []);

  const loadAvailableBalls = async () => {
    const result = await withErrorHandling(
      async () => {
        const response = await ballAPI.getBalls();
        return response.data.balls || [];
      },
      {
        maxRetries: 1,
        errorMessage: 'Could not load balls',
      }
    );

    if (result.success) {
      setAvailableBalls(result.data);
    } else {
      setAvailableBalls([]);
    }
  };

  const setBallForThrow = (frameNumber, throwIndex, ball) => {
    const key = `${frameNumber}-${throwIndex}`;
    setFrameBalls(prev => ({
      ...prev,
      [key]: ball
    }));
  };

  const getBallForThrow = (frameNumber, throwIndex) => {
    const key = `${frameNumber}-${throwIndex}`;
    return frameBalls[key];
  };

  // Calculate available pins for current throw
  const getAvailablePins = () => {
    const frameKey = `${currentFrame}`;
    const frame = frames[currentFrame - 1];
    const throws = frame.throws || [];

    if (currentFrame < 10) {
      // Regular frames 1-9
      if (currentThrow === 1) {
        // First throw - all pins available
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      } else if (currentThrow === 2) {
        // Second throw - only pins not hit on first throw are available
        const firstThrowKey = `${frameKey}-1`;
        const firstThrowPins = frameThrowPins[firstThrowKey] || [];
        
        if (throws[0] === 10) {
          // Strike - no second throw
          return [];
        }
        
        // Return all pins except those hit on first throw
        const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        return allPins.filter(pin => !firstThrowPins.includes(pin));
      }
    } else {
      // 10th frame - more complex logic
      if (currentThrow === 1) {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      } else if (currentThrow === 2) {
        const firstThrowKey = `${frameKey}-1`;
        const firstThrowPins = frameThrowPins[firstThrowKey] || [];
        
        if (throws[0] === 10) {
          // Strike on first throw - all pins reset
          return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        } else {
          // Return pins not hit on first throw
          const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          return allPins.filter(pin => !firstThrowPins.includes(pin));
        }
      } else if (currentThrow === 3) {
        const firstThrowKey = `${frameKey}-1`;
        const secondThrowKey = `${frameKey}-2`;
        const firstThrowPins = frameThrowPins[firstThrowKey] || [];
        const secondThrowPins = frameThrowPins[secondThrowKey] || [];
        
        // If strike or spare on first two throws, pins reset
        if (throws[0] === 10 || throws[0] + (throws[1] || 0) === 10) {
          return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        } else {
          // Return pins not hit on first or second throw
          const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          const hitPins = [...new Set([...firstThrowPins, ...secondThrowPins])];
          return allPins.filter(pin => !hitPins.includes(pin));
        }
      }
    }
    return [];
  };

  // Get the pins that were knocked down on previous throws in this frame
  const getKnockedDownPins = () => {
    const frameKey = `${currentFrame}`;
    const frame = frames[currentFrame - 1];
    const throws = frame.throws || [];
    
    // For the first throw, only show currently selected pins
    if (currentThrow === 1) {
      return selectedPins;
    }
    
    // For second throw in regular frames, show pins from first throw as knocked down
    if (currentFrame < 10 && currentThrow === 2) {
      const firstThrowKey = `${frameKey}-1`;
      const firstThrowPins = frameThrowPins[firstThrowKey] || [];
      
      // If first throw was a strike, all pins are down (but this shouldn't happen for second throw)
      if (throws[0] === 10) {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      }
      
      // Show first throw pins PLUS currently selected pins
      return [...new Set([...firstThrowPins, ...selectedPins])];
    }
    
    // 10th frame logic
    if (currentFrame === 10) {
      if (currentThrow === 1) {
        return selectedPins;
      } else if (currentThrow === 2) {
        const firstThrowKey = `${frameKey}-1`;
        const firstThrowPins = frameThrowPins[firstThrowKey] || [];
        
        if (throws[0] === 10) {
          // Strike on first throw - pins reset for second throw
          return selectedPins;
        } else {
          // Show first throw pins plus current selection
          return [...new Set([...firstThrowPins, ...selectedPins])];
        }
      } else if (currentThrow === 3) {
        const firstThrowKey = `${frameKey}-1`;
        const secondThrowKey = `${frameKey}-2`;
        const firstThrowPins = frameThrowPins[firstThrowKey] || [];
        const secondThrowPins = frameThrowPins[secondThrowKey] || [];
        
        // If strike or spare was made on first two throws, pins are reset
        if (throws[0] === 10 || throws[0] + (throws[1] || 0) === 10) {
          return selectedPins;
        } else {
          // Show all previous throws plus current selection
          return [...new Set([...firstThrowPins, ...secondThrowPins, ...selectedPins])];
        }
      }
    }
    
    return selectedPins;
  };

  // helper to load pins for a given throw if saved
  const loadPinsForThrow = (frameNum, throwNum) => {
    const key = `${frameNum}-${throwNum}`;
    const saved = frameThrowPins[key];
    if (saved) {
      setSelectedPins(saved);
    } else {
      // If no saved pins for this throw, initialize based on the throw score
      const frame = frames[frameNum - 1];
      const throws = frame.throws || [];
      const throwIndex = throwNum - 1;
      
      if (throwIndex < throws.length) {
        const throwScore = throws[throwIndex];
        
        if (throwNum === 1) {
          // First throw - if it's a strike, select all pins; otherwise derive from score
          if (throwScore === 10) {
            setSelectedPins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
          } else {
            // For non-strikes, we don't know which specific pins were hit
            // so just clear selection and let user re-select
            setSelectedPins([]);
          }
        } else if (throwNum === 2 && frameNum < 10) {
          // Second throw in regular frame
          const firstThrowScore = throws[0] || 0;
          const secondThrowScore = throwScore;
          
          if (firstThrowScore === 10) {
            // Strike on first throw - no second throw should exist
            setSelectedPins([]);
          } else {
            // Regular second throw - we don't know which specific pins
            setSelectedPins([]);
          }
        } else if (frameNum === 10) {
          // 10th frame logic - more complex due to potential third throw
          setSelectedPins([]);
        } else {
          setSelectedPins([]);
        }
      } else {
        setSelectedPins([]);
      }
    }
  };

  const handleChooseThrow = (throwNum) => {
    // Clear any existing split advice when switching throws
    setCurrentSplit(null);
    setShowSplitAdvice(false);
    
    // Set the current throw
    setCurrentThrow(throwNum);
    
    // Load the saved pins for this specific throw
    loadPinsForThrow(currentFrame, throwNum);
    
    // Close the throw selector
    setEditingThrowSelectorOpen(false);
    
    // Force a re-render of available pins by updating the component state
    // This ensures the pin deck shows the correct available/knocked down state
    setTimeout(() => {
      // Small delay to ensure state updates are processed
    }, 10);
  };

  // Check if game is complete
  const handlePinClick = (pinNumber) => {
    setSelectedPins(prev => {
      if (prev.includes(pinNumber)) {
        return prev.filter(p => p !== pinNumber);
      } else {
        const newSelection = [...prev, pinNumber].sort((a, b) => a - b);
        
        // Validate selection
        const frame = frames[currentFrame - 1];
        const throws = frame.throws || [];
        
        if (currentFrame < 10 && currentThrow === 2) {
          const firstThrowPins = throws[0] || 0;
          if (firstThrowPins + newSelection.length > 10) {
            return prev;
          }
        }

        // Check for split after first throw
        if (currentThrow === 1 && newSelection.length > 0 && newSelection.length < 10) {
          const splitInfo = analyzeSplitFromPins(newSelection);
          if (splitInfo) {
            setCurrentSplit(splitInfo);
            setShowSplitAdvice(true);
          } else {
            setCurrentSplit(null);
            setShowSplitAdvice(false);
          }
        }
        
        return newSelection;
      }
    });
  };

  // Per-throw confirm: save the selected pins for the current throw immediately,
  // update scores, and advance to the next throw/frame per the rules.
  const handleConfirmThrow = () => {
    if (!currentGame || !setCurrentGame) {
      console.error('Game store not available');
      return;
    }

    const pinsKnockedDown = selectedPins.length;
    const frameKey = `${currentFrame}`;
    const throwKey = `${frameKey}-${currentThrow}`;

    // Store which specific pins were hit for this throw
    setFrameThrowPins(prev => ({
      ...prev,
      [throwKey]: [...selectedPins]
    }));

    // Create updated game data with the new throw
    const newFrames = [...frames];
    const frameIndex = currentFrame - 1;

    if (!newFrames[frameIndex].throws) newFrames[frameIndex].throws = [];

    const throwIndex = currentThrow - 1;
    if (throwIndex < newFrames[frameIndex].throws.length) {
      newFrames[frameIndex].throws[throwIndex] = pinsKnockedDown;

      // If editing first throw in frames 1-9, clear second throw
      if (currentFrame < 10 && throwIndex === 0) {
        if (pinsKnockedDown === 10) {
          newFrames[frameIndex].throws = [10];
          const secondThrowKey = `${frameKey}-2`;
          setFrameThrowPins(prev => {
            const newPins = { ...prev };
            delete newPins[secondThrowKey];
            return newPins;
          });
        } else {
          newFrames[frameIndex].throws = [pinsKnockedDown];
          const secondThrowKey = `${frameKey}-2`;
          setFrameThrowPins(prev => {
            const newPins = { ...prev };
            delete newPins[secondThrowKey];
            return newPins;
          });
        }
      }
    } else {
      newFrames[frameIndex].throws.push(pinsKnockedDown);
    }

    // Calculate scores and update game store
    const updatedFrames = BowlingScoreCalculator.calculateGameScore(newFrames);
    const totalScore = updatedFrames[updatedFrames.length - 1].cumulative_score || 0;
    const isGameComplete = BowlingScoreCalculator.isGameComplete(updatedFrames);

    let gameStats = {};
    if (isGameComplete) {
      gameStats = BowlingScoreCalculator.getGameStatistics(updatedFrames);
    }

    const updatedGame = {
      ...currentGame,
      frames: updatedFrames,
      total_score: totalScore,
      is_complete: isGameComplete,
      entryMode: 'pin_by_pin',
      entry_mode: 'pin_by_pin',
      ...(isGameComplete && {
        strikes: gameStats.strikes,
        spares: gameStats.spares,
        opens: gameStats.opens
      })
    };

    setCurrentGame(updatedGame);

    if (isGameComplete) return;

    // Determine if we should trigger sweep animation
    // Trigger sweep when:
    // 1. After first throw in frames 1-9 (if not a strike)
    // 2. After second throw in frames 1-9 (if there are remaining pins)
    // 3. After throws in frame 10 (if there are remaining pins and frame continues)
    
    const throws = updatedFrames[frameIndex].throws;
    let shouldAnimate = false;
    let remainingPins = [];

    if (currentFrame < 10) {
      if (currentThrow === 1 && throws[0] < 10) {
        // First throw, not a strike - calculate remaining pins
        const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        remainingPins = allPins.filter(pin => !selectedPins.includes(pin));
        shouldAnimate = true;
      } else if (currentThrow === 2) {
        // Second throw - calculate remaining pins
        const firstThrowKey = `${frameKey}-1`;
        const firstThrowPins = frameThrowPins[firstThrowKey] || [];
        const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const allKnockedPins = [...new Set([...firstThrowPins, ...selectedPins])];
        remainingPins = allPins.filter(pin => !allKnockedPins.includes(pin));
        shouldAnimate = remainingPins.length > 0;
      }
    } else {
      // 10th frame - check if there are remaining pins
      if (currentThrow === 1 && throws[0] < 10) {
        const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        remainingPins = allPins.filter(pin => !selectedPins.includes(pin));
        shouldAnimate = true;
      } else if (currentThrow === 2 && throws[0] !== 10) {
        // Not a strike on first throw
        const firstThrowKey = `${frameKey}-1`;
        const firstThrowPins = frameThrowPins[firstThrowKey] || [];
        const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const allKnockedPins = [...new Set([...firstThrowPins, ...selectedPins])];
        remainingPins = allPins.filter(pin => !allKnockedPins.includes(pin));
        shouldAnimate = remainingPins.length > 0 && throws[0] + (throws[1] || 0) < 10;
      }
      // For strikes or spares in 10th frame, pins reset so no sweep needed
    }

    if (shouldAnimate && remainingPins.length > 0) {
      // Trigger sweep animation
      setPinsToSweep(remainingPins);
      setIsAnimating(true);
    } else {
      // No animation needed, proceed immediately
      advanceToNextThrow(updatedFrames, frameIndex);
    }
  };

  // Function to advance to next throw/frame after animation completes
  const advanceToNextThrow = (updatedFrames, frameIndex) => {
    // Determine next throw/frame
    const throws = updatedFrames[frameIndex].throws;
    const prevFrame = currentFrame;
    const nextFrameChanged = currentFrame < 10 && (throws[0] === 10 || throws.length === 2);

    if (currentFrame < 10) {
      if (throws[0] === 10) {
        // Strike - move to next frame
        if (currentFrame === 9) {
          setCurrentFrame(10);
          setCurrentThrow(1);
        } else {
          setCurrentFrame(currentFrame + 1);
          setCurrentThrow(1);
        }
      } else if (throws.length === 2) {
        // Second throw complete - move to next frame
        if (currentFrame === 9) {
          setCurrentFrame(10);
          setCurrentThrow(1);
        } else {
          setCurrentFrame(currentFrame + 1);
          setCurrentThrow(1);
        }
      } else {
        // Move to second throw
        setCurrentThrow(2);
      }
    } else {
      // 10th frame logic
      const isComplete = BowlingScoreCalculator.isFrameComplete(throws, 10);
      if (!isComplete) {
        setCurrentThrow(Math.min(currentThrow + 1, 3));
      }
    }

    if (nextFrameChanged || (currentFrame === 10 && prevFrame !== currentFrame)) {
      window.dispatchEvent(new CustomEvent('bowlingFrameChanged', { detail: { frame: currentFrame + (nextFrameChanged ? 1 : 0) } }));
    }

    setSelectedPins([]);
  };

  // Animation complete handler
  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setPinsToSweep([]);
    setPinAnimations({});
    
    // Now advance to next throw
    const frameIndex = currentFrame - 1;
    advanceToNextThrow(frames, frameIndex);
  };

  // Handle when sweep hits a pin
  const handlePinHit = (pinNumber, rotation) => {
    // Add a slight random delay to stagger falls for smoothness
    const delay = Math.floor(Math.random() * 120); // 0-119 ms

    setPinAnimations(prev => ({
      ...prev,
      [pinNumber]: { falling: true, rotation, delay }
    }));

    // After the pin fall animation finishes (including delay), clear the animation state for that pin
    const pinDropDuration = 600; // matches animation duration in ms
    setTimeout(() => {
      setPinAnimations(prev => {
        const copy = { ...prev };
        delete copy[pinNumber];
        return copy;
      });
    }, pinDropDuration + delay + 50);
  };

  // Handle frame click for editing
  const handleFrameClick = (frameNumber) => {
    if (gameComplete) return;
    
    // Allow clicking on any frame for editing
    setCurrentFrame(frameNumber);
    
    // Determine appropriate throw number
    const frame = frames[frameNumber - 1];
    const throws = frame.throws || [];
    
    if (frameNumber < 10) {
      if (throws.length === 0) {
        setCurrentThrow(1);
      } else if (throws[0] === 10) {
        // Strike - can edit the strike throw
        setCurrentThrow(1);
      } else if (throws.length === 1) {
        setCurrentThrow(2);
      } else {
        // Frame complete, can edit second throw
        setCurrentThrow(2);
      }
    } else {
      // 10th frame
      if (throws.length === 0) {
        setCurrentThrow(1);
      } else if (throws.length === 1) {
        setCurrentThrow(2);
      } else if (throws.length === 2) {
        const needsThirdThrow = throws[0] === 10 || throws[0] + throws[1] === 10;
        setCurrentThrow(needsThirdThrow ? 3 : 2);
      } else {
        setCurrentThrow(3);
      }
    }
    
    // Clear selected pins when switching frames
    setSelectedPins([]);
    // Open throw selector so user can pick which throw to edit
    setEditingThrowSelectorOpen(true);
  };

  const handleQuickSelect = (type) => {
    const frame = frames[currentFrame - 1];
    const throws = frame.throws || [];
    const frameKey = `${currentFrame}`;
    const availablePins = getAvailablePins();
    
    switch (type) {
      case 'gutter':
        setSelectedPins([]);
        break;
      case 'strike':
        // Select all available (standing) pins
        setSelectedPins([...availablePins]);
        break;
      case 'half':
        // Select half of the available pins
        const halfPins = Math.floor(availablePins.length / 2);
        setSelectedPins(availablePins.slice(0, halfPins));
        break;
    }
  };

  const handleReset = () => {
    if (initializeGame) {
      initializeGame({
        entryMode: 'pin_by_pin',
        entry_mode: 'pin_by_pin',
        ...initialData
      });
    }
    setCurrentFrame(1);
    setCurrentThrow(1);
    setSelectedPins([]);
    setFrameThrowPins({});
    setFrameBalls({});
  };

  const handleSaveGame = async () => {
    if (!gameComplete || !currentGame) return;

    // Recalculate with error handling
    const calcResult = safeCalculation(
      () => BowlingScoreCalculator.calculateGameScore(frames),
      frames
    );

    if (!calcResult.success) {
      console.error('Failed to calculate score:', calcResult.error);
      return;
    }

    const calculatedFrames = calcResult.data;
    const totalScore = calculatedFrames[calculatedFrames.length - 1]?.cumulative_score || 0;
    
    const statsResult = safeCalculation(
      () => BowlingScoreCalculator.getGameStatistics(calculatedFrames),
      calculatedFrames
    );

    const gameStats = statsResult.success ? statsResult.data : { strikes: 0, spares: 0, opens: 0 };
      
    const gameData = {
      ...currentGame,
      entryMode: 'pin_by_pin',
      entry_mode: 'pin_by_pin',
      game_type: 'pin_by_pin',
      frames: calculatedFrames,
      total_score: totalScore,
      totalScore: totalScore,
      strikes: gameStats.strikes,
      spares: gameStats.spares,
      opens: gameStats.opens,
      frameThrowPins: frameThrowPins,
      frameBalls: frameBalls,
      created_at: (() => {
        const [year, month, day] = gameDate.split('-');
        const now = new Date();
        const gameDateTime = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
        return gameDateTime.toISOString();
      })()
    };

    // Validate game data
    const validation = validateGameData(gameData, 'pin_by_pin');
    if (!validation.valid) {
      console.error('Validation failed:', validation.errors);
      return;
    }

    setIsSubmitting(true);
    const result = await withErrorHandling(
      async () => await onGameComplete(gameData),
      {
        maxRetries: 2,
        errorMessage: 'Failed to save game',
      }
    );

    if (result.success) {
      clearGameEntryState(ENTRY_MODE);
    } else {
      setIsSubmitting(false);
    }
  };

  const currentFrameThrows = frames[currentFrame - 1]?.throws || [];
  const totalScore = currentGame?.total_score || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-charcoal-800 mb-2">Pin by Pin Entry</h2>
        <p className="text-charcoal-600">Enter each throw for maximum detail</p>
      </div>

      {/* Scorecard Toggle */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowScorecard(!showScorecard)}
          className="flex items-center space-x-2"
        >
          {showScorecard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{showScorecard ? 'Hide' : 'Show'} Scorecard</span>
        </Button>
      </div>

      {/* Scorecard */}
      {showScorecard && (
        <Card>
          <CardContent className="p-4">
            <BowlingScorecard 
              frames={frames}
              onFrameClick={handleFrameClick}
              currentFrame={currentFrame}
              totalScore={totalScore}
              gameComplete={gameComplete}
              entryMode="pin_by_pin"
              strikes={currentGame?.strikes}
              spares={currentGame?.spares}
            />
          </CardContent>
        </Card>
      )}

      {!gameComplete ? (
        <>
          {/* Current Throw Info */}
          <Card className="bg-vintage-red-50 border-vintage-red-200">
            <CardContent className="p-3">
              <div className="text-center">
                <h3 className="text-base font-bold text-vintage-red-800">
                  Frame {currentFrame} - Throw {currentThrow}
                  {currentFrameThrows.length >= currentThrow && (
                    <span className="text-xs font-normal"> (Editing)</span>
                  )}
                </h3>
                <p className="text-sm text-vintage-red-600">
                  {currentFrame < 10 && currentThrow === 2 
                    ? `Remaining: ${10 - (currentFrameThrows[0] || 0)} pins`
                    : 'Select pins knocked down'
                  }
                </p>
                <p className="text-base font-bold text-charcoal-800">
                  Selected: {selectedPins.length} pins
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ball Selection - Compact */}
          <Card className="bg-cream-50 border-cream-200">
            <CardContent className="p-3">
              <h4 className="font-semibold text-charcoal-800 text-sm text-center mb-2">
                Ball for This Throw (Optional)
              </h4>
                
              {/* Selected Ball Display */}
              <div className="text-center p-2 bg-white rounded-lg border mb-2">
                {(() => {
                  const selectedBall = getBallForThrow(currentFrame, currentThrow);
                  if (selectedBall) {
                    if (selectedBall.type === 'house') {
                      return (
                        <div>
                          <p className="font-medium text-charcoal-800 text-sm">House Ball</p>
                          <p className="text-xs text-charcoal-600">{selectedBall.weight} lbs</p>
                        </div>
                      );
                    } else {
                      return (
                        <div>
                          <p className="font-medium text-charcoal-800 text-sm">{selectedBall.brand} {selectedBall.model}</p>
                          <p className="text-xs text-charcoal-600">{selectedBall.weight} lbs</p>
                        </div>
                      );
                    }
                  } else {
                    return <p className="text-charcoal-500 italic text-sm">No ball selected</p>;
                  }
                })()}
              </div>

              {/* Ball Selection Buttons - Compact Grid */}
              <div className="space-y-2">
                {/* Personal Balls */}
                {availableBalls.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-charcoal-700 mb-1">Your Balls</h5>
                    <div className="grid grid-cols-2 gap-1">
                      {availableBalls.map((ball) => (
                        <button
                          key={ball.id}
                          onClick={() => setBallForThrow(currentFrame, currentThrow, ball)}
                          className={`p-1.5 text-left text-xs border rounded transition-colors ${
                            getBallForThrow(currentFrame, currentThrow)?.id === ball.id
                              ? 'bg-vintage-red-100 border-vintage-red-300 text-vintage-red-800'
                              : 'bg-white border-gray-200 text-charcoal-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium truncate">{ball.brand}</div>
                          <div className="text-xs text-charcoal-600">{ball.weight}lb</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* House Balls */}
                <div>
                  <h5 className="text-xs font-medium text-charcoal-700 mb-1">House Balls</h5>
                  <div className="grid grid-cols-5 gap-1">
                    {houseBallWeights.map((weight) => (
                      <button
                        key={weight}
                        onClick={() => setBallForThrow(currentFrame, currentThrow, {
                          type: 'house',
                          weight: weight,
                          id: `house-${weight}`,
                          brand: 'House',
                          model: `${weight}lb`
                        })}
                        className={`p-1.5 text-xs border rounded transition-colors ${
                          getBallForThrow(currentFrame, currentThrow)?.weight === weight &&
                          getBallForThrow(currentFrame, currentThrow)?.type === 'house'
                            ? 'bg-vintage-red-100 border-vintage-red-300 text-vintage-red-800'
                            : 'bg-white border-gray-200 text-charcoal-700 hover:bg-gray-50'
                        }`}
                      >
                        {weight}lb
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pin Selection - Compact */}
          <Card>
            <CardContent className="p-3">
              {/* Throw selector (shows when user clicks a frame) */}
              {editingThrowSelectorOpen && (
                <div className="absolute top-2 right-2 z-30 bg-white/95 dark:bg-gray-800/95 p-3 rounded shadow-lg border">
                  <div className="text-sm font-semibold mb-2">Edit Throw</div>
                  <div className="flex gap-1 mb-2">
                    {/* For frames 1-9 there are up to 2 throws, frame 10 may have 3 */}
                    {[1, 2, 3].map((t) => {
                      if (t === 3 && currentFrame !== 10) return null;
                      
                      // Get throw info for display
                      const frame = frames[currentFrame - 1];
                      const throws = frame.throws || [];
                      const throwExists = t <= throws.length;
                      const throwScore = throwExists ? throws[t - 1] : null;
                      
                      // Determine if this throw should be available for editing
                      let isAvailable = true;
                      if (currentFrame < 10) {
                        if (t === 2 && throws[0] === 10) {
                          isAvailable = false; // No second throw after strike
                        }
                      } else {
                        // 10th frame - third throw only if strike or spare
                        if (t === 3) {
                          const needsThirdThrow = throws[0] === 10 || (throws[0] + (throws[1] || 0) === 10);
                          isAvailable = needsThirdThrow;
                        }
                      }
                      
                      return (
                        <button
                          key={t}
                          onClick={() => isAvailable ? handleChooseThrow(t) : null}
                          disabled={!isAvailable}
                          className={`px-3 py-1 text-xs rounded border flex flex-col items-center min-w-[40px] ${
                            currentThrow === t 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : isAvailable 
                                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                          }`}>
                          <span className="font-semibold">{t}</span>
                          {throwExists && (
                            <span className="text-xs opacity-75">
                              {throwScore === 10 ? 'X' : throwScore || '0'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => setEditingThrowSelectorOpen(false)} 
                    className="px-2 py-1 text-xs rounded border bg-red-100 hover:bg-red-200 text-red-800 w-full">
                    Cancel
                  </button>
                </div>
              )}

              {/* Pin Deck Container with proper spacing */}
              <div className="my-6 py-4 relative">
                <PinDeck 
                  knockedDownPins={getKnockedDownPins()}
                  availablePins={getAvailablePins()}
                  onPinClick={handlePinClick}
                  pinAnimations={pinAnimations}
                />
                
                {/* Sweep Animation Overlay */}
                <PinSweepAnimation 
                  isAnimating={isAnimating}
                  onAnimationComplete={handleAnimationComplete}
                  remainingPins={pinsToSweep}
                  onPinHit={handlePinHit}
                />
              </div>

              {/* Selected Pins Display - Compact */}
              {selectedPins.length > 0 && (
                <div className="text-center mb-3">
                  <p className="text-xs text-charcoal-600 mb-1">Selected:</p>
                  <div className="flex justify-center flex-wrap gap-1">
                    {selectedPins.map(pin => (
                      <span 
                        key={pin}
                        className="bg-vintage-red-100 text-vintage-red-800 px-1.5 py-0.5 rounded text-xs font-bold"
                      >
                        {pin}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Split Alert - Enhanced with Full Guide Info */}
              {currentSplit && showSplitAdvice && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start space-x-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900 text-sm">{currentSplit.name}</h4>
                      <p className="text-xs text-orange-700 mt-1">
                        {currentSplit.description}
                      </p>
                      <div className="mt-2 flex items-center space-x-3 text-xs">
                        <span className="font-semibold">Pins: {currentSplit.pins.join('-')}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          currentSplit.difficulty === 'easy' || currentSplit.difficulty === 'very_easy' ? 'bg-green-100 text-green-800' :
                          currentSplit.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          currentSplit.difficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {currentSplit.difficulty.replace('_', ' ')}
                        </span>
                        {currentSplit.conversionRate > 0 && (
                          <>
                            <span>•</span>
                            <span><strong>{currentSplit.conversionRate}%</strong> conversion rate</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Conversion Strategy */}
                  {(() => {
                    const advice = getSplitAdvice(currentSplit);
                    return (
                      <div className="mt-3 space-y-2 bg-white bg-opacity-70 p-3 rounded border border-orange-200">
                        <div>
                          <span className="font-semibold text-xs text-orange-900">🎯 Target Pin:</span>
                          <span className="ml-2 text-xs text-gray-800">{advice.targetPin}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-orange-900">📍 Approach:</span>
                          <p className="text-xs text-gray-800 mt-1">{advice.approach}</p>
                        </div>
                        {advice.tips && advice.tips.length > 0 && (
                          <div>
                            <span className="font-semibold text-xs text-orange-900">💡 Pro Tips:</span>
                            <ul className="list-disc list-inside text-xs text-gray-800 mt-1 space-y-0.5 ml-2">
                              {advice.tips.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  <button
                    onClick={() => setShowSplitAdvice(false)}
                    className="mt-2 text-xs text-orange-600 hover:text-orange-800 font-semibold"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Quick Select Buttons - Compact */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleQuickSelect('gutter')}
                  className="text-sm"
                >
                  Gutter (0)
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleQuickSelect('strike')}
                  className="text-sm"
                >
                  {currentThrow === 2 && currentFrame === 10
                    ? `Spare (${10 - (currentFrameThrows[0] || 0)})`
                    : currentFrame < 10 && currentThrow === 2
                      ? `Spare (${10 - (currentFrameThrows[0] || 0)})`
                      : 'Strike (10)'
                  }
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleQuickSelect('half')}
                  className="text-sm"
                >
                  Half
                </Button>
              </div>

              {/* Confirm Button (per-throw) */}
              <div className="mt-6 pt-4 border-t border-charcoal-200">
                <Button
                  onClick={handleConfirmThrow}
                  className="w-full"
                  size="lg"
                  disabled={isAnimating}
                >
                  <Target className="w-4 h-4 mr-2" />
                  {isAnimating ? (
                    'Animation in progress...'
                  ) : currentFrameThrows.length >= currentThrow ? (
                    `Update Throw ${currentThrow} (${selectedPins.length} Pin${selectedPins.length !== 1 ? 's' : ''})`
                  ) : (
                    `Confirm ${selectedPins.length} Pin${selectedPins.length !== 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Game Complete */
        <Card className="bg-mint-green-50 border-mint-green-200">
          <CardContent className="p-6 text-center space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-mint-green-800 mb-2">Game Complete!</h3>
              <p className="text-3xl font-bold text-charcoal-800">{totalScore} points</p>
            </div>
            
            <div className="flex space-x-4 justify-center">
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isSubmitting}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Game
              </Button>
              
              <Button
                onClick={handleSaveGame}
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Game
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Date */}
      {gameComplete && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-charcoal-700 flex-shrink-0">
                Game Date:
              </label>
              <Input
                type="date"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                max={getLocalDateString()}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Progress */}
      {!gameComplete && (
        <Card className="bg-charcoal-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-charcoal-600">Current Score:</span>
              <span className="text-xl font-bold text-charcoal-800">{totalScore}</span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-charcoal-200 rounded-full h-2">
                <div 
                  className="h-2 bg-vintage-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${((currentFrame - 1) / 10) * 100}%` }}
                />
              </div>
              <p className="text-xs text-charcoal-500 mt-1 text-center">
                Frame {currentFrame} of 10
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PinByPinEntry;