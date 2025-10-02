import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import BowlingScorecard from '../components/features/BowlingScorecard';
import PinSelectionModal from '../components/features/PinSelectionModal';
import useGameStore from '../stores/gameStore';
import { api } from '../lib/api';

/**
 * Game Page Component - Complete bowling game interface
 */
const GamePage = () => {
  const navigate = useNavigate();
  const {
    currentGame,
    currentFrame,
    currentThrow,
    gameComplete,
    isLoading,
    error,
    initializeGame,
    addThrow,
    getNextThrowInfo,
    getGameStats,
    clearCurrentGame,
    setLoading,
    setError
  } = useGameStore();

  const [showPinModal, setShowPinModal] = useState(false);
  const [showGameCompleteModal, setShowGameCompleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize game on component mount
  useEffect(() => {
    if (!currentGame) {
      initializeGame();
    }
  }, [currentGame, initializeGame]);

  // Show game complete modal when game finishes
  useEffect(() => {
    if (gameComplete && currentGame && !showGameCompleteModal) {
      setShowGameCompleteModal(true);
    }
  }, [gameComplete, currentGame, showGameCompleteModal]);

  const handleFrameClick = (frameNumber) => {
    if (gameComplete) return;
    
    // Only allow clicking on current frame
    if (frameNumber === currentFrame) {
      setShowPinModal(true);
    }
  };

  const handlePinSelection = (pinsKnockedDown) => {
    addThrow(pinsKnockedDown);
    setShowPinModal(false);
  };

  const handleNewGame = () => {
    clearCurrentGame();
    initializeGame();
    setShowGameCompleteModal(false);
  };

  const handleSaveGame = async () => {
    if (!currentGame || !gameComplete) return;

    setIsSaving(true);
    try {
      const gameData = {
        frames: currentGame.frames.map(frame => ({
          frame_number: frame.frame_number,
          throws_data: JSON.stringify(frame.throws || []),
          cumulative_score: frame.cumulative_score
        })),
        total_score: currentGame.total_score,
        is_complete: true
      };

      const response = await api.post('/games', gameData);
      
      // Navigate to game log or dashboard after saving
      navigate('/app/dashboard');
    } catch (err) {
      setError('Failed to save game: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const nextThrowInfo = getNextThrowInfo();
  const gameStats = getGameStats();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Bowling Game" subtitle="Loading..." />
        <Card>
          <CardContent>
            <div className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-vintage-red-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-charcoal-600">Loading game...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Bowling Game" subtitle="Error" />
        <Card>
          <CardContent>
            <div className="text-center py-20">
              <div className="text-vintage-red-500 text-xl mb-4">⚠️ Error</div>
              <p className="text-charcoal-600 mb-6">{error}</p>
              <Button onClick={() => setError(null)}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Bowling Game"
        subtitle={gameComplete ? "Game Complete!" : `Frame ${currentFrame} - Throw ${currentThrow}`}
      />
      
      {/* Main Scorecard */}
      <BowlingScorecard
        frames={currentGame?.frames || []}
        currentFrame={currentFrame}
        onFrameClick={handleFrameClick}
        totalScore={currentGame?.total_score || 0}
        gameComplete={gameComplete}
        entryMode={currentGame?.entry_mode || 'pin_by_pin'}
        strikes={currentGame?.strikes}
        spares={currentGame?.spares}
      />

      {/* Game Controls */}
      <Card>
        <CardContent>
          <div className="space-y-4">
            {/* Current Throw Info */}
            {!gameComplete && nextThrowInfo && (
              <div className="bg-charcoal-50 p-4 rounded-lg">
                <h3 className="font-bold text-charcoal-900 mb-2">
                  Frame {nextThrowInfo.frameNumber} - Throw {nextThrowInfo.throwNumber}
                </h3>
                <div className="flex justify-between items-center">
                  <div className="text-charcoal-600">
                    {nextThrowInfo.previousThrows.length > 0 && (
                      <span>
                        Previous: {nextThrowInfo.previousThrows.join(', ')} pins
                      </span>
                    )}
                  </div>
                  <Button 
                    onClick={() => setShowPinModal(true)}
                    variant="primary"
                    size="lg"
                  >
                    🎳 Roll Ball
                  </Button>
                </div>
              </div>
            )}

            {/* Game Statistics */}
            {gameStats && (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-vintage-red-50 rounded-lg">
                  <div className="text-sm text-charcoal-600">Strikes</div>
                  <div className="text-2xl font-bold text-vintage-red-600">
                    {gameStats.strikes}
                  </div>
                </div>
                <div className="text-center p-3 bg-mustard-yellow-50 rounded-lg">
                  <div className="text-sm text-charcoal-600">Spares</div>
                  <div className="text-2xl font-bold text-mustard-yellow-600">
                    {gameStats.spares}
                  </div>
                </div>
                <div className="text-center p-3 bg-charcoal-50 rounded-lg">
                  <div className="text-sm text-charcoal-600">Opens</div>
                  <div className="text-2xl font-bold text-charcoal-600">
                    {gameStats.opens}
                  </div>
                </div>
                <div className="text-center p-3 bg-mint-green-50 rounded-lg">
                  <div className="text-sm text-charcoal-600">Average</div>
                  <div className="text-2xl font-bold text-mint-green-600">
                    {currentGame?.total_score ? Math.round(currentGame.total_score / 10) : 0}
                  </div>
                </div>
              </div>
            )}

            {/* Game Actions */}
            <div className="flex space-x-3">
              <Button 
                variant="secondary" 
                onClick={handleGoHome}
                className="flex-1"
              >
                🏠 Home
              </Button>
              <Button 
                variant="outline" 
                onClick={handleNewGame}
                className="flex-1"
              >
                🔄 New Game
              </Button>
              {gameComplete && (
                <Button 
                  variant="primary" 
                  onClick={handleSaveGame}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : '💾 Save Game'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pin Selection Modal */}
      {nextThrowInfo && (
        <PinSelectionModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onConfirm={handlePinSelection}
          frameNumber={nextThrowInfo.frameNumber}
          throwNumber={nextThrowInfo.throwNumber}
          previousThrows={nextThrowInfo.previousThrows}
          maxPins={nextThrowInfo.maxPins}
        />
      )}

      {/* Game Complete Modal */}
      <Modal 
        isOpen={showGameCompleteModal} 
        onClose={() => setShowGameCompleteModal(false)}
        title="🎉 Game Complete!"
      >
        <div className="text-center space-y-6">
          <div className="text-6xl font-bold text-vintage-red-600">
            {currentGame?.total_score || 0}
          </div>
          <div className="text-xl text-charcoal-700">
            Final Score
          </div>
          
          {gameStats && (
            <div className="grid grid-cols-3 gap-4 my-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-vintage-red-600">{gameStats.strikes}</div>
                <div className="text-sm text-charcoal-600">Strikes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-mustard-yellow-600">{gameStats.spares}</div>
                <div className="text-sm text-charcoal-600">Spares</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-charcoal-600">{gameStats.opens}</div>
                <div className="text-sm text-charcoal-600">Opens</div>
              </div>
            </div>
          )}

          {/* Performance Message */}
          <div className="text-charcoal-600">
            {currentGame?.total_score >= 200 && "🔥 Amazing game!"}
            {currentGame?.total_score >= 150 && currentGame?.total_score < 200 && "👏 Great bowling!"}
            {currentGame?.total_score >= 100 && currentGame?.total_score < 150 && "👍 Good game!"}
            {currentGame?.total_score < 100 && "Keep practicing!"}
          </div>

          <div className="flex space-x-3">
            <Button 
              variant="secondary" 
              onClick={handleNewGame}
              className="flex-1"
            >
              🔄 New Game
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveGame}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : '💾 Save & Continue'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GamePage;