/**
 * Split Detection and Analysis System
 * Detects splits in pin configurations and tracks conversion rates
 */

// Common split patterns in bowling
export const SPLIT_PATTERNS = {
  // 7-10 split (most common and difficult)
  '7-10': {
    name: '7-10 Split',
    pins: [7, 10],
    difficulty: 'very_hard',
    conversionRate: 0.5, // Professional rate
    description: 'The most famous split in bowling'
  },
  
  // 4-6 splits
  '4-6': {
    name: '4-6 Split',
    pins: [4, 6],
    difficulty: 'medium',
    conversionRate: 15.2,
    description: 'Common middle split'
  },
  '4-6-7': {
    name: '4-6-7 Split',
    pins: [4, 6, 7],
    difficulty: 'hard',
    conversionRate: 8.5,
    description: 'Three-pin split on left side'
  },
  '4-6-7-10': {
    name: 'Big Four',
    pins: [4, 6, 7, 10],
    difficulty: 'very_hard',
    conversionRate: 2.1,
    description: 'Four corner pins remaining'
  },
  '4-6-10': {
    name: '4-6-10 Split',
    pins: [4, 6, 10],
    difficulty: 'hard',
    conversionRate: 6.8,
    description: 'Wide three-pin split'
  },
  
  // 7-8-9-10 family
  '7-8-9-10': {
    name: 'Greek Church',
    pins: [7, 8, 9, 10],
    difficulty: 'very_hard',
    conversionRate: 1.8,
    description: 'Back row standing'
  },
  '8-10': {
    name: '8-10 Split',
    pins: [8, 10],
    difficulty: 'hard',
    conversionRate: 12.3,
    description: 'Right side split'
  },
  '7-9': {
    name: '7-9 Split',
    pins: [7, 9],
    difficulty: 'hard',
    conversionRate: 11.7,
    description: 'Left side split'
  },
  
  // Baby splits (easier)
  '2-7': {
    name: '2-7 Split',
    pins: [2, 7],
    difficulty: 'easy',
    conversionRate: 65.2,
    description: 'Baby split on left'
  },
  '3-10': {
    name: '3-10 Split',
    pins: [3, 10],
    difficulty: 'easy',
    conversionRate: 68.1,
    description: 'Baby split on right'
  },
  
  // Other common splits
  '5-7': {
    name: '5-7 Split',
    pins: [5, 7],
    difficulty: 'medium',
    conversionRate: 25.4,
    description: 'Left lane split'
  },
  '5-10': {
    name: '5-10 Split',
    pins: [5, 10],
    difficulty: 'medium',
    conversionRate: 24.8,
    description: 'Right lane split'
  },
  '6-7-10': {
    name: '6-7-10 Split',
    pins: [6, 7, 10],
    difficulty: 'very_hard',
    conversionRate: 3.2,
    description: 'Three wide pins'
  },
  '4-7-10': {
    name: '4-7-10 Split',
    pins: [4, 7, 10],
    difficulty: 'very_hard',
    conversionRate: 2.8,
    description: 'Triangle split'
  },
  
  // Unusual but notable splits
  '5-6': {
    name: '5-6 Split',
    pins: [5, 6],
    difficulty: 'easy',
    conversionRate: 72.5,
    description: 'Adjacent pins'
  },
  '9-10': {
    name: '9-10 Split',
    pins: [9, 10],
    difficulty: 'medium',
    conversionRate: 35.7,
    description: 'Right corner'
  },
  '4-5': {
    name: '4-5 Split',
    pins: [4, 5],
    difficulty: 'easy',
    conversionRate: 71.3,
    description: 'Left of center'
  },
  '1-7': {
    name: '1-7 Split',
    pins: [1, 7],
    difficulty: 'medium',
    conversionRate: 42.6,
    description: 'Head pin and 7'
  },
  '1-10': {
    name: '1-10 Split',
    pins: [1, 10],
    difficulty: 'medium',
    conversionRate: 44.1,
    description: 'Head pin and 10'
  },
  
  // Tricky three-pin splits
  '2-4-7': {
    name: '2-4-7 Split',
    pins: [2, 4, 7],
    difficulty: 'hard',
    conversionRate: 9.2,
    description: 'Left side cluster'
  },
  '3-6-10': {
    name: '3-6-10 Split',
    pins: [3, 6, 10],
    difficulty: 'hard',
    conversionRate: 8.8,
    description: 'Right side cluster'
  },
  '1-2-4-7': {
    name: 'Left Side',
    pins: [1, 2, 4, 7],
    difficulty: 'hard',
    conversionRate: 6.5,
    description: 'Left half standing'
  },
  '1-3-6-10': {
    name: 'Right Side',
    pins: [1, 3, 6, 10],
    difficulty: 'hard',
    conversionRate: 6.2,
    description: 'Right half standing'
  }
};

