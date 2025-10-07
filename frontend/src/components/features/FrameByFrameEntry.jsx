import React, { useState, useEffect } from 'react';
import { Target, Calculator, Save, RotateCcw, Edit, AlertTriangle, Plus } from 'lucide-react';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import BowlingScoreCalculator from '../../utils/bowlingScoring';
import { ballAPI } from '../../lib/api';
import BallSelector from '../shared/BallSelector';
import QuickSelectButtons, { QuickSelectLegend } from '../shared/QuickSelectButtons';
import { saveGameEntryState, loadGameEntryState, clearGameEntryState } from '../../utils/gameEntryPersistence';
import { withErrorHandling, validateGameData, safeCalculation } from '../../utils/errorHandling';

/**
 * Frame-by-Frame Entry Component
 * Allows users to enter throws for each frame with proper bowling scoring
 * Features: localStorage persistence, error handling, mobile-optimized UI
 */
const FrameByFrameEntry = ({ onGameComplete, initialData = {} }) => {
  const ENTRY_MODE = 'frame_by_frame';

  const [frames, setFrames] = useState(() => {
    return BowlingScoreCalculator.createEmptyGame();
  });

  const [selectedFrame, setSelectedFrame] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameDate, setGameDate] = useState(initialData.gameDate || new Date().toISOString().split('T')[0]);
  const [splits, setSplits] = useState({});
  const [availableBalls, setAvailableBalls] = useState([]);
  const [houseBallWeights] = useState([8, 9, 10, 11, 12, 13, 14, 15, 16]);
  const [frameBalls, setFrameBalls] = useState({});

  // Load saved state on mount
  useEffect(() => {
    const savedState = loadGameEntryState(ENTRY_MODE);
    if (savedState && Object.keys(initialData).length === 0) {
      if (savedState.frames) setFrames(savedState.frames);
      if (savedState.selectedFrame) setSelectedFrame(savedState.selectedFrame);
      if (savedState.splits) setSplits(savedState.splits);
      if (savedState.frameBalls) setFrameBalls(savedState.frameBalls);
      if (savedState.gameDate) setGameDate(savedState.gameDate);
    }
  }, []);

  // Auto-save state when data changes
  useEffect(() => {
    const hasData = frames.some(f => f.throws && f.throws.length > 0);
    if (hasData) {
      saveGameEntryState(ENTRY_MODE, {
        frames,
        selectedFrame,
        splits,
        frameBalls,
        gameDate,
      });
    }
  }, [frames, selectedFrame, splits, frameBalls, gameDate]);

  useEffect(() => {
    loadAvailableBalls();
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

  // Update frames when data changes
  useEffect(() => {
    const result = safeCalculation(
      () => BowlingScoreCalculator.calculateGameScore(frames),
      frames
    );

    if (result.success && JSON.stringify(result.data) !== JSON.stringify(frames)) {
      setFrames(result.data);
    } else if (!result.success) {
      setErrors({ calculation: result.error.message });
    }
  }, []);

  // Handle throw input for a specific frame
  const handleThrowInput = (frameIndex, throwIndex, value) => {
    const newFrames = [...frames];
    const frame = newFrames[frameIndex];
    
    if (!frame.throws) frame.throws = [];
    
    const numValue = value === '' ? null : parseInt(value);
    
    // Validate input
    if (numValue !== null) {
      if (numValue < 0 || numValue > 10) return;
      
      // Additional validation for second throw
      if (throwIndex === 1 && frame.frame_number < 10) {
        const firstThrow = frame.throws[0] || 0;
        if (firstThrow + numValue > 10) return;
      }
    }
    
    // Update throws array
    if (throwIndex === 0) {
      frame.throws = numValue !== null ? [numValue] : [];
    } else if (throwIndex === 1) {
      if (frame.throws.length === 0) frame.throws = [0];
      frame.throws[1] = numValue;
    } else if (throwIndex === 2 && frame.frame_number === 10) {
      if (frame.throws.length < 2) frame.throws = [0, 0];
      frame.throws[2] = numValue;
    }

    // Clean up null values
    frame.throws = frame.throws.filter(t => t !== null);

    const result = safeCalculation(
      () => BowlingScoreCalculator.calculateGameScore(newFrames),
      newFrames
    );

    if (result.success) {
      setFrames(result.data);
      setErrors({});

      // Auto-advance logic
      if (numValue !== null) {
        const currentFrameNumber = frame.frame_number;
        
        if (currentFrameNumber < 10) {
          if (throwIndex === 0 && numValue === 10) {
            if (currentFrameNumber < 10) {
              setSelectedFrame(currentFrameNumber + 1);
            }
          } else if (throwIndex === 1) {
            if (currentFrameNumber < 10) {
              setSelectedFrame(currentFrameNumber + 1);
            }
          }
        }
      }
    } else {
      setErrors({ calculation: result.error.message });
    }
  };

  // Get display value for throw
  const getThrowDisplay = (frame, throwIndex) => {
    const throws = frame.throws || [];
    return BowlingScoreCalculator.getThrowDisplay(frame.frame_number, throwIndex, throws);
  };

  // Get available throws for a frame
  const getAvailableThrows = (frame) => {
    if (frame.frame_number === 10) {
      return [0, 1, 2]; // Up to 3 throws in 10th frame
    } else {
      const throws = frame.throws || [];
      if (throws[0] === 10) return [0]; // Strike - only one throw
      return [0, 1]; // Up to 2 throws
    }
  };

  // Handle frame selection
  const handleFrameSelect = (frameNumber) => {
    setSelectedFrame(frameNumber);
  };

  // Handle split toggle
  const handleSplitToggle = (frameNumber) => {
    setSplits(prev => ({
      ...prev,
      [frameNumber]: !prev[frameNumber]
    }));
  };

  // Clear all frames
  const handleClear = () => {
    setFrames(BowlingScoreCalculator.createEmptyGame());
    setSelectedFrame(1);
    setErrors({});
  };

  // Submit game
  const handleSubmit = async () => {
    const totalScore = frames[frames.length - 1]?.cumulative_score || 0;
    
    if (totalScore === 0) {
      setErrors({ submit: 'Please enter at least one throw' });
      return;
    }

    const gameData = {
      entryMode: 'frame_by_frame',
      frames: frames,
      totalScore: totalScore,
      splits: splits,
      frameBalls: frameBalls,
      created_at: new Date(gameDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString()
    };

    // Validate game data
    const validation = validateGameData(gameData, 'frame_by_frame');
    if (!validation.valid) {
      setErrors({ submit: validation.errors.join('. ') });
      return;
    }

    setIsSubmitting(true);
    const result = await withErrorHandling(
      async () => await onGameComplete(gameData),
      {
        maxRetries: 2,
        errorMessage: 'Failed to save game',
        onError: (error) => {
          setErrors({ submit: error.message });
        },
      }
    );

    if (result.success) {
      clearGameEntryState(ENTRY_MODE);
    } else {
      setIsSubmitting(false);
    }
  };

  const totalScore = frames[frames.length - 1]?.cumulative_score || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center mb-3">
        <h2 className="text-xl font-bold text-charcoal-800">Frame by Frame Entry</h2>
        <p className="text-sm text-charcoal-600">Enter throws for each frame</p>
      </div>

      {/* Frame Selection */}
      <Card>
        <CardContent className="p-3">
          <h3 className="font-medium text-charcoal-800 mb-2 text-sm">Select Frame:</h3>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
            {frames.map((frame) => (
              <button
                key={frame.frame_number}
                onClick={() => handleFrameSelect(frame.frame_number)}
                className={`p-2 rounded-lg border-2 transition-all ${
                  selectedFrame === frame.frame_number
                    ? 'border-vintage-red-500 bg-vintage-red-50'
                    : 'border-charcoal-200 bg-white hover:border-charcoal-300'
                }`}
              >
                <div className="text-xs font-medium text-charcoal-600">F{frame.frame_number}</div>
                <div className="text-base font-bold text-charcoal-800">
                  {frame.cumulative_score || '-'}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Frame Input */}
      <Card>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-charcoal-800">
              Frame {selectedFrame} {selectedFrame === 10 && '(Final)'}
            </h3>
            <div className="text-sm text-charcoal-600">
              Total: <span className="font-bold text-charcoal-800">{frames[selectedFrame - 1]?.cumulative_score || 0}</span>
            </div>
          </div>

          {/* Throw Inputs */}
          {getAvailableThrows(frames[selectedFrame - 1]).map((throwIndex) => {
            const currentValue = frames[selectedFrame - 1]?.throws?.[throwIndex];
            const firstThrow = frames[selectedFrame - 1]?.throws?.[0] || 0;
            const isSecondThrow = throwIndex === 1;
            const maxPins = isSecondThrow && selectedFrame < 10 ? 10 - firstThrow : 10;
            const isStrike = currentValue === 10;
            const isSpare = isSecondThrow && selectedFrame < 10 && firstThrow + currentValue === 10;

            return (
              <div key={throwIndex} className="border border-charcoal-200 rounded-lg p-3 bg-white">
                <label className="block font-semibold text-charcoal-800 mb-2 text-sm">
                  {throwIndex === 0 ? '1st' : throwIndex === 1 ? '2nd' : '3rd'} Throw
                  {isStrike && <span className="ml-2 text-green-600 text-xs">✓ Strike</span>}
                  {isSpare && <span className="ml-2 text-blue-600 text-xs">✓ Spare</span>}
                </label>
                
                {/* Quick Actions with QuickSelectButtons component */}
                <QuickSelectButtons
                  onStrike={() => handleThrowInput(selectedFrame - 1, throwIndex, '10')}
                  onSpare={() => handleThrowInput(selectedFrame - 1, throwIndex, String(10 - firstThrow))}
                  onGutter={() => handleThrowInput(selectedFrame - 1, throwIndex, '0')}
                  onHalf={() => handleThrowInput(selectedFrame - 1, throwIndex, '5')}
                  showSpare={isSecondThrow && selectedFrame < 10 && firstThrow < 10}
                  spareValue={10 - firstThrow}
                  className="mb-2"
                />
                
                {/* Number Grid */}
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {Array.from({ length: maxPins }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => handleThrowInput(selectedFrame - 1, throwIndex, String(num))}
                      className={`p-2 rounded font-bold text-sm border-2 transition-all active:scale-95 ${
                        currentValue === num
                          ? 'bg-vintage-red-600 text-white border-vintage-red-700 shadow'
                          : 'bg-white text-charcoal-800 border-charcoal-300 hover:border-vintage-red-500 hover:bg-vintage-red-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Ball Selection */}
                <div className="mt-2">
                  <BallSelector
                    selectedBall={getBallForThrow(selectedFrame, throwIndex)}
                    onBallSelect={(ball) => setBallForThrow(selectedFrame, throwIndex, ball)}
                    availableBalls={availableBalls}
                    houseBallWeights={houseBallWeights}
                    compact
                  />
                </div>
              </div>
            );
          })}

          {/* Split Tracking */}
          {selectedFrame < 10 && frames[selectedFrame - 1]?.throws?.[0] > 0 && frames[selectedFrame - 1]?.throws?.[0] < 10 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-900 text-sm">Split?</span>
                </div>
                <Button
                  variant={splits[selectedFrame] ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handleSplitToggle(selectedFrame)}
                >
                  {splits[selectedFrame] ? "Marked" : "Mark Split"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Summary */}
      <Card className="bg-charcoal-50">
        <CardContent className="p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-charcoal-800">Total Score</span>
            <span className="text-xl font-bold text-charcoal-800">{totalScore}</span>
          </div>
          
          {/* All Frames Display */}
          <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
            {frames.map((frame) => (
              <button
                key={frame.frame_number}
                className={`p-2 rounded border cursor-pointer transition-all text-center ${
                  frame.throws && frame.throws.length > 0
                    ? 'bg-mint-green-50 border-mint-green-200 text-mint-green-800'
                    : 'bg-white border-charcoal-200 text-charcoal-400'
                } ${selectedFrame === frame.frame_number ? 'ring-2 ring-vintage-red-500' : ''}`}
                onClick={() => handleFrameSelect(frame.frame_number)}
              >
                <div className="text-xs font-medium">F{frame.frame_number}</div>
                <div className="flex justify-center space-x-0.5 my-0.5">
                  {getAvailableThrows(frame).map((throwIndex) => (
                    <span key={throwIndex} className="text-xs font-bold">
                      {getThrowDisplay(frame, throwIndex) || '-'}
                    </span>
                  ))}
                </div>
                <div className="text-xs font-bold">{frame.cumulative_score || 0}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Select Legend */}
      <QuickSelectLegend className="text-xs" />

      {/* Error Messages */}
      {(errors.submit || errors.calculation) && (
        <div className="bg-vintage-red-50 border border-vintage-red-200 rounded-lg p-3">
          <p className="text-vintage-red-800 text-sm">{errors.submit || errors.calculation}</p>
        </div>
      )}

      {/* Game Date */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-charcoal-700 flex-shrink-0">Date:</label>
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

      {/* Action Buttons */}
      <div className="flex gap-3 sticky bottom-4">
        <Button
          onClick={handleClear}
          variant="outline"
          className="flex-1"
          disabled={isSubmitting}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Clear
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={totalScore === 0 || isSubmitting}
          className="flex-1 shadow-lg"
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
    </div>
  );
};

export default FrameByFrameEntry;