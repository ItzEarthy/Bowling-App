import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import useGameStore from '../../stores/gameStore';
import useAuthStore from '../../stores/authStore';

/**
 * Game Restoration Modal Component
 * Shows when a saved game is detected and offers to restore it
 */
const GameRestorationModal = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [savedGameInfo, setSavedGameInfo] = useState(null);
  
  const { 
    isAuthenticated 
  } = useAuthStore();
  
  const { 
    currentGame,
    hasSavedGame,
    getSavedGameInfo,
    loadGameState,
    clearSavedState
  } = useGameStore();

  // Check for saved game when component mounts or auth state changes
  useEffect(() => {
    if (isAuthenticated && !currentGame) {
      checkForSavedGame();
    }
  }, [isAuthenticated, currentGame]);

  const checkForSavedGame = () => {
    if (hasSavedGame()) {
      const info = getSavedGameInfo();
      if (info && !info.gameComplete) {
        setSavedGameInfo(info);
        setIsOpen(true);
      }
    }
  };

  const handleRestore = () => {
    loadGameState();
    setIsOpen(false);
    navigate('/game');
  };

  const handleDiscard = () => {
    clearSavedState();
    setIsOpen(false);
  };

  const formatTimeSince = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!savedGameInfo) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)}
      title="🎳 Unfinished Game Found"
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Game Info Display */}
        <div className="bg-charcoal-50 rounded-lg p-4">
          <div className="text-center space-y-3">
            <div className="text-sm text-charcoal-500">
              Last saved: {formatTimestamp(savedGameInfo.timestamp)}
            </div>
            <div className="text-lg text-charcoal-600">
              {formatTimeSince(savedGameInfo.timeSince)}
            </div>
            
            {/* Game Progress */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-vintage-red-600">
                  Frame {savedGameInfo.frame}
                </div>
                <div className="text-xs text-charcoal-500">Current Frame</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-mint-green-600">
                  {savedGameInfo.score}
                </div>
                <div className="text-xs text-charcoal-500">Current Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="text-center">
          <p className="text-charcoal-600 leading-relaxed">
            You have an unfinished bowling game. Your progress was automatically saved when you left the app.
          </p>
          <p className="text-charcoal-500 text-sm mt-2">
            Would you like to continue where you left off?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleDiscard}
            className="flex-1"
          >
            🗑️ Start Fresh
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRestore}
            className="flex-1"
          >
            ▶️ Continue Game
          </Button>
        </div>

        {/* Warning for Start Fresh */}
        <div className="text-xs text-charcoal-400 text-center">
          Starting fresh will permanently delete your saved progress
        </div>
      </div>
    </Modal>
  );
};

export default GameRestorationModal;