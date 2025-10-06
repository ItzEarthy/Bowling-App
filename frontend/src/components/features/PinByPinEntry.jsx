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

/**
 * Individual Pin Component for Pin Selection (circular, true-to-life)
 */
const Pin = ({ pinNumber, isKnockedDown, isDisabled = false }) => {
  // SVG bowling pin visual. The wrapper controls sizing; this is pointer-events-none
  const fill = isKnockedDown ? '#DC2626' : '#FFFFFF';
  const stroke = isKnockedDown ? '#B91C1C' : '#374151';

  return (
    <div className="pointer-events-none select-none flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
      <svg viewBox="0 0 100 200" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
        {/* Simple stylized pin shape */}
        <path d="M50 6 C66 6 78 18 78 32 C78 42 70 48 64 64 C58 80 60 92 60 104 C60 118 50 126 50 126 C50 126 40 118 40 104 C40 92 42 80 36 64 C30 48 22 42 22 32 C22 18 34 6 50 6 Z" fill={fill} stroke={stroke} strokeWidth="2" />
        {/* Neck and base accent */}
        <ellipse cx="50" cy="152" rx="22" ry="8" fill={fill} stroke={stroke} strokeWidth="1" opacity="0.9" />
        {/* Number badge */}
        <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" fontSize="30" fontWeight="700" fill={isKnockedDown ? '#fff' : '#111827'}>{pinNumber}</text>
      </svg>
    </div>
  );
};

/**
 * Pin Deck Layout Component (true-to-life triangle, absolute positioning)
 */
const PinDeck = ({
  knockedDownPins = [],
  availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  onPinClick
}) => {
  // Use real-world inches but map them to percentages so pins scale to container width/height
  const deckInchesWidth = 40.75;
  const deckInchesHeight = 35.875;
  const pinDiameterInches = 4.75;

  // Pin positions (in inches, center coordinates measured from left/top of deck)
  const pinPositions = {
    1:  { top: 0, left: 18 },
    2:  { top: 10.39, left: 12 },
    3:  { top: 10.39, left: 24 },
    4:  { top: 20.78, left: 6 },
    5:  { top: 20.78, left: 18 },
    6:  { top: 20.78, left: 30 },
    7:  { top: 31.17, left: 0 },
    8:  { top: 31.17, left: 12 },
    9:  { top: 31.17, left: 24 },
    10: { top: 31.17, left: 36 },
  };

  return (
    <div
      className="pin-deck relative mx-auto"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 520,
        aspectRatio: `${deckInchesWidth} / ${deckInchesHeight}`,
        margin: '0 auto',
        background: 'transparent',
        minWidth: 260
      }}
    >
      {Object.entries(pinPositions).map(([pinNumber, pos]) => {
        const isKnocked = knockedDownPins.includes(Number(pinNumber));
        const isAvailable = availablePins.includes(Number(pinNumber));

        // Compute center position as percentages of the deck so visuals scale with container
        const leftPercent = (pos.left / deckInchesWidth) * 100;
        // Invert vertical axis so pin 1 is at the bottom
        const topPercent = ((deckInchesHeight - pos.top) / deckInchesHeight) * 100;

        // Size pin as percent of deck width to keep consistent circular/oval sizing
        const pinSizePercent = (pinDiameterInches / deckInchesWidth) * 100;

        return (
          <button
            key={pinNumber}
            onClick={() => isAvailable && onPinClick && onPinClick(Number(pinNumber))}
            disabled={!isAvailable}
            aria-pressed={isKnocked}
            aria-label={`Pin ${pinNumber}`}
            className={`absolute transition-transform duration-150 p-0 shadow-md focus:outline-none flex items-center justify-center ${isKnocked ? 'opacity-60' : 'opacity-100'}`}
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              transform: 'translate(-50%, -50%)',
              width: `${pinSizePercent}%`,
              height: `${pinSizePercent}%`,
              minWidth: 28,
              minHeight: 40,
              maxWidth: 88,
              maxHeight: 120,
              zIndex: isKnocked ? 1 : 4,
              background: 'transparent',
              border: 'none'
            }}
          >
            <Pin pinNumber={Number(pinNumber)} isKnockedDown={isKnocked} isDisabled={!isAvailable} />
          </button>
        );
      })}
    </div>
  );
};

/**
 * Pin-by-Pin Entry Component
 * Enhanced full-game pin entry interface
 */
