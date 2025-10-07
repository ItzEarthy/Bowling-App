import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import DataEntryModeSelector, { DATA_ENTRY_MODES } from '../components/features/DataEntryModeSelector';
import FinalScoreEntry from '../components/features/FinalScoreEntry';
import FrameByFrameEntry from '../components/features/FrameByFrameEntry';
import PinByPinEntry from '../components/features/PinByPinEntry';
import useGameStore from '../stores/gameStore';
import { api } from '../lib/api';
import { getLocalISOString } from '../utils/dateUtils';

/**
 * Game Entry Page - Unified interface for all data entry methods
 */
const GameEntryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get game setup data from navigation state
  const gameSetup = location.state?.gameSetup || {};
  
  const [selectedMode, setSelectedMode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentGame, initializeGame } = useGameStore();

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setError(null);
  };

  const handleBackToModeSelection = () => {
    setSelectedMode(null);
    setError(null);
  };

  const handleBackToSetup = () => {
    navigate('/game-setup');
  };

  // Ensure a started game from setup is initialized in the store (auto-saved)
  React.useEffect(() => {
    if (!currentGame && gameSetup && Object.keys(gameSetup).length > 0) {
      try {
        initializeGame({ ...gameSetup });
      } catch (err) {
        console.warn('Failed to initialize game from GameEntryPage:', err);
      }
    }
  }, [currentGame, gameSetup, initializeGame]);

  const handleGameComplete = async (gameData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare complete game data including setup info
      const completeGameData = {
        ...gameData,
        ...gameSetup, // Include ball_id, location, etc from setup
        created_at: gameData.created_at || getLocalISOString(),
        is_complete: true
      };

      // Save to backend
      const response = await api.post('/games', completeGameData);
      const savedGame = response.data.game;
      
      // Navigate to success page or dashboard
      navigate('/dashboard', {
        state: {
          message: 'Game saved successfully!',
          gameId: savedGame?.id
        }
      });
    } catch (err) {
      setError('Failed to save game: ' + (err.response?.data?.message || err.message));
      setIsLoading(false);
    }
  };

  const renderEntryComponent = () => {
    const commonProps = {
      onGameComplete: handleGameComplete,
      initialData: {}
    };

    switch (selectedMode) {
      case DATA_ENTRY_MODES.FINAL_SCORE:
        return <FinalScoreEntry {...commonProps} />;
      
      case DATA_ENTRY_MODES.FRAME_BY_FRAME:
        return <FrameByFrameEntry {...commonProps} />;
      
      case DATA_ENTRY_MODES.PIN_BY_PIN:
        return <PinByPinEntry {...commonProps} />;
      
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    if (!selectedMode) return 'Choose Entry Method';
    
    switch (selectedMode) {
      case DATA_ENTRY_MODES.FINAL_SCORE:
        return 'Final Score Entry';
      case DATA_ENTRY_MODES.FRAME_BY_FRAME:
        return 'Frame by Frame Entry';
      case DATA_ENTRY_MODES.PIN_BY_PIN:
        return 'Pin by Pin Entry';
      default:
        return 'Game Entry';
    }
  };

  const getBackAction = () => {
    if (!selectedMode) {
      return (
        <Button variant="ghost" onClick={handleBackToSetup}>
          <ChevronLeft className="w-5 h-5 mr-1" />
          Setup
        </Button>
      );
    }
    
    return (
      <Button variant="ghost" onClick={handleBackToModeSelection}>
        <RotateCcw className="w-5 h-5 mr-1" />
        Change Method
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-charcoal-50">
      <PageHeader 
        title={getPageTitle()}
        subtitle={selectedMode ? 'Enter your bowling game data' : 'Select how you want to enter your game'}
        action={getBackAction()}
      />

      <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6">
        {/* Game Setup Info */}
        {(gameSetup.ball_name || gameSetup.location) && (
          <div className="mb-4 bg-white rounded-xl p-3 border border-charcoal-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-charcoal-800 text-sm flex items-center">
                <div className="w-2 h-2 bg-mint-green-500 rounded-full mr-2"></div>
                Game Setup
              </h3>
              <div className="text-xs text-charcoal-500">{new Date().toLocaleDateString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {gameSetup.ball_name && (
                <div className="bg-charcoal-50 rounded-lg p-2 text-xs truncate">
                  <span className="font-medium text-charcoal-500 block">Ball</span>
                  <span className="text-charcoal-800">{gameSetup.ball_name}</span>
                </div>
              )}
              {gameSetup.location && (
                <div className="bg-charcoal-50 rounded-lg p-2 text-xs truncate">
                  <span className="font-medium text-charcoal-500 block">Location</span>
                  <span className="text-charcoal-800">{gameSetup.location}</span>
                </div>
              )}
              <div className="bg-charcoal-50 rounded-lg p-2 text-xs">
                <span className="font-medium text-charcoal-500 block">Time</span>
                <span className="text-charcoal-800">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="bg-charcoal-50 rounded-lg p-2 text-xs">
                <span className="font-medium text-charcoal-500 block">Frames</span>
                <span className="text-charcoal-800">10</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-vintage-red-50 border border-vintage-red-200 rounded-xl p-4">
            <h4 className="font-medium text-vintage-red-800 mb-2">Error</h4>
            <p className="text-vintage-red-700 text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setError(null)}
              className="mt-3"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 bg-mint-green-50 border border-mint-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-mint-green-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-mint-green-800 font-medium">Saving your game...</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-4">
          {!selectedMode ? (
            /* Mode Selection */
            <DataEntryModeSelector 
              selectedMode={selectedMode}
              onModeSelect={handleModeSelect}
            />
          ) : (
            /* Selected Entry Component */
            <div className="space-y-4">
              {/* Mode indicator */}
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-vintage-red-100 to-vintage-red-50 border border-vintage-red-200 rounded-lg shadow-sm text-xs">
                  <div className="w-2 h-2 bg-vintage-red-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs font-semibold text-vintage-red-800">
                    Using: {selectedMode === DATA_ENTRY_MODES.FINAL_SCORE && 'Final Score Entry'}
                    {selectedMode === DATA_ENTRY_MODES.FRAME_BY_FRAME && 'Frame by Frame Entry'}
                    {selectedMode === DATA_ENTRY_MODES.PIN_BY_PIN && 'Pin by Pin Entry'}
                  </span>
                </div>
              </div>

              {/* Entry Component */}
              <div className="bg-white rounded-lg p-3 border border-charcoal-100 shadow-sm">
                {renderEntryComponent()}
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        {!selectedMode && (
          <div className="mt-12 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-medium text-charcoal-800 mb-3">
                Choose Your Preferred Method
              </h3>
              <p className="text-charcoal-600 text-sm leading-relaxed">
                Each entry method offers different levels of detail and is suited for different situations. 
                You can always change your preferred method for future games.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameEntryPage;