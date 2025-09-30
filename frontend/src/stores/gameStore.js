import { create } from 'zustand';

/**
 * Bowling Score Calculation Helper
 */
class BowlingScoreCalculator {
  static calculateFrameScore(frames, frameIndex) {
    const frame = frames[frameIndex];
    const throws = frame.throws || [];
    
    if (frame.frame_number < 10) {
      return this.calculateRegularFrameScore(throws, frames, frameIndex);
    } else {
      return this.calculateTenthFrameScore(throws);
    }
  }

  static calculateRegularFrameScore(throws, allFrames, frameIndex) {
    const frameSum = throws.reduce((sum, pins) => sum + pins, 0);

    // Strike (10 pins on first throw)
    if (throws[0] === 10) {
      return 10 + this.getStrikeBonus(allFrames, frameIndex);
    }

    // Spare (10 pins total in two throws)
    if (frameSum === 10 && throws.length === 2) {
      return 10 + this.getSpareBonus(allFrames, frameIndex);
    }

    // Open frame (less than 10 pins)
    return frameSum;
  }

  static calculateTenthFrameScore(throws) {
    return throws.reduce((sum, pins) => sum + pins, 0);
  }

  static getStrikeBonus(allFrames, strikeFrameIndex) {
    const nextFrame = allFrames[strikeFrameIndex + 1];
    if (!nextFrame || !nextFrame.throws) return 0;

    const nextThrows = nextFrame.throws;

    // If next frame is also a strike, need to look at frame after that
    if (nextThrows[0] === 10 && nextFrame.frame_number < 10) {
      const frameAfterNext = allFrames[strikeFrameIndex + 2];
      if (!frameAfterNext || !frameAfterNext.throws) return 10;
      
      const frameAfterThrows = frameAfterNext.throws;
      return 10 + (frameAfterThrows[0] || 0);
    }

    // Return next two throws
    return (nextThrows[0] || 0) + (nextThrows[1] || 0);
  }

  static getSpareBonus(allFrames, spareFrameIndex) {
    const nextFrame = allFrames[spareFrameIndex + 1];
    if (!nextFrame || !nextFrame.throws) return 0;

    return nextFrame.throws[0] || 0;
  }

  static isFrameComplete(throws, frameNumber) {
    if (frameNumber < 10) {
      // Strike or two throws
      return throws[0] === 10 || throws.length === 2;
    } else {
      // 10th frame rules
      if (throws.length < 2) return false;
      
      const [first, second] = throws;
      
      // Strike or spare requires 3 throws
      if (first === 10 || first + second === 10) {
        return throws.length === 3;
      }
      
      // Otherwise, 2 throws is complete
      return throws.length === 2;
    }
  }

  static calculateGameScore(frames) {
    let cumulativeScore = 0;
    const updatedFrames = frames.map((frame, index) => {
      const frameScore = this.calculateFrameScore(frames, index);
      cumulativeScore += frameScore;
      
      return {
        ...frame,
        cumulative_score: cumulativeScore,
        is_complete: this.isFrameComplete(frame.throws || [], frame.frame_number)
      };
    });

    return updatedFrames;
  }
}

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
    const frames = Array.from({ length: 10 }, (_, index) => ({
      frame_number: index + 1,
      throws: [],
      cumulative_score: null,
      is_complete: false
    }));

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
  }
}));

export default useGameStore;