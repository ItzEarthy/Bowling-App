import { create } from 'zustand';
import BowlingScoreCalculator from '../utils/bowlingScoring';

/**
 * Game store for managing current game state
 */
const useGameStore = create((set, get) => ({
  // State
  currentGame: null,
  currentFrame: 1,
  currentThrow: 1,
  isLoading: false,
  error: null,
  gameComplete: false,

  // Initialize new game
  initializeGame: (gameData = {}) => {
    const frames = BowlingScoreCalculator.createEmptyGame();

    const newGame = {
      id: gameData.id || null,
      user_id: gameData.user_id || null,
      frames,
      total_score: 0,
      is_complete: false,
      created_at: gameData.created_at || new Date().toISOString(),
      ...gameData
    };

    set({ 
      currentGame: newGame, 
      currentFrame: 1,
      currentThrow: 1,
      gameComplete: false,
      error: null 
    });
  },

  // Set current game
  setCurrentGame: (game) => {
    set({ currentGame: game, error: null });
  },

  // Add throw to current frame
  addThrow: (pinsKnockedDown) => {
    const { currentGame, currentFrame, currentThrow } = get();
    if (!currentGame || currentGame.is_complete) return;

    const frameIndex = currentFrame - 1;
    const updatedFrames = [...currentGame.frames];
    const frame = updatedFrames[frameIndex];
    
    // Add throw to frame
    const newThrows = [...(frame.throws || []), pinsKnockedDown];
    frame.throws = newThrows;

    // Check if frame is complete
    const isComplete = BowlingScoreCalculator.isFrameComplete(newThrows, currentFrame);
    
    // Calculate scores for all frames
    const framesWithScores = BowlingScoreCalculator.calculateGameScore(updatedFrames);
    
    // Determine next frame and throw
    let nextFrame = currentFrame;
    let nextThrow = currentThrow + 1;
    let gameComplete = false;

    if (isComplete) {
      if (currentFrame === 10) {
        gameComplete = true;
      } else {
        nextFrame = currentFrame + 1;
        nextThrow = 1;
      }
    } else if (currentFrame < 10 && currentThrow === 2) {
      // Frame should be complete after 2 throws (except 10th frame)
      nextFrame = currentFrame + 1;
      nextThrow = 1;
    }

    // Calculate total score
    const totalScore = framesWithScores[framesWithScores.length - 1]?.cumulative_score || 0;

    set({
      currentGame: {
        ...currentGame,
        frames: framesWithScores,
        total_score: totalScore,
        is_complete: gameComplete
      },
      currentFrame: nextFrame,
      currentThrow: nextThrow,
      gameComplete
    });
  },

  // Update frame in current game
  updateFrame: (frameNumber, throws) => {
    const { currentGame } = get();
    if (!currentGame) return;

    const updatedFrames = currentGame.frames.map(frame => 
      frame.frame_number === frameNumber
        ? { ...frame, throws, is_complete: false }
        : frame
    );

    const framesWithScores = BowlingScoreCalculator.calculateGameScore(updatedFrames);
    const totalScore = framesWithScores[framesWithScores.length - 1]?.cumulative_score || 0;

    set({
      currentGame: {
        ...currentGame,
        frames: framesWithScores,
        total_score: totalScore
      }
    });
  },

  // Set current frame and throw
  setCurrentFrameAndThrow: (frame, throwNum) => {
    set({ currentFrame: frame, currentThrow: throwNum });
  },

  // Get next required throw info
  getNextThrowInfo: () => {
    const { currentGame, currentFrame, currentThrow } = get();
    if (!currentGame) return null;

    const frame = currentGame.frames[currentFrame - 1];
    const previousThrows = frame?.throws || [];
    
    let maxPins = 10;
    if (currentFrame < 10 && currentThrow === 2 && previousThrows.length > 0) {
      maxPins = 10 - previousThrows[0];
    }

    return {
      frameNumber: currentFrame,
      throwNumber: currentThrow,
      previousThrows,
      maxPins
    };
  },

  // Calculate and get game statistics
  getGameStats: () => {
    const { currentGame } = get();
    if (!currentGame) return null;

    let strikes = 0;
    let spares = 0;
    let opens = 0;

    currentGame.frames.forEach(frame => {
      if (frame.throws && frame.throws.length > 0) {
        if (frame.frame_number < 10) {
          if (frame.throws[0] === 10) {
            strikes++;
          } else if ((frame.throws[0] || 0) + (frame.throws[1] || 0) === 10) {
            spares++;
          } else if (frame.throws.length === 2) {
            opens++;
          }
        } else {
          // 10th frame special counting
          if (frame.throws[0] === 10) strikes++;
          if (frame.throws.length >= 2 && frame.throws[0] !== 10 && frame.throws[0] + frame.throws[1] === 10) spares++;
          if (frame.throws.length >= 3 && frame.throws[1] === 10) strikes++;
        }
      }
    });

    return { strikes, spares, opens };
  },

  // Clear current game
  clearCurrentGame: () => {
    set({ 
      currentGame: null, 
      currentFrame: 1,
      currentThrow: 1,
      gameComplete: false,
      error: null 
    });
  },

  // Set loading state
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  // Set error
  setError: (error) => {
    set({ error });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Create game from final score entry
  createGameFromFinalScore: (totalScore, strikes = 0, spares = 0, notes = '') => {
    // Generate reasonable frame distribution based on strikes/spares
    const frames = Array.from({ length: 10 }, (_, index) => {
      const frameNumber = index + 1;
      let frameScore = Math.round(totalScore / 10); // Base distribution
      
      // Adjust frame scores based on strikes/spares if provided
      if (index < strikes) {
        frameScore = Math.min(30, frameScore + 10); // Strike bonus
      } else if (index < strikes + spares) {
        frameScore = Math.min(20, frameScore + 5); // Spare bonus
      }
      
      return {
        frame_number: frameNumber,
        throws: frameNumber < 10 ? [frameScore] : [frameScore],
        cumulative_score: 0, // Will be calculated
        is_complete: true,
        entry_mode: 'final_score'
      };
    });

    // Recalculate to match exact total
    const calculatedFrames = BowlingScoreCalculator.calculateGameScore(frames);
    const calculatedTotal = calculatedFrames[calculatedFrames.length - 1]?.cumulative_score || 0;
    
    // Adjust last frame if needed to match exact total
    if (calculatedTotal !== totalScore) {
      const difference = totalScore - calculatedTotal;
      frames[9].throws[0] = Math.max(0, frames[9].throws[0] + difference);
    }

    const finalFrames = BowlingScoreCalculator.calculateGameScore(frames);

    const newGame = {
      frames: finalFrames,
      total_score: totalScore,
      is_complete: true,
      strikes,
      spares,
      notes,
      entry_mode: 'final_score',
      created_at: new Date().toISOString()
    };

    set({ 
      currentGame: newGame,
      gameComplete: true,
      error: null 
    });

    // Process for streaks and achievements
    get().processCompletedGame(newGame);

    return newGame;
  },

  // Create game from frame scores
  createGameFromFrameScores: (frameScores) => {
    const frames = frameScores.map((score, index) => ({
      frame_number: index + 1,
      throws: [score], // Simplified - just store the frame score
      cumulative_score: 0, // Will be calculated
      is_complete: score > 0,
      entry_mode: 'frame_by_frame'
    }));

    const calculatedFrames = BowlingScoreCalculator.calculateGameScore(frames);
    const totalScore = calculatedFrames[calculatedFrames.length - 1]?.cumulative_score || 0;

    const newGame = {
      frames: calculatedFrames,
      total_score: totalScore,
      is_complete: true,
      entry_mode: 'frame_by_frame',
      created_at: new Date().toISOString()
    };

    set({ 
      currentGame: newGame,
      gameComplete: true,
      error: null 
    });

    // Process for streaks and achievements
    get().processCompletedGame(newGame);

    return newGame;
  },

  // Create game from pin-by-pin data
  createGameFromPinData: (frames) => {
    const calculatedFrames = BowlingScoreCalculator.calculateGameScore(frames);
    const totalScore = calculatedFrames[calculatedFrames.length - 1]?.cumulative_score || 0;

    const newGame = {
      frames: calculatedFrames.map(frame => ({
        ...frame,
        entry_mode: 'pin_by_pin'
      })),
      total_score: totalScore,
      is_complete: true,
      entry_mode: 'pin_by_pin',
      created_at: new Date().toISOString()
    };

    set({ 
      currentGame: newGame,
      gameComplete: true,
      error: null 
    });

    // Process for streaks and achievements
    get().processCompletedGame(newGame);

    return newGame;
  },

  // Process completed game for streaks and achievements
  processCompletedGame: async (gameData) => {
    const game = gameData || get().currentGame;
    if (!game || !game.is_complete) return null;

    try {
      // Calculate game stats
      const stats = get().getGameStats();
      const gameWithStats = {
        ...game,
        strikes: stats.strikes,
        spares: stats.spares,
        opens: stats.opens
      };

      // Process achievements using the achievement handler
      const achievementResult = { newAchievements: [], success: true }; // Achievements removed

      // Return achievement result
      return {
        achievements: achievementResult.newAchievements || [],
        notifications: [],
        achievementSuccess: achievementResult.success
      };
    } catch (error) {
      console.error('Failed to process completed game:', error);
      return null;
    }
  },

  // Convert game data for API submission
  prepareGameForAPI: (gameData) => {
    const { currentGame } = get();
    const game = gameData || currentGame;
    
    if (!game) return null;

    return {
      frames: game.frames.map(frame => ({
        frame_number: frame.frame_number,
        throws_data: JSON.stringify(frame.throws || []),
        cumulative_score: frame.cumulative_score,
        is_complete: frame.is_complete
      })),
      total_score: game.total_score,
      is_complete: game.is_complete,
      entry_mode: game.entry_mode,
      strikes: game.strikes,
      spares: game.spares,
      notes: game.notes,
      created_at: game.created_at
    };
  }
}));

export default useGameStore;