import React, { useState, useEffect } from 'react';
import { Target, Calculator, Save, RotateCcw, Edit, AlertTriangle } from 'lucide-react';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import BowlingScoreCalculator from '../../utils/bowlingScoring';

/**
 * Frame-by-Frame Entry Component
 * Allows users to enter throws for each frame with proper bowling scoring
 */
const FrameByFrameEntry = ({ onGameComplete, initialData = {} }) => {
  // Initialize frames with proper structure for bowling
  const [frames, setFrames] = useState(() => {
    return BowlingScoreCalculator.createEmptyGame();
  });

  const [selectedFrame, setSelectedFrame] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameDate, setGameDate] = useState(initialData.gameDate || new Date().toISOString().split('T')[0]);
  const [splits, setSplits] = useState({});

  // Update frames when data changes
  useEffect(() => {
    const updatedFrames = BowlingScoreCalculator.calculateGameScore(frames);
    if (JSON.stringify(updatedFrames) !== JSON.stringify(frames)) {
      setFrames(updatedFrames);
    }
  }, []); // Only run once on mount to avoid infinite loop

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

    const updatedFrames = BowlingScoreCalculator.calculateGameScore(newFrames);
    setFrames(updatedFrames);
    
    // Clear errors
    setErrors({});
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

    setIsSubmitting(true);
    try {
      const gameData = {
        entryMode: 'frame_by_frame',
        frames: frames,
        totalScore: totalScore,
        splits: splits, // Include split data
        created_at: new Date(gameDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString()
      };

      await onGameComplete(gameData);
    } catch (error) {
      setErrors({ submit: 'Failed to save game. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalScore = frames[frames.length - 1]?.cumulative_score || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-charcoal-800 mb-2">Frame by Frame Entry</h2>
        <p className="text-charcoal-600">Enter throws for each frame using bowling notation</p>
      </div>

      {/* Frame Selection */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium text-charcoal-800 mb-4">Select Frame to Edit:</h3>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {frames.map((frame) => (
              <button
                key={frame.frame_number}
                onClick={() => handleFrameSelect(frame.frame_number)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedFrame === frame.frame_number
                    ? 'border-vintage-red-500 bg-vintage-red-50'
                    : 'border-charcoal-200 bg-white hover:border-charcoal-300'
                }`}
              >
                <div className="text-xs font-medium text-charcoal-600">Frame {frame.frame_number}</div>
                <div className="text-lg font-bold text-charcoal-800">
                  {frame.cumulative_score || '-'}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Frame Input */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-charcoal-800">
              Frame {selectedFrame} {selectedFrame === 10 && '(Final Frame)'}
            </h3>
            <div className="text-sm text-charcoal-600">
              Running Total: <span className="font-bold text-charcoal-800">{frames[selectedFrame - 1]?.cumulative_score || 0}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Throw Inputs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {getAvailableThrows(frames[selectedFrame - 1]).map((throwIndex) => (
                <div key={throwIndex}>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    {throwIndex === 0 ? 'First Throw' : throwIndex === 1 ? 'Second Throw' : 'Third Throw'}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={frames[selectedFrame - 1]?.throws?.[throwIndex] || ''}
                    onChange={(e) => handleThrowInput(selectedFrame - 1, throwIndex, e.target.value)}
                    placeholder="0"
                    className="text-center text-lg font-semibold"
                  />
                </div>
              ))}
            </div>

            {/* Split Tracking */}
            {selectedFrame < 10 && frames[selectedFrame - 1]?.throws?.[0] > 0 && frames[selectedFrame - 1]?.throws?.[0] < 10 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-orange-900">Split Situation?</span>
                  </div>
                  <Button
                    variant={splits[selectedFrame] ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleSplitToggle(selectedFrame)}
                  >
                    {splits[selectedFrame] ? "Split Marked" : "Mark as Split"}
                  </Button>
                </div>
                {splits[selectedFrame] && (
                  <p className="text-sm text-orange-700">
                    Split marked for Frame {selectedFrame}. This will be tracked in your statistics.
                  </p>
                )}
              </div>
            )}

            {/* Visual Display */}
            <div className="bg-charcoal-50 rounded-lg p-4">
              <h4 className="font-medium text-charcoal-800 mb-2">Frame Display:</h4>
              <div className="flex items-center space-x-4">
                <div className="bg-white border-2 border-charcoal-300 rounded p-4">
                  <div className="text-xs text-charcoal-600 mb-1">Frame {selectedFrame}</div>
                  <div className="flex space-x-1">
                    {getAvailableThrows(frames[selectedFrame - 1]).map((throwIndex) => (
                      <div key={throwIndex} className="w-8 h-8 border border-charcoal-200 rounded flex items-center justify-center bg-white">
                        <span className="font-bold text-sm">
                          {getThrowDisplay(frames[selectedFrame - 1], throwIndex) || '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-2 font-bold text-lg">
                    {frames[selectedFrame - 1]?.cumulative_score || 0}
                  </div>
                </div>
                
                {/* Scoring Help */}
                <div className="text-sm text-charcoal-600">
                  <div><strong>X</strong> = Strike (10 pins)</div>
                  <div><strong>/</strong> = Spare (10 total)</div>
                  <div><strong>Numbers</strong> = Pins knocked down</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Summary */}
      <Card className="bg-charcoal-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-charcoal-800">Game Summary</h4>
            <span className="text-2xl font-bold text-charcoal-800">{totalScore}</span>
          </div>
          
          {/* All Frames Display */}
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {frames.map((frame) => (
              <div 
                key={frame.frame_number}
                className={`text-center p-2 rounded border cursor-pointer transition-all ${
                  frame.throws && frame.throws.length > 0
                    ? 'bg-mint-green-50 border-mint-green-200 text-mint-green-800'
                    : 'bg-white border-charcoal-200 text-charcoal-400'
                } ${selectedFrame === frame.frame_number ? 'ring-2 ring-vintage-red-500' : ''}`}
                onClick={() => handleFrameSelect(frame.frame_number)}
              >
                <div className="text-xs font-medium">F{frame.frame_number}</div>
                <div className="flex justify-center space-x-1 my-1">
                  {getAvailableThrows(frame).map((throwIndex) => (
                    <span key={throwIndex} className="text-xs font-bold">
                      {getThrowDisplay(frame, throwIndex) || '-'}
                    </span>
                  ))}
                </div>
                <div className="text-sm font-bold">{frame.cumulative_score || 0}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      {errors.submit && (
        <div className="bg-vintage-red-50 border border-vintage-red-200 rounded-xl p-4">
          <p className="text-vintage-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Game Date */}
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

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={handleClear}
          variant="outline"
          className="flex-1"
          disabled={isSubmitting}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear All
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={totalScore === 0 || isSubmitting}
          className="flex-1"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving Game...
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