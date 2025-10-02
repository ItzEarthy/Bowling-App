/**
 * Split Detection and Analysis System
 * Detects splits in pin configurations and tracks conversion rates
 */

// Common split patterns in bowling
export const SPLIT_PATTERNS = {
  // Baby Split - Easiest splits
  '2-7': {
    name: 'Baby Split',
    pins: [2, 7],
    difficulty: 'easy',
    conversionRate: 65.2,
    description: 'Baby split on left side - generally the easiest split to convert'
  },
  '3-10': {
    name: 'Baby Split',
    pins: [3, 10],
    difficulty: 'easy',
    conversionRate: 68.1,
    description: 'Baby split on right side - generally the easiest split to convert'
  },
  
  // Big Four (also known as "The Golden Gate" or "Big Ears")
  '4-6-7-10': {
    name: 'Big Four',
    pins: [4, 6, 7, 10],
    difficulty: 'very_hard',
    conversionRate: 2.1,
    description: 'Four corner pins remaining - also known as "The Golden Gate" or "Big Ears"'
  },
  
  // Big Five (Greek Church variations)
  '4-6-7-9-10': {
    name: 'Big Five (Greek Church)',
    pins: [4, 6, 7, 9, 10],
    difficulty: 'very_hard',
    conversionRate: 1.5,
    description: 'Greek Church variation for right-handed bowlers - five pins with gaps'
  },
  '4-6-7-8-10': {
    name: 'Big Five (Greek Church)',
    pins: [4, 6, 7, 8, 10],
    difficulty: 'very_hard',
    conversionRate: 1.5,
    description: 'Greek Church variation for left-handed bowlers - five pins with gaps'
  },
  
  // Goal Posts (or "Bed Posts") - The most famous
  '7-10': {
    name: 'Goal Posts (Bed Posts)',
    pins: [7, 10],
    difficulty: 'very_hard',
    conversionRate: 0.5,
    description: 'The most infamous and difficult split to convert - also called "Bed Posts"'
  },
  
  // Cincinnati
  '4-7-10': {
    name: 'Cincinnati',
    pins: [4, 7, 10],
    difficulty: 'very_hard',
    conversionRate: 2.8,
    description: 'Cincinnati split for left-handed bowlers - three-pin triangle'
  },
  '6-7-10': {
    name: 'Cincinnati',
    pins: [6, 7, 10],
    difficulty: 'very_hard',
    conversionRate: 3.2,
    description: 'Cincinnati split for right-handed bowlers - three-pin triangle'
  },
  
  // Dime Store
  '5-10': {
    name: 'Dime Store',
    pins: [5, 10],
    difficulty: 'medium',
    conversionRate: 24.8,
    description: 'The Dime Store split - 5 and 10 pins remaining'
  },
  
  // Woolworth
  '5-7': {
    name: 'Woolworth',
    pins: [5, 7],
    difficulty: 'medium',
    conversionRate: 25.4,
    description: 'The Woolworth split - 5 and 7 pins remaining'
  },
  
  // Sour Apple (or "Lily")
  '5-7-10': {
    name: 'Sour Apple (Lily)',
    pins: [5, 7, 10],
    difficulty: 'very_hard',
    conversionRate: 4.2,
    description: 'The Sour Apple split - also known as "Lily" - three pins in an arc'
  },
  
  // Cocked Hat (or "Christmas Tree") - technically not always a true split
  '2-4-7': {
    name: 'Cocked Hat (Christmas Tree)',
    pins: [2, 4, 7],
    difficulty: 'hard',
    conversionRate: 12.5,
    description: 'Cocked Hat on left - not always a true split but difficult to convert'
  },
  '3-6-10': {
    name: 'Cocked Hat (Christmas Tree)',
    pins: [3, 6, 10],
    difficulty: 'hard',
    conversionRate: 13.1,
    description: 'Cocked Hat on right - not always a true split but difficult to convert'
  },
  '4-7-8': {
    name: 'Cocked Hat (Christmas Tree)',
    pins: [4, 7, 8],
    difficulty: 'hard',
    conversionRate: 11.8,
    description: 'Cocked Hat variation - not always a true split but difficult to convert'
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
 * Returns null if the split is not in our defined SPLIT_PATTERNS
 */
export function identifySplit(standingPins) {
  if (!isSplit(standingPins)) {
    return null;
  }

  const sortedPins = [...standingPins].sort((a, b) => a - b);
  const key = sortedPins.join('-');
  
  // Only return splits that match our defined patterns
  // Return null for unrecognized splits
  return SPLIT_PATTERNS[key] || null;
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
 * Gets split advice for improvement with exact pin targeting
 */
export function getSplitAdvice(splitInfo) {
  if (!splitInfo) return null;

  const adviceMap = {
    // Baby Split (2-7 or 3-10)
    '2-7': {
      targetPin: '2 pin',
      approach: 'Baby split - very makeable. Hit the 2 pin straight on or slightly right of center to slide it into the 7.',
      difficulty: 'Easy',
      tips: ['Position on the left side', 'Aim directly at 2-pin pocket', '65% of professionals make this', 'This is one of the easiest splits']
    },
    '3-10': {
      targetPin: '3 pin',
      approach: 'Baby split - very makeable. Hit the 3 pin straight on or slightly left of center to slide it into the 10.',
      difficulty: 'Easy',
      tips: ['Position on the right side', 'Aim at 3-pin left side', '68% of professionals make this', 'This is one of the easiest splits']
    },
    
    // Big Four (The Golden Gate / Big Ears)
    '4-6-7-10': {
      targetPin: '4 or 6 pin',
      approach: 'The "Big Four" or "Golden Gate" - nearly impossible. Try to hit either middle pin (4 or 6) at an extreme angle to create maximum pin scatter.',
      difficulty: 'Nearly impossible',
      tips: ['Focus on hitting 4 or 6 pin very thin', 'Hope for maximum pin action and lucky bounces', 'Even pros convert this less than 3% of the time', 'This is mostly luck']
    },
    
    // Big Five (Greek Church)
    '4-6-7-9-10': {
      targetPin: '4 or 6 pin',
      approach: 'The "Big Five" or "Greek Church" - extremely difficult. Hit the 4 or 6 pin at an angle to try creating a chain reaction.',
      difficulty: 'Nearly impossible',
      tips: ['Target the 4 or 6 pin thin', 'Need perfect angle and multiple pin deflections', 'Less than 2% conversion rate', 'Requires exceptional luck']
    },
    '4-6-7-8-10': {
      targetPin: '4 or 6 pin',
      approach: 'The "Big Five" or "Greek Church" - extremely difficult. Hit the 4 or 6 pin at an angle to try creating a chain reaction.',
      difficulty: 'Nearly impossible',
      tips: ['Target the 4 or 6 pin thin', 'Need perfect angle and multiple pin deflections', 'Less than 2% conversion rate', 'Requires exceptional luck']
    },
    
    // Goal Posts (Bed Posts) - 7-10
    '7-10': {
      targetPin: '7 or 10 pin',
      approach: 'The "Goal Posts" or "Bed Posts" - the most infamous split in bowling. Aim for the corner of your chosen pin and try to slide it across to hit the other. Use a straight ball with controlled power.',
      difficulty: 'Nearly impossible',
      tips: ['Choose which pin to target', 'Position on opposite side from target', 'Hit extremely thin to maximize slide', 'Less than 1% conversion rate even for pros']
    },
    
    // Cincinnati
    '4-7-10': {
      targetPin: '4 pin',
      approach: 'The "Cincinnati" split for left-handers. Very difficult triangle split. Hit the 4 pin thin to create chain reaction toward 7 and 10.',
      difficulty: 'Very hard',
      tips: ['Hit 4-pin very thin on the right side', 'Use maximum ball speed', 'Need perfect angle for pin deflection', 'Hope for lucky bounce']
    },
    '6-7-10': {
      targetPin: '6 pin',
      approach: 'The "Cincinnati" split for right-handers. Very difficult triangle split. Hit the 6 pin thin on the left to create maximum deflection toward 7 and 10.',
      difficulty: 'Very hard',
      tips: ['Aim at 6-pin left edge', 'Need perfect angle and deflection', 'Use firm ball speed', 'Low success rate even for pros']
    },
    
    // Dime Store (5-10)
    '5-10': {
      targetPin: '5 pin',
      approach: 'The "Dime Store" split. Hit the 5 pin solidly on the right side to deflect it into the 10.',
      difficulty: 'Medium',
      tips: ['Stand near center or slightly left', 'Strike the 5-pin right side', 'Use medium-firm ball speed', 'Approximately 25% conversion rate']
    },
    
    // Woolworth (5-7)
    '5-7': {
      targetPin: '5 pin',
      approach: 'The "Woolworth" split. Hit the 5 pin solidly on the left side to deflect it into the 7.',
      difficulty: 'Medium',
      tips: ['Stand near center or slightly right', 'Strike the 5-pin left side', 'Use medium-firm ball speed', 'Approximately 25% conversion rate']
    },
    
    // Sour Apple / Lily (5-7-10)
    '5-7-10': {
      targetPin: '5 pin',
      approach: 'The "Sour Apple" or "Lily" split. Very challenging. Hit the 5 pin perfectly to deflect toward both corner pins.',
      difficulty: 'Very hard',
      tips: ['Must hit 5-pin dead center', 'Use firm, controlled speed', 'Need perfect angle for dual deflection', 'Approximately 4% conversion rate']
    },
    
    // Cocked Hat / Christmas Tree
    '2-4-7': {
      targetPin: '2 pin',
      approach: 'The "Cocked Hat" or "Christmas Tree" on the left side. Hit the 2 pin firmly on the right side to create a chain reaction.',
      difficulty: 'Hard',
      tips: ['Position on the left side', 'Aim for 2-pin right edge', 'Use medium-high ball speed', 'Not always a true split but still difficult']
    },
    '3-6-10': {
      targetPin: '3 pin',
      approach: 'The "Cocked Hat" or "Christmas Tree" on the right side. Hit the 3 pin firmly on the left side to create a chain reaction.',
      difficulty: 'Hard',
      tips: ['Position on the right side', 'Aim for 3-pin left side', 'Use medium-high ball speed', 'Need good deflection angle']
    },
    '4-7-8': {
      targetPin: '4 pin',
      approach: 'The "Cocked Hat" or "Christmas Tree" variation. Hit the 4 pin to start a chain reaction toward the back pins.',
      difficulty: 'Hard',
      tips: ['Position left of center', 'Aim for 4-pin right edge', 'Medium-high ball speed', 'Not always a true split but challenging']
    }
  };

  const key = splitInfo.pins.join('-');
  return adviceMap[key] || {
    targetPin: `Pin ${splitInfo.pins[0]}`,
    approach: 'Focus on hitting one pin into the others with proper angle and speed.',
    difficulty: 'Varies',
    tips: ['Assess the angle needed', 'Adjust position accordingly', 'Practice makes perfect']
  };
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