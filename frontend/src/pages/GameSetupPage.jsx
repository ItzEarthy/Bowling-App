import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Play } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { api } from '../lib/api';
import Spinner from '../components/ui/Spinner';
import useGameStore from '../stores/gameStore';
import { clearAllGameEntryStates } from '../utils/gameEntryPersistence';

/**
 * Game Setup Page Component
 * Allows users to select a ball and location before starting a game
 */
const GameSetupPage = () => {
  const navigate = useNavigate();
  const { initializeGame, clearSavedState, clearCurrentGame } = useGameStore();
  const [balls, setBalls] = useState([]);
  const [selectedBall, setSelectedBall] = useState(null);
  const [selectedHouseBallWeight, setSelectedHouseBallWeight] = useState(null);
  const [ballType, setBallType] = useState('personal'); // 'personal' or 'house'
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [error, setError] = useState(null);

  // House ball weights
  const houseBallWeights = [8, 9, 10, 11, 12, 13, 14, 15, 16];

  useEffect(() => {
    loadBalls();
    loadLastUsedBall();
  }, []);

  const loadLastUsedBall = () => {
    try {
      const lastUsed = localStorage.getItem('lastUsedBall');
      if (lastUsed) {
        const lastBallData = JSON.parse(lastUsed);
        if (lastBallData.type === 'house') {
          setBallType('house');
          setSelectedHouseBallWeight(lastBallData.weight);
        } else if (lastBallData.type === 'personal' && lastBallData.ballId) {
          setBallType('personal');
          // Will set selected ball after balls are loaded
          setTimeout(() => {
            const ball = balls.find(b => b.id === lastBallData.ballId);
            if (ball) setSelectedBall(ball);
          }, 100);
        }
      }
    } catch (err) {
      console.log('Could not load last used ball');
    }
  };

  const saveLastUsedBall = (type, ballId = null, weight = null) => {
    try {
      const lastUsedData = {
        type,
        ballId,
        weight,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('lastUsedBall', JSON.stringify(lastUsedData));
    } catch (err) {
      console.log('Could not save last used ball');
    }
  };

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
      
      // Determine ball information based on type
      let ballInfo = {};
      if (ballType === 'house' && selectedHouseBallWeight) {
        ballInfo = {
          ball_type: 'house',
          ball_name: `House Ball (${selectedHouseBallWeight}lbs)`,
          ball_weight: selectedHouseBallWeight
        };
        saveLastUsedBall('house', null, selectedHouseBallWeight);
      } else if (ballType === 'personal' && selectedBall) {
        ballInfo = {
          ball_type: 'personal',
          ball_id: selectedBall.id,
          ball_name: selectedBall.name,
          ball_weight: selectedBall.weight
        };
        saveLastUsedBall('personal', selectedBall.id, selectedBall.weight);
      }
      
      // Create game setup data
      const gameSetup = {
        ...ballInfo,
        location: location.trim() || undefined,
        created_at: new Date().toISOString()
      };
      
      // Navigate to the game entry page with setup data
      // Ensure any previous saved game data is cleared before starting a new one
      try {
        clearSavedState();
      } catch (err) {
        console.warn('Failed to clear saved game state:', err);
      }

      try {
        clearAllGameEntryStates();
      } catch (err) {
        console.warn('Failed to clear entry mode session state:', err);
      }

      try {
        // Clear any in-memory game to avoid race with restore flows
        clearCurrentGame();
      } catch (err) {
        console.warn('Failed to clear in-memory game before initializing new one:', err);
      }

      // Initialize the game in store so it's saved immediately
      try {
        initializeGame({ ...gameSetup });
      } catch (initErr) {
        console.warn('Failed to initialize game in store:', initErr);
      }

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
    // Clear any prior saved state so quick start is fresh
    try { clearSavedState(); } catch (err) { console.warn('Failed to clear saved state for quick start:', err); }
    try { clearAllGameEntryStates(); } catch (err) { console.warn('Failed to clear entry mode session state for quick start:', err); }
    try { clearCurrentGame(); } catch (err) { console.warn('Failed to clear in-memory game for quick start:', err); }

    // Initialize empty game immediately
    try {
      initializeGame({ created_at: gameSetup.created_at });
    } catch (err) {
      console.warn('Quick start initialize failed:', err);
    }

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

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Quick Start Option */}
        <Card className="bg-gradient-to-r from-mint-green-50 to-teal-50 border-2 border-mint-green-200 shadow-sm">
          <CardContent className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-mint-green-100 rounded-full mb-4">
              <Play className="w-8 h-8 text-mint-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-charcoal-900 font-heading mb-2">
              🎳 Quick Start
            </h2>
            <p className="text-charcoal-600 mb-6 max-w-md mx-auto">
              Jump straight into a game without setup - perfect for casual play
            </p>
            <Button 
              onClick={handleQuickStart}
              variant="primary"
              size="lg"
              className="px-8 py-3"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Bowling Now
            </Button>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-charcoal-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-6 text-charcoal-500 font-medium">or customize your game</span>
          </div>
        </div>

        {/* Ball Selection */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <h2 className="text-2xl font-bold text-charcoal-900 font-heading flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-teal-100 rounded-full mr-3">
                🎯
              </span>
              Select Your Bowling Ball
            </h2>
            <p className="text-charcoal-600 mt-2">
              Choose which ball you'll be using for this game
            </p>
          </CardHeader>
          <CardContent>
            {/* Ball Type Selector */}
            <div className="mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setBallType('personal');
                    setSelectedHouseBallWeight(null);
                  }}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    ballType === 'personal'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🎳</div>
                    <div className="font-semibold">Personal Balls</div>
                    <div className="text-sm text-gray-600">From your arsenal</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setBallType('house');
                    setSelectedBall(null);
                  }}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    ballType === 'house'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏠</div>
                    <div className="font-semibold">House Balls</div>
                    <div className="text-sm text-gray-600">Alley-provided balls</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Personal Balls Selection */}
            {ballType === 'personal' && (
              <div>
                {balls.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                      <span className="text-gray-500 text-2xl">🎳</span>
                    </div>
                    <h3 className="text-lg font-semibold text-charcoal-900 mb-2">No Balls in Arsenal</h3>
                    <p className="text-charcoal-600 mb-6 max-w-md mx-auto">
                      You don't have any bowling balls in your arsenal yet. Add some to track performance!
                    </p>
                    <div className="space-y-3">
                      <Button 
                        variant="primary" 
                        onClick={() => navigate('/arsenal')}
                      >
                        Add Your First Ball
                      </Button>
                      <p className="text-charcoal-500 text-sm">
                        Or switch to house balls to continue
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Skip Ball Option */}
                    <div 
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                        selectedBall === null 
                          ? 'border-mint-green-500 bg-mint-green-50 shadow-lg ring-2 ring-mint-green-200' 
                          : 'border-charcoal-300 hover:border-charcoal-400 bg-white hover:shadow-md'
                      }`}
                      onClick={() => setSelectedBall(null)}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-charcoal-200 to-charcoal-300 rounded-full mx-auto mb-4 flex items-center justify-center shadow-inner">
                          <span className="text-charcoal-600 font-bold text-xl">?</span>
                        </div>
                        <h3 className="font-semibold text-charcoal-900 mb-1">No Specific Ball</h3>
                        <p className="text-sm text-charcoal-600">Play without tracking equipment</p>
                        {selectedBall === null && (
                          <div className="mt-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-mint-green-100 text-mint-green-800">
                              ✓ Selected
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ball Options */}
                    {balls.map((ball) => (
                      <div 
                        key={ball.id}
                        className={`p-6 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                          selectedBall?.id === ball.id 
                            ? 'border-mint-green-500 bg-mint-green-50 shadow-lg ring-2 ring-mint-green-200' 
                            : 'border-charcoal-300 hover:border-charcoal-400 bg-white hover:shadow-md'
                        }`}
                        onClick={() => setSelectedBall(ball)}
                      >
                        <div className="text-center">
                          {/* Ball Visual */}
                          <div className="mb-4">
                            {ball.image ? (
                              <img 
                                src={ball.image} 
                                alt={ball.name}
                                className="w-16 h-16 object-cover rounded-full border-2 border-gray-200 mx-auto shadow-md"
                              />
                            ) : (
                              <div 
                                className="w-16 h-16 rounded-full border-2 border-gray-200 mx-auto shadow-inner"
                                style={{ 
                                  backgroundColor: ball.color || '#374151',
                                  background: `radial-gradient(circle at 30% 30%, ${ball.color || '#374151'}, ${ball.color || '#374151'}dd)`
                                }}
                              ></div>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-charcoal-900 mb-1 truncate">{ball.name}</h3>
                          <p className="text-sm text-charcoal-600 mb-1">
                            {ball.brand && `${ball.brand} • `}{ball.weight}lbs
                          </p>
                          
                          {/* Additional ball specs */}
                          {(ball.coverstock || ball.hook_potential) && (
                            <p className="text-xs text-charcoal-500 mb-2">
                              {ball.coverstock && ball.hook_potential 
                                ? `${ball.coverstock} • ${ball.hook_potential} Hook`
                                : ball.coverstock || `${ball.hook_potential} Hook`
                              }
                            </p>
                          )}
                          
                          {selectedBall?.id === ball.id && (
                            <div className="mt-3">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-mint-green-100 text-mint-green-800">
                                ✓ Selected
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* House Ball Weight Selection */}
            {ballType === 'house' && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Select House Ball Weight
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
                    {houseBallWeights.map((weight) => (
                      <button
                        key={weight}
                        onClick={() => setSelectedHouseBallWeight(weight)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedHouseBallWeight === weight
                            ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">🎳</div>
                          <div className="font-bold text-lg">{weight}</div>
                          <div className="text-xs text-gray-600">lbs</div>
                          {selectedHouseBallWeight === weight && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                ✓
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {selectedHouseBallWeight && (
                  <div className="mt-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                        🎳
                      </div>
                      <div>
                        <div className="font-semibold text-teal-900">
                          House Ball Selected
                        </div>
                        <div className="text-teal-700">
                          {selectedHouseBallWeight} pounds
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Input */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <h2 className="text-2xl font-bold text-charcoal-900 font-heading flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mr-3">
                📍
              </span>
              Bowling Location
            </h2>
            <p className="text-charcoal-600 mt-2">
              Where are you bowling today? (Optional)
            </p>
          </CardHeader>
          <CardContent>
            <Input
              label=""
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Sunset Lanes, Strike Zone, Lucky Strike"
              className="text-lg"
            />
            <p className="text-sm text-charcoal-500 mt-2">
              💡 Adding a location helps track your performance at different venues
            </p>
          </CardContent>
        </Card>

        {/* Game Summary */}
        <Card className="bg-gradient-to-r from-cream-50 to-yellow-50 border-2 border-cream-200 shadow-sm">
          <CardHeader className="pb-4">
            <h2 className="text-2xl font-bold text-charcoal-900 font-heading flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mr-3">
                📋
              </span>
              Game Summary
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    🎳
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-600 font-medium">Ball</p>
                    <p className="font-semibold text-charcoal-900">
                      {ballType === 'house' && selectedHouseBallWeight 
                        ? `House Ball (${selectedHouseBallWeight}lbs)`
                        : ballType === 'personal' && selectedBall 
                        ? `${selectedBall.name} (${selectedBall.weight}lbs)`
                        : 'Not selected'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    📍
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-600 font-medium">Location</p>
                    <p className="font-semibold text-charcoal-900">
                      {location || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    📅
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-600 font-medium">Date</p>
                    <p className="font-semibold text-charcoal-900">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Game Buttons */}
        <div className="text-center space-y-6 pb-8">
          <Button 
            onClick={handleStartGame}
            variant="primary"
            size="lg"
            isLoading={isCreatingGame}
            disabled={isCreatingGame || (ballType === 'house' && !selectedHouseBallWeight) || (ballType === 'personal' && !selectedBall)}
            className="px-12 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            <Play className="w-6 h-6 mr-3" />
            {isCreatingGame ? 'Starting Game...' : 'Continue to Game Entry'}
          </Button>
          
          {/* Show help text when ball not selected */}
          {((ballType === 'house' && !selectedHouseBallWeight) || (ballType === 'personal' && !selectedBall)) && (
            <p className="text-sm text-orange-600">
              Please select a ball to continue
            </p>
          )}
          
          <div>
            <Button 
              variant="outline" 
              onClick={handleQuickStart}
              disabled={isCreatingGame}
              className="text-sm px-6 py-2"
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