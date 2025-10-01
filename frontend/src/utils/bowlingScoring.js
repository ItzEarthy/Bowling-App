/**
 * Centralized Bowling Score Calculation Utility
 * Handles all bowling scoring logic across the application
 */

export class BowlingScoreCalculator {
  /**
   * Calculate the score for a specific frame
   */
  static calculateFrameScore(frames, frameIndex) {
    const frame = frames[frameIndex];
    const throws = frame.throws || [];
    
    if (frame.frame_number < 10) {
      return this.calculateRegularFrameScore(throws, frames, frameIndex);
    } else {
      return this.calculateTenthFrameScore(throws);
    }
  }

  /**
   * Calculate score for frames 1-9
   */
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

  /**
   * Calculate score for 10th frame
   */
  static calculateTenthFrameScore(throws) {
    return throws.reduce((sum, pins) => sum + pins, 0);
  }

  /**
   * Get bonus points for a strike
   */
  static getStrikeBonus(allFrames, strikeFrameIndex) {
    const nextFrame = allFrames[strikeFrameIndex + 1];
    if (!nextFrame || !nextFrame.throws) return 0;

    const nextThrows = nextFrame.throws;

    // If next frame is also a strike and not the 10th frame
    if (nextThrows[0] === 10 && nextFrame.frame_number < 10) {
      const frameAfterNext = allFrames[strikeFrameIndex + 2];
      if (!frameAfterNext || !frameAfterNext.throws) return 10;
      
      const frameAfterThrows = frameAfterNext.throws;
      return 10 + (frameAfterThrows[0] || 0);
    }

    // Return next two throws
    return (nextThrows[0] || 0) + (nextThrows[1] || 0);
  }

  /**
   * Get bonus points for a spare
   */
  static getSpareBonus(allFrames, spareFrameIndex) {
    const nextFrame = allFrames[spareFrameIndex + 1];
    if (!nextFrame || !nextFrame.throws) return 0;

    return nextFrame.throws[0] || 0;
  }

  /**
   * Check if a frame is complete
   */
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

  /**
   * Calculate complete game score with cumulative totals
   */
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

  /**
   * Get game statistics (strikes, spares, opens)
   */
  static getGameStatistics(frames) {
    let strikes = 0;
    let spares = 0;
    let opens = 0;

    frames.forEach(frame => {
      const throws = frame.throws || [];
      
      if (frame.frame_number < 10) {
        if (throws[0] === 10) {
          strikes++;
        } else if ((throws[0] || 0) + (throws[1] || 0) === 10 && throws.length === 2) {
          spares++;
        } else if (throws.length === 2) {
          opens++;
        }
      } else {
        // 10th frame special counting
        if (throws[0] === 10) strikes++;
        if (throws.length >= 2 && throws[0] !== 10 && throws[0] + throws[1] === 10) spares++;
        if (throws.length >= 3 && throws[1] === 10) strikes++;
        if (throws.length >= 3 && throws[2] === 10) strikes++;
      }
    });

    return { strikes, spares, opens };
  }

  /**
   * Check if entire game is complete
   */
  static isGameComplete(frames) {
    // All frames must be complete
    return frames.every(frame => 
      this.isFrameComplete(frame.throws || [], frame.frame_number)
    );
  }

  /**
   * Get display value for a throw (with X for strikes, / for spares)
   */
  static getThrowDisplay(frameNumber, throwIndex, throws) {
    const value = throws[throwIndex];
    
    if (value === undefined || value === null) return '-';
    
    if (frameNumber === 10) {
      // 10th frame special display logic
      if (value === 10) return 'X';
      if (throwIndex > 0 && throws[throwIndex - 1] !== 10 && (throws[throwIndex - 1] || 0) + value === 10) return '/';
      return value === 0 ? '-' : value.toString();
    } else {
      // Regular frames 1-9
      if (throwIndex === 0 && value === 10) return 'X';
      if (throwIndex === 1 && (throws[0] || 0) + value === 10) return '/';
      return value === 0 ? '-' : value.toString();
    }
  }

  /**
   * Validate a throw value
   */
  static validateThrow(frameNumber, throwIndex, value, existingThrows = []) {
    if (value < 0 || value > 10) {
      return 'Pins must be between 0 and 10';
    }

    if (frameNumber < 10 && throwIndex === 1) {
      const firstThrow = existingThrows[0] || 0;
      if (firstThrow + value > 10) {
        return 'Total pins cannot exceed 10 in a frame';
      }
    }

    return null; // Valid
  }

  /**
   * Create empty game frames
   */
  static createEmptyGame() {
    return Array.from({ length: 10 }, (_, index) => ({
      frame_number: index + 1,
      throws: [],
      cumulative_score: 0,
      is_complete: false
    }));
  }
}

export default BowlingScoreCalculator;