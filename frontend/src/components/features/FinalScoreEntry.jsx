import React, { useState, useEffect } from 'react';
import { Trophy, Target, Zap, Save, Plus, X } from 'lucide-react';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { ballAPI } from '../../lib/api';
import BallSelector from '../shared/BallSelector';
import { saveGameEntryState, loadGameEntryState, clearGameEntryState } from '../../utils/gameEntryPersistence';
import { withErrorHandling, validateGameData } from '../../utils/errorHandling';

/**
 * Final Score Entry Component
 * Allows users to enter just the total score with optional strikes/spares
 * Features: localStorage persistence, error handling, mobile-optimized UI
 */
const FinalScoreEntry = ({ onGameComplete, initialData = {} }) => {
  const ENTRY_MODE = 'final_score';

  const [formData, setFormData] = useState({
    totalScore: initialData.totalScore || '',
    strikes: initialData.strikes || '',
    spares: initialData.spares || '',
    notes: initialData.notes || '',
    gameDate: initialData.gameDate || new Date().toISOString().split('T')[0],
    ballsUsed: initialData.ballsUsed || []
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableBalls, setAvailableBalls] = useState([]);
  const [houseBallWeights] = useState([8, 9, 10, 11, 12, 13, 14, 15, 16]);
  const [showBallSelector, setShowBallSelector] = useState(false);

  // Load saved state on mount
  useEffect(() => {
    const savedState = loadGameEntryState(ENTRY_MODE);
    if (savedState && Object.keys(initialData).length === 0) {
      setFormData(savedState);
    }
  }, []);

  // Auto-save state when form data changes
  useEffect(() => {
    if (formData.totalScore || formData.strikes || formData.spares) {
      saveGameEntryState(ENTRY_MODE, formData);
    }
  }, [formData]);

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

  const addBallToGame = (ball, isHouse = false, weight = null) => {
    const ballToAdd = isHouse ? {
      id: `house-${weight}`,
      name: `House Ball (${weight}lbs)`,
      weight: weight,
      type: 'house'
    } : {
      ...ball,
      type: 'personal'
    };

    // Check if ball already added
    const alreadyAdded = formData.ballsUsed.find(b => 
      b.id === ballToAdd.id || 
      (isHouse && b.type === 'house' && b.weight === weight)
    );

    if (!alreadyAdded) {
      setFormData(prev => ({
        ...prev,
        ballsUsed: [...prev.ballsUsed, ballToAdd]
      }));
    }
    setShowBallSelector(false);
  };

  const removeBallFromGame = (ballId) => {
    setFormData(prev => ({
      ...prev,
      ballsUsed: prev.ballsUsed.filter(ball => ball.id !== ballId)
    }));
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};
    const score = parseInt(formData.totalScore);
    const strikes = formData.strikes ? parseInt(formData.strikes) : 0;
    const spares = formData.spares ? parseInt(formData.spares) : 0;

    // Total score validation
    if (!formData.totalScore) {
      newErrors.totalScore = 'Total score is required';
    } else if (isNaN(score) || score < 0 || score > 300) {
      newErrors.totalScore = 'Score must be between 0 and 300';
    }

    // Strikes validation
    if (formData.strikes && (isNaN(strikes) || strikes < 0 || strikes > 12)) {
      newErrors.strikes = 'Strikes must be between 0 and 12';
    }

    // Spares validation  
    if (formData.spares && (isNaN(spares) || spares < 0 || spares > 10)) {
      newErrors.spares = 'Spares must be between 0 and 10';
    }

    // Logic validation - strikes + spares can't exceed frames
    if (strikes + spares > 10) {
      newErrors.strikes = 'Strikes + spares cannot exceed 10 frames';
      newErrors.spares = 'Strikes + spares cannot exceed 10 frames';
    }

    // Score reasonableness check
    if (score > 0 && strikes > 0) {
      const minExpectedScore = strikes * 10; // Very conservative estimate
      const maxExpectedScore = 300; // Perfect game
      
      if (score < minExpectedScore * 0.5) {
        newErrors.totalScore = `Score seems low for ${strikes} strikes`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const gameData = {
      entryMode: 'final_score',
      totalScore: parseInt(formData.totalScore),
      strikes: formData.strikes ? parseInt(formData.strikes) : undefined,
      spares: formData.spares ? parseInt(formData.spares) : undefined,
      notes: formData.notes || undefined,
      ballsUsed: formData.ballsUsed.length > 0 ? formData.ballsUsed : undefined,
      created_at: new Date(formData.gameDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString()
    };

    // Validate game data
    const validation = validateGameData(gameData, 'final_score');
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

  const getScoreColor = () => {
    const score = parseInt(formData.totalScore);
    if (isNaN(score)) return 'text-charcoal-800';
    if (score >= 200) return 'text-mint-green-600';
    if (score >= 150) return 'text-vintage-red-600';
    return 'text-charcoal-800';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-charcoal-800">Final Score Entry</h2>
        <p className="text-sm text-charcoal-600">Enter your total game score</p>
      </div>

      {/* Main Entry Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Total Score */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">Total Score</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="300"
                value={formData.totalScore}
                onChange={(e) => handleInputChange('totalScore', e.target.value)}
                className={`w-full text-3xl font-bold text-center py-3 px-4 border-2 rounded-lg
                  ${errors.totalScore 
                    ? 'border-vintage-red-300 bg-vintage-red-50' 
                    : 'border-charcoal-200 focus:border-vintage-red-500'
                  } ${getScoreColor()} focus:outline-none transition-colors`}
                placeholder="0"
              />
              <Trophy className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 ${getScoreColor()}`} />
            </div>
            {errors.totalScore && (
              <p className="text-vintage-red-600 text-xs mt-1">{errors.totalScore}</p>
            )}
            <p className="text-xs text-charcoal-500 mt-1">Enter 0-300</p>
          </div>

          {/* Strikes & Spares */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center text-sm font-medium text-charcoal-700 mb-2">
                <Target className="w-4 h-4 mr-1" />
                Strikes
              </label>
              <Input
                type="number"
                min="0"
                max="12"
                value={formData.strikes}
                onChange={(e) => handleInputChange('strikes', e.target.value)}
                placeholder="0"
                error={errors.strikes}
                className="text-center"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-charcoal-700 mb-2">
                <Zap className="w-4 h-4 mr-1" />
                Spares
              </label>
              <Input
                type="number"
                min="0"
                max="10"
                value={formData.spares}
                onChange={(e) => handleInputChange('spares', e.target.value)}
                placeholder="0"
                error={errors.spares}
                className="text-center"
              />
            </div>
          </div>

          {/* Balls Used */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Balls Used (Optional)
            </label>
            
            {formData.ballsUsed.length > 0 && (
              <div className="space-y-2 mb-2">
                {formData.ballsUsed.map((ball) => (
                  <div 
                    key={ball.id}
                    className="flex items-center justify-between p-2 bg-charcoal-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <div 
                        className="w-6 h-6 rounded-full border border-charcoal-300 flex-shrink-0"
                        style={{ backgroundColor: ball.color || (ball.type === 'house' ? '#6B7280' : '#374151') }}
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{ball.name}</div>
                        <div className="text-xs text-charcoal-600">{ball.weight}lbs</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBallFromGame(ball.id)}
                      className="p-1 text-vintage-red-600 hover:text-vintage-red-700 flex-shrink-0"
                      aria-label="Remove ball"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setShowBallSelector(true)}
              className="w-full"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Ball
            </Button>

            {/* Ball Selector Modal */}
            {showBallSelector && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-charcoal-200 p-3 flex justify-between items-center">
                    <h3 className="font-semibold text-charcoal-800">Select Ball</h3>
                    <button
                      onClick={() => setShowBallSelector(false)}
                      className="p-1 hover:bg-charcoal-100 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {availableBalls.length > 0 && (
                      <div>
                        <h4 className="font-medium text-charcoal-800 mb-2 text-sm">Personal Balls</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {availableBalls.map((ball) => (
                            <button
                              key={ball.id}
                              onClick={() => addBallToGame(ball)}
                              className="p-2 border border-charcoal-200 rounded-lg hover:bg-charcoal-50 text-left transition-colors"
                            >
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-8 h-8 rounded-full border border-charcoal-300 flex-shrink-0"
                                  style={{ backgroundColor: ball.color || '#374151' }}
                                />
                                <div className="min-w-0">
                                  <div className="font-medium text-sm truncate">{ball.name}</div>
                                  <div className="text-xs text-charcoal-600">{ball.weight}lbs</div>
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
                            onClick={() => addBallToGame(null, true, weight)}
                            className="p-2 border border-charcoal-200 rounded-lg hover:bg-charcoal-50 text-center transition-colors"
                          >
                            <div className="text-lg">🎳</div>
                            <div className="font-medium text-xs">{weight}lb</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-charcoal-500 mt-1">Track which balls you used in this game</p>
          </div>

          {/* Game Date */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">Game Date</label>
            <Input
              type="date"
              value={formData.gameDate}
              onChange={(e) => handleInputChange('gameDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add notes about this game..."
              rows={2}
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:border-vintage-red-500 focus:outline-none resize-none text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Score Summary */}
      {formData.totalScore && (
        <Card className="bg-charcoal-50">
          <CardContent className="p-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-charcoal-600">Summary:</span>
              <div className="flex items-center space-x-3">
                <span className={`font-bold ${getScoreColor()}`}>
                  {formData.totalScore} pts
                </span>
                {formData.strikes && (
                  <span className="text-charcoal-600">{formData.strikes}X</span>
                )}
                {formData.spares && (
                  <span className="text-charcoal-600">{formData.spares}/</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-vintage-red-50 border border-vintage-red-200 rounded-lg p-3">
          <p className="text-vintage-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!formData.totalScore || isSubmitting}
        className="w-full sticky bottom-4 shadow-lg"
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
  );
};

export default FinalScoreEntry;