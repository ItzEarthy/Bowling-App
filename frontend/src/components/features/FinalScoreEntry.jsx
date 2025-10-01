import React, { useState, useEffect } from 'react';
import { Trophy, Target, Zap, Save, Plus, X } from 'lucide-react';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { ballAPI } from '../../lib/api';

/**
 * Final Score Entry Component
 * Allows users to enter just the total score with optional strikes/spares
 */
const FinalScoreEntry = ({ onGameComplete, initialData = {} }) => {
  const [formData, setFormData] = useState({
    totalScore: initialData.totalScore || '',
    strikes: initialData.strikes || '',
    spares: initialData.spares || '',
    notes: initialData.notes || '',
    gameDate: initialData.gameDate || new Date().toISOString().split('T')[0],
    ballsUsed: initialData.ballsUsed || [] // Array of ball objects used in the game
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableBalls, setAvailableBalls] = useState([]);
  const [houseBallWeights] = useState([8, 9, 10, 11, 12, 13, 14, 15, 16]);
  const [showBallSelector, setShowBallSelector] = useState(false);

  useEffect(() => {
    loadAvailableBalls();
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

    setIsSubmitting(true);
    try {
      const gameData = {
        entryMode: 'final_score',
        totalScore: parseInt(formData.totalScore),
        strikes: formData.strikes ? parseInt(formData.strikes) : undefined,
        spares: formData.spares ? parseInt(formData.spares) : undefined,
        notes: formData.notes || undefined,
        ballsUsed: formData.ballsUsed.length > 0 ? formData.ballsUsed : undefined,
        created_at: new Date(formData.gameDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString()
      };

      await onGameComplete(gameData);
    } catch (error) {
      setErrors({ submit: 'Failed to save game. Please try again.' });
    } finally {
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-charcoal-800 mb-2">Final Score Entry</h2>
        <p className="text-charcoal-600">Enter your total game score with optional details</p>
      </div>

      {/* Main Entry Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Total Score - Large Input */}
          <div className="text-center">
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Total Score
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="300"
                value={formData.totalScore}
                onChange={(e) => handleInputChange('totalScore', e.target.value)}
                className={`w-full text-4xl font-bold text-center py-4 px-6 border-2 rounded-xl
                  ${errors.totalScore 
                    ? 'border-vintage-red-300 bg-vintage-red-50' 
                    : 'border-charcoal-200 focus:border-vintage-red-500'
                  } ${getScoreColor()} focus:outline-none focus:ring-0 transition-colors`}
                placeholder="0"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Trophy className={`w-6 h-6 ${getScoreColor()}`} />
              </div>
            </div>
            {errors.totalScore && (
              <p className="text-vintage-red-600 text-sm mt-2">{errors.totalScore}</p>
            )}
            <p className="text-xs text-charcoal-500 mt-2">Enter a score between 0 and 300</p>
          </div>

          {/* Optional Details */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Strikes */}
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                Strikes (Optional)
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
              <p className="text-xs text-charcoal-500 mt-1">0-12 strikes</p>
            </div>

            {/* Spares */}
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                <Zap className="w-4 h-4 inline mr-1" />
                Spares (Optional)
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
              <p className="text-xs text-charcoal-500 mt-1">0-10 spares</p>
            </div>
          </div>

          {/* Balls Used */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Balls Used (Optional)
            </label>
            
            {/* Current balls */}
            {formData.ballsUsed.length > 0 && (
              <div className="mb-3 space-y-2">
                {formData.ballsUsed.map((ball) => (
                  <div 
                    key={ball.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-gray-200"
                        style={{ 
                          backgroundColor: ball.color || (ball.type === 'house' ? '#6B7280' : '#374151')
                        }}
                      ></div>
                      <div>
                        <div className="font-medium text-sm">{ball.name}</div>
                        <div className="text-xs text-gray-600">
                          {ball.weight}lbs • {ball.type === 'house' ? 'House Ball' : 'Personal'}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBallFromGame(ball.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add ball button */}
            <Button
              variant="outline"
              onClick={() => setShowBallSelector(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Ball
            </Button>

            {/* Ball Selector Modal */}
            {showBallSelector && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Select Ball</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBallSelector(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Personal Balls */}
                  {availableBalls.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Personal Balls</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {availableBalls.map((ball) => (
                          <button
                            key={ball.id}
                            onClick={() => addBallToGame(ball)}
                            className="p-3 border rounded-lg hover:bg-gray-50 text-left"
                          >
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-8 h-8 rounded-full border-2 border-gray-200"
                                style={{ 
                                  backgroundColor: ball.color || '#374151'
                                }}
                              ></div>
                              <div>
                                <div className="font-medium text-sm">{ball.name}</div>
                                <div className="text-xs text-gray-600">{ball.weight}lbs</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* House Balls */}
                  <div>
                    <h4 className="font-medium mb-3">House Balls</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {houseBallWeights.map((weight) => (
                        <button
                          key={weight}
                          onClick={() => addBallToGame(null, true, weight)}
                          className="p-3 border rounded-lg hover:bg-gray-50 text-center"
                        >
                          <div className="text-lg mb-1">🎳</div>
                          <div className="font-medium text-sm">{weight}lbs</div>
                          <div className="text-xs text-gray-600">House</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-charcoal-500 mt-1">Track which balls you used in this game</p>
          </div>

          {/* Game Date */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Game Date
            </label>
            <Input
              type="date"
              value={formData.gameDate}
              onChange={(e) => handleInputChange('gameDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Don't allow future dates
              className="text-center"
            />
            <p className="text-xs text-charcoal-500 mt-1">When was this game played?</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any notes about this game..."
              rows={3}
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:border-vintage-red-500 focus:outline-none focus:ring-0 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Score Summary */}
      {formData.totalScore && (
        <Card className="bg-charcoal-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-charcoal-600">Game Summary:</span>
              <div className="flex space-x-4">
                <span className={`font-bold ${getScoreColor()}`}>
                  {formData.totalScore} points
                </span>
                {formData.strikes && (
                  <span className="text-charcoal-600">
                    {formData.strikes} strikes
                  </span>
                )}
                {formData.spares && (
                  <span className="text-charcoal-600">
                    {formData.spares} spares
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-vintage-red-50 border border-vintage-red-200 rounded-xl p-4">
          <p className="text-vintage-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!formData.totalScore || isSubmitting}
        className="w-full py-3"
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
  );
};

export default FinalScoreEntry;