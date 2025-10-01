/**
 * Oil Pattern Database and Analysis System
 * Comprehensive database of oil patterns with performance correlation
 */

export const OIL_PATTERNS = {
  // Professional Tournament Patterns (PBA)
  pba_patterns: {
    shark: {
      id: 'shark',
      name: 'Shark',
      type: 'sport',
      length: 42,
      ratio: '3.17:1',
      volume: 25.5,
      difficulty: 'hard',
      characteristics: {
        backend: 'strong',
        breakpoint: 'late',
        carry: 'medium',
        pin_action: 'aggressive'
      },
      description: 'Long, flat pattern requiring precision and patience',
      strategy: {
        recommended_line: '4th arrow to 7 pin',
        ball_surface: '2000-4000 grit',
        release: 'controlled rev rate',
        targeting: 'play straighter lines'
      },
      performance_factors: {
        accuracy_weight: 0.4,
        power_weight: 0.2,
        consistency_weight: 0.4
      }
    },
    chameleon: {
      id: 'chameleon',
      name: 'Chameleon',
      type: 'sport',
      length: 36,
      ratio: '2.94:1',
      volume: 22.8,
      difficulty: 'medium-hard',
      characteristics: {
        backend: 'medium',
        breakpoint: 'controlled',
        carry: 'good',
        pin_action: 'clean'
      },
      description: 'Medium length pattern with controlled backend reaction',
      strategy: {
        recommended_line: '3rd arrow area',
        ball_surface: '1500-3000 grit',
        release: 'medium rev rate',
        targeting: 'consistent target area'
      },
      performance_factors: {
        accuracy_weight: 0.35,
        power_weight: 0.3,
        consistency_weight: 0.35
      }
    },
    viper: {
      id: 'viper',
      name: 'Viper',
      type: 'sport',
      length: 36,
      ratio: '2.33:1',
      volume: 19.2,
      difficulty: 'medium',
      characteristics: {
        backend: 'sharp',
        breakpoint: 'defined',
        carry: 'excellent',
        pin_action: 'dynamic'
      },
      description: 'Shorter sport pattern allowing for more aggressive play',
      strategy: {
        recommended_line: '2nd-3rd arrow',
        ball_surface: '1000-2000 grit',
        release: 'higher rev rate',
        targeting: 'attack the pocket'
      },
      performance_factors: {
        accuracy_weight: 0.3,
        power_weight: 0.4,
        consistency_weight: 0.3
      }
    },
    scorpion: {
      id: 'scorpion',
      name: 'Scorpion',
      type: 'sport',
      length: 41,
      ratio: '3.06:1',
      volume: 24.1,
      difficulty: 'hard',
      characteristics: {
        backend: 'controlled',
        breakpoint: 'gradual',
        carry: 'challenging',
        pin_action: 'controlled'
      },
      description: 'Long pattern requiring extreme precision',
      strategy: {
        recommended_line: 'straight up 10 board',
        ball_surface: '3000+ grit',
        release: 'low rev rate',
        targeting: 'play the track area'
      },
      performance_factors: {
        accuracy_weight: 0.5,
        power_weight: 0.15,
        consistency_weight: 0.35
      }
    }
  },

  // House Patterns
  house_patterns: {
    typical_house: {
      id: 'typical_house',
      name: 'Typical House Shot',
      type: 'house',
      length: 39,
      ratio: '10:1',
      volume: 23.0,
      difficulty: 'easy',
      characteristics: {
        backend: 'strong',
        breakpoint: 'sharp',
        carry: 'forgiving',
        pin_action: 'explosive'
      },
      description: 'Standard house pattern with heavy oil in middle, dry outside',
      strategy: {
        recommended_line: '2nd arrow to pocket',
        ball_surface: '1500 grit or less',
        release: 'high rev rate preferred',
        targeting: 'swing the lane'
      },
      performance_factors: {
        accuracy_weight: 0.2,
        power_weight: 0.5,
        consistency_weight: 0.3
      }
    },
    modified_house: {
      id: 'modified_house',
      name: 'Modified House',
      type: 'house',
      length: 41,
      ratio: '6:1',
      volume: 25.5,
      difficulty: 'easy-medium',
      characteristics: {
        backend: 'medium-strong',
        breakpoint: 'controllable',
        carry: 'good',
        pin_action: 'clean'
      },
      description: 'Slightly flatter house shot for league play',
      strategy: {
        recommended_line: '2nd-3rd arrow',
        ball_surface: '2000 grit',
        release: 'medium-high rev rate',
        targeting: 'play more direct'
      },
      performance_factors: {
        accuracy_weight: 0.25,
        power_weight: 0.4,
        consistency_weight: 0.35
      }
    }
  },

  // Challenge Patterns
  challenge_patterns: {
    double_trouble: {
      id: 'double_trouble',
      name: 'Double Trouble',
      type: 'challenge',
      length: 'varies',
      ratio: 'complex',
      volume: 'medium',
      difficulty: 'very-hard',
      characteristics: {
        backend: 'unpredictable',
        breakpoint: 'multiple',
        carry: 'challenging',
        pin_action: 'varied'
      },
      description: 'Two distinct oil patterns creating complex lane conditions',
      strategy: {
        recommended_line: 'read and adjust',
        ball_surface: 'multiple options',
        release: 'versatile approach',
        targeting: 'constant adjustment'
      },
      performance_factors: {
        accuracy_weight: 0.35,
        power_weight: 0.25,
        consistency_weight: 0.4
      }
    }
  }
};

