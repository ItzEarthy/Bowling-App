import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Play } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { api } from '../lib/api';
import Spinner from '../components/ui/Spinner';
import useGameStore from '../stores/gameStore';

/**
 * Game Setup Page Component
 * Allows users to select a ball and location before starting a game
 */
const GameSetupPage = () => {
  const navigate = useNavigate();
  const { initializeGame } = useGameStore();
  const [balls, setBalls] = useState([]);
  const [selectedBall, setSelectedBall] = useState(null);
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBalls();
  }, []);

  const loadBalls = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/balls');
      setBalls(response.data.balls || []);
    } catch (err) {
      console.log('Could not load balls - continuing without them');
      setBalls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async () => {
    try {
      setIsCreatingGame(true);
      
      // Create game setup data
      const gameSetup = {
        ball_id: selectedBall?.id,
        ball_name: selectedBall?.name,
        location: location.trim() || undefined,
        created_at: new Date().toISOString()
      };
      
      // Navigate to the game entry page with setup data
      navigate('/game-entry', { 
        state: { gameSetup } 
      });
    } catch (err) {
      setError('Failed to start game setup');
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleQuickStart = () => {
    // Quick start with minimal setup
    const gameSetup = {
      created_at: new Date().toISOString()
    };
    
    navigate('/game-entry', { 
      state: { gameSetup } 
    });
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Game Setup" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Game Setup"
        subtitle="Choose your equipment and location"
        action={
          <Button variant="ghost" onClick={handleBack}>
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>
        }
      />

      {error && (
        <div className="bg-vintage-red-50 border border-vintage-red-200 rounded-xl p-4 mb-6">
          <p className="text-vintage-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Quick Start Option */}
        <Card className="bg-mint-green-50 border-2 border-mint-green-200">
          <CardContent>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-charcoal-900 font-heading mb-2">
                🎳 Quick Start
              </h2>
              <p className="text-charcoal-600 mb-4">
                Jump straight into a game without setup
              </p>
              <Button 
                onClick={handleQuickStart}
                variant="primary"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Bowling Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="text-center">
          <span className="text-charcoal-400 bg-white px-4">or customize your game</span>
        </div>

        {/* Ball Selection */}
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-charcoal-900 font-heading mb-4">
              Select Your Bowling Ball
            </h2>
            
            {balls.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-charcoal-600 mb-4">
                  You don't have any bowling balls in your arsenal yet.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/arsenal')}
                >
                  Add Your First Ball
                </Button>
                <p className="text-charcoal-500 text-sm mt-2">
                  Or skip and play without selecting a specific ball
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Skip Ball Option */}
                <div 
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedBall === null 
                      ? 'border-mint-green-500 bg-mint-green-50' 
                      : 'border-charcoal-300 hover:border-charcoal-400'
                  }`}
                  onClick={() => setSelectedBall(null)}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-charcoal-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-charcoal-600 font-bold">?</span>
                    </div>
                    <h3 className="font-medium text-charcoal-900">No specific ball</h3>
                    <p className="text-sm text-charcoal-600">Play without tracking equipment</p>
                  </div>
                </div>

                {/* Ball Options */}
                {balls.map((ball) => (
                  <div 
                    key={ball.id}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedBall?.id === ball.id 
                        ? 'border-mint-green-500 bg-mint-green-50' 
                        : 'border-charcoal-300 hover:border-charcoal-400'
                    }`}
                    onClick={() => setSelectedBall(ball)}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-charcoal-600 to-charcoal-800 rounded-full mx-auto mb-3"></div>
                      <h3 className="font-medium text-charcoal-900">{ball.name}</h3>
                      <p className="text-sm text-charcoal-600">{ball.brand} • {ball.weight}lbs</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Input */}
        <Card>
          <CardContent>
            <Input
              label="Location (Optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Sunset Lanes, Strike Zone"
              helperText="Where are you bowling today?"
            />
          </CardContent>
        </Card>

        {/* Game Summary */}
        <Card className="bg-cream-50 border-2 border-cream-200">
          <CardContent>
            <h2 className="text-xl font-semibold text-charcoal-900 font-heading mb-4">
              Game Summary
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-charcoal-600">Ball:</span>
                <span className="font-medium text-charcoal-900">
                  {selectedBall ? `${selectedBall.name} (${selectedBall.weight}lbs)` : 'Not selected'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-charcoal-600">Location:</span>
                <span className="font-medium text-charcoal-900">
                  {location || 'Not specified'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-charcoal-600">Date:</span>
                <span className="font-medium text-charcoal-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Game Buttons */}
        <div className="text-center space-y-4">
          <Button 
            onClick={handleStartGame}
            variant="primary"
            size="lg"
            isLoading={isCreatingGame}
            disabled={isCreatingGame}
            className="w-full md:w-auto"
          >
            <Play className="w-5 h-5 mr-2" />
            {isCreatingGame ? 'Starting Game...' : 'Continue to Game Entry'}
          </Button>
          
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={handleQuickStart}
              disabled={isCreatingGame}
              className="text-sm"
            >
              Quick Start (Skip Setup)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSetupPage;