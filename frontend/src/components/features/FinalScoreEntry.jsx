import React, { useState } from 'react';
import { Trophy, Target, Zap, Save } from 'lucide-react';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

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
    gameDate: initialData.gameDate || new Date().toISOString().split('T')[0] // Default to today
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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