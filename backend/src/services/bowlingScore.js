/**
 * Complex bowling score calculation service
 * Handles all bowling scoring rules including strikes, spares, and 10th frame logic
 */
class BowlingScoreService {
  constructor() {
    // Bowling scoring constants
    this.MAX_PINS = 10;
    this.MAX_FRAMES = 10;
  }

  /**
   * Calculate cumulative scores for all frames in a game
   * @param {Array} frames - Array of frame objects with throws_data
   * @returns {Array} Updated frames with cumulative scores
   */
  calculateGameScore(frames) {
    const sortedFrames = frames.sort((a, b) => a.frame_number - b.frame_number);
    let cumulativeScore = 0;

    for (let i = 0; i < sortedFrames.length; i++) {
      const frame = sortedFrames[i];
      const throws = JSON.parse(frame.throws_data);
      
      let frameScore = 0;

      if (frame.frame_number < 10) {
        frameScore = this.calculateRegularFrameScore(throws, sortedFrames, i);
      } else {
        frameScore = this.calculateTenthFrameScore(throws);
      }

      cumulativeScore += frameScore;
      frame.cumulative_score = cumulativeScore;
    }

    return sortedFrames;
  }

  /**
   * Calculate score for frames 1-9
   * @param {Array} throws - Array of pin counts for this frame
   * @param {Array} allFrames - All frames in the game
   * @param {number} frameIndex - Current frame index
   * @returns {number} Score for this frame
   */
  calculateRegularFrameScore(throws, allFrames, frameIndex) {
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
   * Calculate score for the 10th frame (special rules)
   * @param {Array} throws - Array of pin counts for 10th frame
   * @returns {number} Total score for 10th frame
   */
  calculateTenthFrameScore(throws) {
    return throws.reduce((sum, pins) => sum + pins, 0);
  }

  /**
   * Get bonus points for a strike
   * @param {Array} allFrames - All frames in the game
   * @param {number} strikeFrameIndex - Index of the strike frame
   * @returns {number} Bonus points (next two throws)
   */
  getStrikeBonus(allFrames, strikeFrameIndex) {
    const nextFrame = allFrames[strikeFrameIndex + 1];
    
    if (!nextFrame) return 0;

    const nextThrows = JSON.parse(nextFrame.throws_data);

    // If next frame is also a strike, need to look at frame after that
    if (nextThrows[0] === 10 && nextFrame.frame_number < 10) {
      const frameAfterNext = allFrames[strikeFrameIndex + 2];
      if (!frameAfterNext) return 10;
      
      const frameAfterThrows = JSON.parse(frameAfterNext.throws_data);
      return 10 + frameAfterThrows[0];
    }

    // Return next two throws
    if (nextThrows.length >= 2) {
      return nextThrows[0] + nextThrows[1];
    } else if (nextThrows.length === 1) {
      return nextThrows[0];
    }

    return 0;
  }

  /**
   * Get bonus points for a spare
   * @param {Array} allFrames - All frames in the game
   * @param {number} spareFrameIndex - Index of the spare frame
   * @returns {number} Bonus points (next throw)
   */
  getSpareBonus(allFrames, spareFrameIndex) {
    const nextFrame = allFrames[spareFrameIndex + 1];
    
    if (!nextFrame) return 0;

    const nextThrows = JSON.parse(nextFrame.throws_data);
    return nextThrows[0] || 0;
  }

  /**
   * Validate throws for a specific frame
   * @param {Array} throws - Array of pin counts
   * @param {number} frameNumber - Frame number (1-10)
   * @returns {Object} Validation result
   */
  validateThrows(throws, frameNumber) {
    if (!Array.isArray(throws) || throws.length === 0) {
      return { valid: false, error: 'Throws must be a non-empty array' };
    }

    // Validate each throw
    for (const pins of throws) {
      if (!Number.isInteger(pins) || pins < 0 || pins > 10) {
        return { valid: false, error: 'Each throw must be an integer between 0 and 10' };
      }
    }

    if (frameNumber < 10) {
      return this.validateRegularFrame(throws);
    } else {
      return this.validateTenthFrame(throws);
    }
  }

  /**
   * Validate throws for frames 1-9
   * @param {Array} throws - Array of pin counts
   * @returns {Object} Validation result
   */
  validateRegularFrame(throws) {
    if (throws.length > 2) {
      return { valid: false, error: 'Regular frame can have at most 2 throws' };
    }

    const total = throws.reduce((sum, pins) => sum + pins, 0);

    if (total > 10) {
      return { valid: false, error: 'Total pins cannot exceed 10 in a frame' };
    }

    // If first throw is 10, it should be the only throw
    if (throws[0] === 10 && throws.length > 1) {
      return { valid: false, error: 'Strike frame should have only one throw' };
    }

    return { valid: true };
  }

  /**
   * Validate throws for the 10th frame
   * @param {Array} throws - Array of pin counts
   * @returns {Object} Validation result
   */
  validateTenthFrame(throws) {
    if (throws.length < 2) {
      return { valid: false, error: '10th frame must have at least 2 throws' };
    }

    if (throws.length > 3) {
      return { valid: false, error: '10th frame can have at most 3 throws' };
    }

    const [first, second, third] = throws;

    // Strike on first throw
    if (first === 10) {
      if (throws.length < 3) {
        return { valid: false, error: '10th frame with strike needs 3 throws' };
      }
      
      // Second throw is also a strike
      if (second === 10) {
        return { valid: true }; // Third can be any valid throw
      }
      
      // Second + third must not exceed 10 (unless third is after a spare)
      if (second + third > 10) {
        return { valid: false, error: 'Invalid pin combination in 10th frame' };
      }
    }
    // Spare on first two throws
    else if (first + second === 10) {
      if (throws.length < 3) {
        return { valid: false, error: '10th frame with spare needs 3 throws' };
      }
    }
    // No strike or spare
    else {
      if (first + second > 10) {
        return { valid: false, error: 'First two throws cannot exceed 10 pins' };
      }
      
      if (throws.length > 2) {
        return { valid: false, error: '10th frame without strike/spare should have only 2 throws' };
      }
    }

    return { valid: true };
  }

  /**
   * Check if a frame is complete based on throws
   * @param {Array} throws - Array of pin counts
   * @param {number} frameNumber - Frame number (1-10)
   * @returns {boolean} Whether the frame is complete
   */
  isFrameComplete(throws, frameNumber) {
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
   * Get frame statistics (strikes, spares, opens)
   * @param {Array} frames - Array of completed frames
   * @returns {Object} Frame statistics
   */
  getFrameStats(frames) {
    let strikes = 0;
    let spares = 0;
    let opens = 0;

    frames.forEach(frame => {
      if (frame.frame_number <= 10) {
        const throws = JSON.parse(frame.throws_data);
        
        if (frame.frame_number < 10) {
          if (throws[0] === 10) {
            strikes++;
          } else if (throws.reduce((sum, pins) => sum + pins, 0) === 10) {
            spares++;
          } else {
            opens++;
          }
        } else {
          // 10th frame - count strikes and spares differently
          if (throws[0] === 10) strikes++;
          if (throws.length >= 2 && throws[0] !== 10 && throws[0] + throws[1] === 10) spares++;
          if (throws.length >= 3 && throws[1] === 10) strikes++;
          if (throws.length === 3 && throws[1] !== 10 && throws[1] + throws[2] === 10) spares++;
        }
      }
    });

    return { strikes, spares, opens };
  }
}

module.exports = BowlingScoreService;