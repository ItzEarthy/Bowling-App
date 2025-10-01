import React, { useState, useEffect } from 'react';
import { Zap, Save, RotateCcw, Target, Eye, EyeOff } from 'lucide-react';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import BowlingScorecard from './BowlingScorecard';
import BowlingScoreCalculator from '../../utils/bowlingScoring';

/**
 * Individual Pin Component for Pin Selection
 */
const Pin = ({ 
  pinNumber, 
  isKnockedDown, 
  isDisabled = false,
  onClick 
}) => {
  return (
    <button
      className={`
        w-6 h-10 md:w-8 md:h-12 rounded-t-full rounded-b-sm transition-all duration-200 border-2
        ${isKnockedDown 
          ? 'bg-vintage-red-500 border-vintage-red-600 text-white' 
          : 'bg-white border-charcoal-300 text-charcoal-900 hover:bg-charcoal-50'
        }
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        font-bold text-xs md:text-sm shadow-md
      `}
      onClick={() => !isDisabled && onClick && onClick(pinNumber)}
      disabled={isDisabled}
    >
      {pinNumber}
    </button>
  );
};

/**
 * Pin Deck Layout Component
 */
const PinDeck = ({ 
  knockedDownPins = [], 
  availablePins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  onPinClick 
}) => {
  // Traditional bowling pin arrangement (4-3-2-1 triangle)
  const pinRows = [
    [7, 8, 9, 10], // Back row
    [4, 5, 6],     // Third row  
    [2, 3],        // Second row
    [1]            // Front row (headpin)
  ];

  return (
    <div className="flex flex-col items-center space-y-2 md:space-y-3 py-4 md:py-6">
      {pinRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex space-x-1 md:space-x-2">
          {row.map(pinNumber => (
            <Pin
              key={pinNumber}
              pinNumber={pinNumber}
              isKnockedDown={knockedDownPins.includes(pinNumber)}
              isDisabled={!availablePins.includes(pinNumber)}
              onClick={onPinClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Pin-by-Pin Entry Component
 * Enhanced full-game pin entry interface
 */
const PinByPinEntry = ({ onGameComplete, initialData = {} }) => {
  // Initialize game state
  const [frames, setFrames] = useState(() => {
    return BowlingScoreCalculator.createEmptyGame();
  });

  const [currentFrame, setCurrentFrame] = useState(1);
  const [currentThrow, setCurrentThrow] = useState(1);
  const [selectedPins, setSelectedPins] = useState([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [showScorecard, setShowScorecard] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameDate, setGameDate] = useState(initialData.gameDate || new Date().toISOString().split('T')[0]);

  // Calculate available pins for current throw
  const getAvailablePins = () => {
    const frame = frames[currentFrame - 1];
    const throws = frame.throws || [];

    if (currentFrame < 10) {
      // Regular frames 1-9
      if (currentThrow === 1) {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      } else if (currentThrow === 2) {
        const firstThrowPins = throws[0] || 0;
        if (firstThrowPins === 10) return [];
        
        const remaining = 10 - firstThrowPins;
        return Array.from({ length: 10 }, (_, i) => i + 1).slice(0, remaining);
      }
    } else {
      // 10th frame - all pins available for each throw
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }
    return [];
  };

  // Check if game is complete
  const checkGameComplete = (framesData) => {
    return BowlingScoreCalculator.isGameComplete(framesData);
  };

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
        
        return newSelection;
      }
    });
  };

  const handleConfirmThrow = () => {
    const pinsKnockedDown = selectedPins.length;
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
          // Strike - clear second throw
          newFrames[frameIndex].throws = [10];
        } else if (throwIndex === 0) {
          // First throw but not strike - keep only first throw for now
          newFrames[frameIndex].throws = [pinsKnockedDown];
        }
      }
    } else {
      // Add new throw
      newFrames[frameIndex].throws.push(pinsKnockedDown);
    }

    // Calculate scores
    const updatedFrames = BowlingScoreCalculator.calculateGameScore(newFrames);
    setFrames(updatedFrames);

    // Check if game is complete
    const isGameComplete = checkGameComplete(updatedFrames);
    if (isGameComplete) {
      setGameComplete(true);
      return;
    }

    // Determine next throw/frame
    const throws = updatedFrames[frameIndex].throws;
    
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
      if (isComplete) {
        setGameComplete(true);
      } else {
        setCurrentThrow(Math.min(currentThrow + 1, 3));
      }
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
    
    setSelectedPins([]);
  };

  const handleQuickSelect = (type) => {
    const frame = frames[currentFrame - 1];
    const throws = frame.throws || [];
    
    switch (type) {
      case 'gutter':
        setSelectedPins([]);
        break;
      case 'strike':
        if (currentFrame < 10 && currentThrow === 2) {
          const firstThrowPins = throws[0] || 0;
          const remaining = 10 - firstThrowPins;
          setSelectedPins(Array.from({ length: remaining }, (_, i) => i + 1));
        } else {
          setSelectedPins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        }
        break;
      case 'half':
        const maxAvailable = currentFrame < 10 && currentThrow === 2 
          ? 10 - (throws[0] || 0)
          : 10;
        const halfPins = Math.floor(maxAvailable / 2);
        setSelectedPins(Array.from({ length: halfPins }, (_, i) => i + 1));
        break;
    }
  };

  const handleReset = () => {
    setFrames(BowlingScoreCalculator.createEmptyGame());
    setCurrentFrame(1);
    setCurrentThrow(1);
    setSelectedPins([]);
    setGameComplete(false);
  };

  const handleSaveGame = async () => {
    if (!gameComplete) return;

    setIsSubmitting(true);
    try {
      const totalScore = frames[frames.length - 1].cumulative_score;
      
      const gameData = {
        entryMode: 'pin_by_pin',
        frames: frames,
        totalScore: totalScore,
        created_at: new Date(gameDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString()
      };

      await onGameComplete(gameData);
    } catch (error) {
      console.error('Failed to save game:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentFrameThrows = frames[currentFrame - 1]?.throws || [];
  const totalScore = frames[frames.length - 1]?.cumulative_score || 0;

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
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-vintage-red-800">
                  Frame {currentFrame} - Throw {currentThrow}
                  {currentFrameThrows.length >= currentThrow && (
                    <span className="text-sm font-normal"> (Editing)</span>
                  )}
                </h3>
                <p className="text-vintage-red-600">
                  {currentFrame < 10 && currentThrow === 2 
                    ? `Remaining pins: ${10 - (currentFrameThrows[0] || 0)}`
                    : 'Select pins knocked down'
                  }
                </p>
                <p className="text-lg font-bold text-charcoal-800">
                  Selected: {selectedPins.length} pins
                </p>
                {currentFrameThrows.length >= currentThrow && (
                  <p className="text-sm text-charcoal-600">
                    Current value: {currentFrameThrows[currentThrow - 1] || 0} pins
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pin Selection */}
          <Card>
            <CardContent className="p-6">
              <PinDeck 
                knockedDownPins={selectedPins}
                availablePins={getAvailablePins()}
                onPinClick={handlePinClick}
              />

              {/* Selected Pins Display */}
              {selectedPins.length > 0 && (
                <div className="text-center mb-6">
                  <p className="text-sm text-charcoal-600 mb-2">Selected Pins:</p>
                  <div className="flex justify-center space-x-1">
                    {selectedPins.map(pin => (
                      <span 
                        key={pin}
                        className="bg-vintage-red-100 text-vintage-red-800 px-2 py-1 rounded text-sm font-bold"
                      >
                        {pin}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-3 gap-3 mb-6">
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
                max={new Date().toISOString().split('T')[0]}
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