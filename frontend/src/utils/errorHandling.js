/**
 * Error Handling Utilities for Game Entry
 * Provides consistent error handling, retry logic, and user-friendly messages
 */

/**
 * Wrap async operation with error handling and retry logic
 * @param {Function} operation - Async operation to execute
 * @param {object} options - Configuration options
 * @returns {Promise} - Result or throws formatted error
 */
export const withErrorHandling = async (
  operation,
  {
    maxRetries = 2,
    retryDelay = 1000,
    onError = null,
    errorMessage = 'Operation failed. Please try again.',
  } = {}
) => {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  // All retries failed
  const formattedError = formatError(lastError, errorMessage);
  
  if (onError) {
    onError(formattedError);
  }

  return { success: false, error: formattedError };
};

/**
 * Format error into user-friendly message
 * @param {Error} error - Error object
 * @param {string} fallbackMessage - Default message if error can't be parsed
 * @returns {object} - Formatted error object
 */
export const formatError = (error, fallbackMessage = 'An error occurred') => {
  if (!error) {
    return { message: fallbackMessage, type: 'unknown' };
  }

  // Network errors
  if (!navigator.onLine) {
    return {
      message: 'No internet connection. Please check your network and try again.',
      type: 'network',
      retryable: true,
    };
  }

  // API errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 400) {
      return {
        message: data?.message || 'Invalid data. Please check your entries.',
        type: 'validation',
        retryable: false,
      };
    }

    if (status === 401 || status === 403) {
      return {
        message: 'Session expired. Please log in again.',
        type: 'auth',
        retryable: false,
      };
    }

    if (status === 404) {
      return {
        message: 'Resource not found. Please refresh and try again.',
        type: 'notfound',
        retryable: false,
      };
    }

    if (status >= 500) {
      return {
        message: 'Server error. Please try again in a moment.',
        type: 'server',
        retryable: true,
      };
    }

    return {
      message: data?.message || fallbackMessage,
      type: 'api',
      retryable: true,
    };
  }

  // Client-side errors
  if (error.message) {
    return {
      message: error.message,
      type: 'client',
      retryable: false,
    };
  }

  return {
    message: fallbackMessage,
    type: 'unknown',
    retryable: true,
  };
};

/**
 * Validate bowling score data before submission
 * @param {object} gameData - Game data to validate
 * @param {string} entryMode - Entry mode ('final_score', 'frame_by_frame', 'pin_by_pin')
 * @returns {object} - Validation result with errors array
 */
export const validateGameData = (gameData, entryMode) => {
  const errors = [];

  if (!gameData) {
    return { valid: false, errors: ['No game data provided'] };
  }

  // Common validations
  if (entryMode === 'final_score') {
    if (!gameData.totalScore && gameData.totalScore !== 0) {
      errors.push('Total score is required');
    } else if (gameData.totalScore < 0 || gameData.totalScore > 300) {
      errors.push('Score must be between 0 and 300');
    }

    if (gameData.strikes !== undefined && (gameData.strikes < 0 || gameData.strikes > 12)) {
      errors.push('Strikes must be between 0 and 12');
    }

    if (gameData.spares !== undefined && (gameData.spares < 0 || gameData.spares > 10)) {
      errors.push('Spares must be between 0 and 10');
    }
  }

  if (entryMode === 'frame_by_frame' || entryMode === 'pin_by_pin') {
    if (!gameData.frames || !Array.isArray(gameData.frames)) {
      errors.push('Frame data is required');
    } else if (gameData.frames.length !== 10) {
      errors.push('Game must have exactly 10 frames');
    } else {
      // Validate each frame
      gameData.frames.forEach((frame, index) => {
        if (!frame.throws || frame.throws.length === 0) {
          if (index === 0) {
            errors.push('Game must have at least one throw');
          }
        } else {
          // Validate throw values
          frame.throws.forEach((throwValue, throwIndex) => {
            if (throwValue < 0 || throwValue > 10) {
              errors.push(`Frame ${index + 1}, throw ${throwIndex + 1}: Invalid pin count (${throwValue})`);
            }
          });

          // Validate frame totals (frames 1-9)
          if (frame.frame_number < 10) {
            const total = frame.throws.reduce((sum, t) => sum + t, 0);
            if (total > 10 && frame.throws[0] !== 10) {
              errors.push(`Frame ${frame.frame_number}: Total pins exceed 10`);
            }
          }
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Safe scoring calculation with error handling
 * @param {Function} calculationFn - Scoring calculation function
 * @param {any} data - Data to calculate
 * @returns {object} - Result or error
 */
export const safeCalculation = (calculationFn, data) => {
  try {
    const result = calculationFn(data);
    return { success: true, data: result };
  } catch (error) {
    console.error('Calculation error:', error);
    return {
      success: false,
      error: {
        message: 'Failed to calculate score. Please check your entries.',
        type: 'calculation',
        details: error.message,
      },
    };
  }
};