export class OilPatternAnalyzer {
  constructor() {
    this.patterns = OIL_PATTERNS;
    this.performanceData = this.loadPerformanceData();
  }

  // Load stored performance data
  loadPerformanceData() {
    const stored = localStorage.getItem('oil-pattern-performance');
    return stored ? JSON.parse(stored) : {};
  }

  // Save performance data
  savePerformanceData() {
    localStorage.setItem('oil-pattern-performance', JSON.stringify(this.performanceData));
  }

  // Get all available patterns
  getAllPatterns() {
    const allPatterns = [];
    Object.values(this.patterns).forEach(category => {
      Object.values(category).forEach(pattern => {
        allPatterns.push(pattern);
      });
    });
    return allPatterns;
  }

  // Get patterns by type
  getPatternsByType(type) {
    if (this.patterns[`${type}_patterns`]) {
      return Object.values(this.patterns[`${type}_patterns`]);
    }
    return [];
  }

  // Get pattern by ID
  getPatternById(id) {
    const allPatterns = this.getAllPatterns();
    return allPatterns.find(pattern => pattern.id === id);
  }

  // Record game performance on specific pattern
  recordGamePerformance(patternId, gameData) {
    if (!this.performanceData[patternId]) {
      this.performanceData[patternId] = {
        games: [],
        totalGames: 0,
        averageScore: 0,
        highScore: 0,
        lowScore: 999,
        totalStrikes: 0,
        totalSpares: 0,
        adjustmentsMade: 0,
        preferredLines: {},
        ballsUsed: {}
      };
    }

    const patternData = this.performanceData[patternId];
    const pattern = this.getPatternById(patternId);
    
    // Calculate performance score based on pattern factors
    const performanceScore = this.calculatePerformanceScore(gameData, pattern);
    
    // Record game
    patternData.games.push({
      ...gameData,
      performanceScore,
      date: new Date().toISOString()
    });
    
    // Update statistics
    patternData.totalGames++;
    patternData.averageScore = this.calculateAverage(patternData.games.map(g => g.total_score));
    patternData.highScore = Math.max(patternData.highScore, gameData.total_score);
    patternData.lowScore = Math.min(patternData.lowScore, gameData.total_score);
    patternData.totalStrikes += gameData.strikes || 0;
    patternData.totalSpares += gameData.spares || 0;
    
    // Track ball usage
    if (gameData.ball_id) {
      patternData.ballsUsed[gameData.ball_id] = (patternData.ballsUsed[gameData.ball_id] || 0) + 1;
    }
    
    // Track preferred lines
    if (gameData.preferred_line) {
      patternData.preferredLines[gameData.preferred_line] = 
        (patternData.preferredLines[gameData.preferred_line] || 0) + 1;
    }
    
    this.savePerformanceData();
    
    return {
      patternData,
      performanceScore,
      recommendations: this.generateRecommendations(patternId, gameData)
    };
  }

  // Calculate performance score based on pattern characteristics
  calculatePerformanceScore(gameData, pattern) {
    if (!pattern) return 0;
    
    const factors = pattern.performance_factors;
    const normalizedScore = gameData.total_score / 300; // Normalize to 0-1
    const normalizedAccuracy = (10 - (gameData.opens || 0)) / 10; // Fewer opens = better accuracy
    const normalizedPower = (gameData.strikes || 0) / 10; // More strikes = more power
    const normalizedConsistency = this.calculateConsistencyScore(gameData);
    
    return (
      (normalizedScore * 0.4) + 
      (normalizedAccuracy * factors.accuracy_weight) +
      (normalizedPower * factors.power_weight) +
      (normalizedConsistency * factors.consistency_weight)
    ) * 100;
  }