// Pin adjacency map (which pins are adjacent to each other)
const PIN_ADJACENCY = {
  1: [2, 3],
  2: [1, 3, 4, 5],
  3: [1, 2, 5, 6],
  4: [2, 5, 7, 8],
  5: [2, 3, 4, 6, 8, 9],
  6: [3, 5, 9, 10],
  7: [4, 8],
  8: [4, 5, 7, 9],
  9: [5, 6, 8, 10],
  10: [6, 9]
};

/**
 * Determines if a pin configuration is a split
 * A split occurs when the head pin (1) is down and there are non-adjacent pins standing
 */
export function isSplit(standingPins) {
  if (!Array.isArray(standingPins) || standingPins.length < 2) {
    return false;
  }

  // Head pin must be down for it to be a split
  if (standingPins.includes(1)) {
    return false;
  }

  // Check if any standing pins are non-adjacent
  for (let i = 0; i < standingPins.length; i++) {
    for (let j = i + 1; j < standingPins.length; j++) {
      const pin1 = standingPins[i];
      const pin2 = standingPins[j];
      
      // If these two pins are not adjacent, it's a split
      if (!PIN_ADJACENCY[pin1]?.includes(pin2)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Identifies the specific type of split
 */
export function identifySplit(standingPins) {
  if (!isSplit(standingPins)) {
    return null;
  }

  const sortedPins = [...standingPins].sort((a, b) => a - b);
  const key = sortedPins.join('-');
  
  return SPLIT_PATTERNS[key] || {
    name: `${key} Split`,
    pins: sortedPins,
    difficulty: 'unknown',
    conversionRate: 0,
    description: 'Uncommon split pattern'
  };
}

/**
 * Calculates split difficulty based on various factors
 */
export function calculateSplitDifficulty(splitInfo) {
  if (!splitInfo) return 0;

  const difficultyScores = {
    'very_easy': 1,
    'easy': 2,
    'medium': 3,
    'hard': 4,
    'very_hard': 5,
    'unknown': 3
  };

  return difficultyScores[splitInfo.difficulty] || 3;
}

/**
 * Analyzes a frame to detect splits from pin-by-pin data
 */
export function analyzeSplitFromFrame(frame) {
  if (!frame.throws || frame.throws.length === 0) {
    return null;
  }

  // Look at first throw result to determine standing pins
  const firstThrow = frame.throws[0];
  const pinsKnocked = firstThrow.pins_knocked || 0;
  
  if (pinsKnocked === 10) {
    return null; // Strike, no split possible
  }

  // Calculate standing pins after first throw
  const standingPins = [];
  for (let pin = 1; pin <= 10; pin++) {
    // This is simplified - in reality we'd need pin-by-pin data
    // For now, we'll estimate based on pins knocked down
    if (pin > pinsKnocked) {
      standingPins.push(pin);
    }
  }

  return identifySplit(standingPins);
}

/**
 * Analyzes split from specific pin configuration
 */
export function analyzeSplitFromPins(knockedDownPins) {
  const standingPins = [];
  for (let pin = 1; pin <= 10; pin++) {
    if (!knockedDownPins.includes(pin)) {
      standingPins.push(pin);
    }
  }

  return identifySplit(standingPins);
}

/**
 * Calculates user's split conversion statistics
 */
export function calculateSplitStats(games) {
  const stats = {
    totalSplits: 0,
    splitsConverted: 0,
    conversionRate: 0,
    splitsByType: {},
    difficultyBreakdown: {
      easy: { total: 0, converted: 0, rate: 0 },
      medium: { total: 0, converted: 0, rate: 0 },
      hard: { total: 0, converted: 0, rate: 0 },
      very_hard: { total: 0, converted: 0, rate: 0 }
    }
  };

  for (const game of games) {
    if (!game.frames) continue;

    for (const frame of game.frames) {
      if (frame.frame_number === 10) continue; // Skip 10th frame for now

      const splitInfo = analyzeSplitFromFrame(frame);
      if (!splitInfo) continue;

      stats.totalSplits++;
      
      // Track by split type
      const splitKey = splitInfo.pins.join('-');
      if (!stats.splitsByType[splitKey]) {
        stats.splitsByType[splitKey] = {
          ...splitInfo,
          total: 0,
          converted: 0,
          rate: 0
        };
      }
      stats.splitsByType[splitKey].total++;

      // Check if split was converted (spare made)
      const totalPins = frame.throws.reduce((sum, t) => sum + (t.pins_knocked || 0), 0);
      const converted = totalPins === 10;
      
      if (converted) {
        stats.splitsConverted++;
        stats.splitsByType[splitKey].converted++;
      }

      // Track by difficulty
      const difficulty = splitInfo.difficulty;
      if (stats.difficultyBreakdown[difficulty]) {
        stats.difficultyBreakdown[difficulty].total++;
        if (converted) {
          stats.difficultyBreakdown[difficulty].converted++;
        }
      }
    }
  }

  // Calculate rates
  stats.conversionRate = stats.totalSplits > 0 ? (stats.splitsConverted / stats.totalSplits) * 100 : 0;

  Object.keys(stats.splitsByType).forEach(splitKey => {
    const splitData = stats.splitsByType[splitKey];
    splitData.rate = splitData.total > 0 ? (splitData.converted / splitData.total) * 100 : 0;
  });

  Object.keys(stats.difficultyBreakdown).forEach(difficulty => {
    const diffData = stats.difficultyBreakdown[difficulty];
    diffData.rate = diffData.total > 0 ? (diffData.converted / diffData.total) * 100 : 0;
  });

  return stats;
}

/**
 * Gets split advice for improvement
 */
export function getSplitAdvice(splitInfo) {
  if (!splitInfo) return null;

  const advice = {
    '7-10': 'Aim for the 7 pin and try to slide it into the 10. Use a straight ball with power.',
    '4-6': 'Hit either pin at an angle to slide it into the other. Medium speed works best.',
    '2-7': 'Easy conversion - aim between the pins or hit the 2 pin at an angle.',
    '3-10': 'Hit the 3 pin at an angle to send it across the lane to the 10.',
    '5-7': 'Aim for the 5 pin to deflect into the 7.',
    '5-10': 'Aim for the 5 pin to deflect into the 10.',
    '8-10': 'Hit the 8 pin firmly to slide it into the 10.',
    '7-9': 'Hit either pin at an angle to convert.',
    '9-10': 'Hit the 9 pin to deflect into the 10.'
  };

  const key = splitInfo.pins.join('-');
  return advice[key] || 'Focus on accuracy and try to hit one pin into the other.';
}

export default {
  SPLIT_PATTERNS,
  isSplit,
  identifySplit,
  calculateSplitDifficulty,
  analyzeSplitFromFrame,
  analyzeSplitFromPins,
  calculateSplitStats,
  getSplitAdvice
};