/**
 * Game Entry Persistence Utility
 * Provides localStorage/sessionStorage backup for all game entry modes
 * Prevents data loss on accidental refresh
 */

const STORAGE_KEYS = {
  FINAL_SCORE: 'bowling_entry_final_score',
  FRAME_BY_FRAME: 'bowling_entry_frame_by_frame',
  PIN_BY_PIN: 'bowling_entry_pin_by_pin',
};

/**
 * Save game entry state to sessionStorage
 * @param {string} entryMode - 'final_score', 'frame_by_frame', or 'pin_by_pin'
 * @param {object} data - Game entry data to persist
 */
export const saveGameEntryState = (entryMode, data) => {
  try {
    const key = STORAGE_KEYS[entryMode.toUpperCase().replace(/-/g, '_')];
    if (!key) {
      console.warn('Unknown entry mode:', entryMode);
      return false;
    }

    const stateToSave = {
      ...data,
      timestamp: new Date().toISOString(),
      entryMode,
    };

    sessionStorage.setItem(key, JSON.stringify(stateToSave));
    return true;
  } catch (error) {
    console.error('Failed to save game entry state:', error);
    return false;
  }
};

/**
 * Load game entry state from sessionStorage
 * @param {string} entryMode - 'final_score', 'frame_by_frame', or 'pin_by_pin'
 * @returns {object|null} - Restored state or null if none exists
 */
export const loadGameEntryState = (entryMode) => {
  try {
    const key = STORAGE_KEYS[entryMode.toUpperCase().replace(/-/g, '_')];
    if (!key) {
      console.warn('Unknown entry mode:', entryMode);
      return null;
    }

    const saved = sessionStorage.getItem(key);
    if (!saved) return null;

    const state = JSON.parse(saved);
    
    // Check if state is stale (older than 24 hours)
    const timestamp = new Date(state.timestamp);
    const age = Date.now() - timestamp.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (age > maxAge) {
      clearGameEntryState(entryMode);
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to load game entry state:', error);
    return null;
  }
};

/**
 * Clear game entry state from sessionStorage
 * @param {string} entryMode - 'final_score', 'frame_by_frame', or 'pin_by_pin'
 */
export const clearGameEntryState = (entryMode) => {
  try {
    const key = STORAGE_KEYS[entryMode.toUpperCase().replace(/-/g, '_')];
    if (!key) return;
    
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear game entry state:', error);
  }
};

/**
 * Check if there's a saved state for an entry mode
 * @param {string} entryMode - 'final_score', 'frame_by_frame', or 'pin_by_pin'
 * @returns {boolean}
 */
export const hasSavedState = (entryMode) => {
  try {
    const key = STORAGE_KEYS[entryMode.toUpperCase().replace(/-/g, '_')];
    if (!key) return false;
    
    return sessionStorage.getItem(key) !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Clear all game entry states
 */
export const clearAllGameEntryStates = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear state for key:', key, error);
    }
  });
};