const PinByPinEntry = ({ onGameComplete, initialData = {} }) => {
  // Use game store for consistent state management
  const { 
    currentGame, 
    currentFrame: storeCurrentFrame, 
    currentThrow: storeCurrentThrow,
    setCurrentFrameAndThrow,
    addThrow,
    updateFrame,
    initializeGame,
    setCurrentGame
  } = useGameStore();

  // Initialize game if not already present
  useEffect(() => {
    if (!currentGame) {
      initializeGame({
        entryMode: 'pin_by_pin',
        ...initialData
      });
    }
  }, [currentGame, initializeGame, initialData]);

  // Local state for pin-by-pin specific data
  const [currentFrame, setCurrentFrame] = useState(storeCurrentFrame || 1);
  const [currentThrow, setCurrentThrow] = useState(storeCurrentThrow || 1);
  
  const [selectedPins, setSelectedPins] = useState([]);
  const [frameThrowPins, setFrameThrowPins] = useState({}); // Store which specific pins were hit for each throw
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
  const [frameBalls, setFrameBalls] = useState({}); // Store ball selection per frame/throw

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
    try {
      const response = await ballAPI.getBalls();
      setAvailableBalls(response.data.balls || []);
    } catch (err) {
      console.log('Could not load balls');
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
      
      // If first throw was a strike, all pins are down
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
          // Show all previous throws
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
      setSelectedPins([]);
    }
  };

  const handleChooseThrow = (throwNum) => {
    setCurrentThrow(throwNum);
    loadPinsForThrow(currentFrame, throwNum);
    setEditingThrowSelectorOpen(false);
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

  const handleConfirmThrow = () => {
    if (!currentGame) return;
    
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
    
    // Initialize throws array if needed
    if (!newFrames[frameIndex].throws) {
      newFrames[frameIndex].throws = [];
    }
    
    // Handle editing existing throws
    const throwIndex = currentThrow - 1;
    if (throwIndex < newFrames[frameIndex].throws.length) {
      // Replace existing throw
      newFrames[frameIndex].throws[throwIndex] = pinsKnockedDown;
      
      // If we're editing an earlier throw, clear subsequent throws in the frame
      if (currentFrame < 10) {
        if (throwIndex === 0 && pinsKnockedDown === 10) {
          // Strike - clear second throw and its pin data
          newFrames[frameIndex].throws = [10];
          const secondThrowKey = `${frameKey}-2`;
          setFrameThrowPins(prev => {
            const newPins = { ...prev };
            delete newPins[secondThrowKey];
            return newPins;
          });
        } else if (throwIndex === 0) {
          // First throw but not strike - clear second throw
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
      // Add new throw
      newFrames[frameIndex].throws.push(pinsKnockedDown);
    }

    // Calculate scores and update game store
    const updatedFrames = BowlingScoreCalculator.calculateGameScore(newFrames);
    const totalScore = updatedFrames[updatedFrames.length - 1].cumulative_score || 0;
    
    // Update the game in the store
    const updatedGame = {
      ...currentGame,
      frames: updatedFrames,
      total_score: totalScore,
      is_complete: BowlingScoreCalculator.isGameComplete(updatedFrames)
    };
    
    setCurrentGame(updatedGame);

    // Check if game is complete
    if (updatedGame.is_complete) {
      return;
    }

    // Determine next throw/frame
    const throws = updatedFrames[frameIndex].throws;
    const prevFrame = currentFrame;
    const nextFrameChanged = currentFrame < 10 && (throws[0] === 10 || throws.length === 2);
    
    if (currentFrame < 10) {
      // Frames 1-9
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

    // Dispatch frame changed event to dismiss achievement toasts
    if (nextFrameChanged || (currentFrame === 10 && prevFrame !== currentFrame)) {
      window.dispatchEvent(new CustomEvent('bowlingFrameChanged', { 
        detail: { frame: currentFrame + (nextFrameChanged ? 1 : 0) } 
      }));
    }

    setSelectedPins([]);
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
    initializeGame({
      entryMode: 'pin_by_pin',
      ...initialData
    });
    setCurrentFrame(1);
    setCurrentThrow(1);
    setSelectedPins([]);
    setFrameThrowPins({});
    setFrameBalls({});
  };

  const handleSaveGame = async () => {
    if (!gameComplete || !currentGame) return;

    setIsSubmitting(true);
    try {
      const totalScore = currentGame.total_score || 0;
      
      const gameData = {
        ...currentGame,
        entryMode: 'pin_by_pin',
        frames: frames,
        total_score: totalScore,
        frameThrowPins: frameThrowPins, // Include specific pins hit per throw
        frameBalls: frameBalls, // Include ball selections per throw
        created_at: (() => {
          // Combine game date with current time, preserving local timezone
          const [year, month, day] = gameDate.split('-');
          const now = new Date();
          const gameDateTime = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
          return gameDateTime.toISOString();
        })()
      };

      await onGameComplete(gameData);
    } catch (error) {
      console.error('Failed to save game:', error);
    } finally {
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
              entryMode="pin_by_pin"
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
                <div className="absolute top-2 right-2 z-30 bg-white/95 dark:bg-gray-800/95 p-2 rounded shadow-md">
                  <div className="text-sm font-semibold mb-1">Edit Throw</div>
                  <div className="flex gap-1">
                    {/* For frames 1-9 there are up to 2 throws, frame 10 may have 3 */}
                    {[1, 2, 3].map((t) => {
                      if (t === 3 && currentFrame !== 10) return null;
                      return (
                        <button
                          key={t}
                          onClick={() => handleChooseThrow(t)}
                          className={`px-2 py-1 text-xs rounded border ${currentThrow === t ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                          {t}
                        </button>
                      );
                    })}
                    <button onClick={() => setEditingThrowSelectorOpen(false)} className="px-2 py-1 text-xs rounded border bg-red-100">Cancel</button>
                  </div>
                </div>
              )}

              <PinDeck 
                knockedDownPins={getKnockedDownPins()}
                availablePins={getAvailablePins()}
                onPinClick={handlePinClick}
              />

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
                  {currentFrame < 10 && currentThrow === 2 
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

              {/* Confirm Button */}
              <Button
                onClick={handleConfirmThrow}
                className="w-full"
                size="lg"
              >
                <Target className="w-4 h-4 mr-2" />
                {currentFrameThrows.length >= currentThrow 
                  ? `Update Throw ${currentThrow} (${selectedPins.length} Pin${selectedPins.length !== 1 ? 's' : ''})`
                  : `Confirm ${selectedPins.length} Pin${selectedPins.length !== 1 ? 's' : ''}`
                }
              </Button>
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