  // Calculate consistency score from frame data
  calculateConsistencyScore(gameData) {
    if (!gameData.frames) return 0.5;
    
    const frameScores = gameData.frames.map(frame => frame.score || 0);
    const average = frameScores.reduce((sum, score) => sum + score, 0) / frameScores.length;
    const variance = frameScores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / frameScores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - (standardDeviation / average));
  }

  // Generate recommendations based on performance
  generateRecommendations(patternId, gameData) {
    const pattern = this.getPatternById(patternId);
    const patternData = this.performanceData[patternId];
    const recommendations = [];

    if (!pattern || !patternData) return recommendations;

    // Ball recommendation
    if (patternData.ballsUsed) {
      const bestBall = Object.entries(patternData.ballsUsed)
        .sort(([,a], [,b]) => b - a)[0];
      if (bestBall) {
        recommendations.push({
          type: 'ball',
          message: `Your most successful ball on this pattern has been Ball ID ${bestBall[0]}`,
          confidence: 'medium'
        });
      }
    }

    // Line recommendation based on pattern
    if (pattern.strategy) {
      recommendations.push({
        type: 'line',
        message: `Recommended line: ${pattern.strategy.recommended_line}`,
        confidence: 'high'
      });
    }

    // Performance-based recommendations
    const performanceScore = this.calculatePerformanceScore(gameData, pattern);
    if (performanceScore < 60) {
      recommendations.push({
        type: 'improvement',
        message: `Focus on ${pattern.difficulty === 'hard' ? 'accuracy and consistency' : 'power and carry'}`,
        confidence: 'medium'
      });
    }

    // Strike rate recommendation
    const strikeRate = (gameData.strikes || 0) / 10;
    if (strikeRate < 0.3 && pattern.type === 'house') {
      recommendations.push({
        type: 'technique',
        message: 'Consider increasing rev rate and targeting pocket more aggressively',
        confidence: 'medium'
      });
    }

    return recommendations;
  }

  // Get performance summary for a pattern
  getPatternPerformanceSummary(patternId) {
    const patternData = this.performanceData[patternId];
    const pattern = this.getPatternById(patternId);
    
    if (!patternData || !pattern) return null;

    const recentGames = patternData.games.slice(-5);
    const recentAverage = recentGames.length > 0 ? 
      this.calculateAverage(recentGames.map(g => g.total_score)) : 0;

    return {
      pattern,
      totalGames: patternData.totalGames,
      averageScore: patternData.averageScore,
      recentAverage,
      highScore: patternData.highScore,
      lowScore: patternData.lowScore === 999 ? 0 : patternData.lowScore,
      improvement: recentAverage - patternData.averageScore,
      strikeRate: patternData.totalGames > 0 ? 
        (patternData.totalStrikes / (patternData.totalGames * 10)) * 100 : 0,
      spareRate: patternData.totalGames > 0 ? 
        (patternData.totalSpares / (patternData.totalGames * 10)) * 100 : 0,
      averagePerformanceScore: patternData.games.length > 0 ?
        this.calculateAverage(patternData.games.map(g => g.performanceScore || 0)) : 0
    };
  }

  // Get all pattern performance summaries
  getAllPatternSummaries() {
    return Object.keys(this.performanceData).map(patternId => 
      this.getPatternPerformanceSummary(patternId)
    ).filter(summary => summary !== null);
  }

  // Find best and worst performing patterns
  getPerformanceRankings() {
    const summaries = this.getAllPatternSummaries();
    
    return {
      bestByAverage: summaries.sort((a, b) => b.averageScore - a.averageScore),
      bestByImprovement: summaries.sort((a, b) => b.improvement - a.improvement),
      mostPlayed: summaries.sort((a, b) => b.totalGames - a.totalGames)
    };
  }

  // Calculate average helper
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  // Get pattern difficulty distribution
  getDifficultyDistribution() {
    const allPatterns = this.getAllPatterns();
    const distribution = {
      easy: 0,
      'easy-medium': 0,
      medium: 0,
      'medium-hard': 0,
      hard: 0,
      'very-hard': 0
    };

    allPatterns.forEach(pattern => {
      distribution[pattern.difficulty]++;
    });

    return distribution;
  }

  // Search patterns by characteristics
  searchPatterns(criteria) {
    const allPatterns = this.getAllPatterns();
    
    return allPatterns.filter(pattern => {
      if (criteria.difficulty && pattern.difficulty !== criteria.difficulty) return false;
      if (criteria.type && pattern.type !== criteria.type) return false;
      if (criteria.length && Math.abs(pattern.length - criteria.length) > 2) return false;
      if (criteria.backend && pattern.characteristics.backend !== criteria.backend) return false;
      
      return true;
    });
  }
}

// Export singleton instance
export const oilPatternAnalyzer = new OilPatternAnalyzer();