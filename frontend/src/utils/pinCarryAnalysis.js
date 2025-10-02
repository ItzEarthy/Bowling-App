/**
 * Pin Carry Analysis System
 * Analyze pin patterns, carry percentage, and provide improvement suggestions
 */

export const PIN_PATTERNS = {
  // Common pin leave patterns and their characteristics
  splits: {
    '7-10': { name: '7-10 Split', difficulty: 'impossible', conversion_rate: 0.1, advice: 'Aim for corner pin deflection' },
    '4-6': { name: '4-6 Split', difficulty: 'very_hard', conversion_rate: 5, advice: 'Hit the 4 pin thin to slide into 6' },
    '8-10': { name: '8-10 Split', difficulty: 'very_hard', conversion_rate: 8, advice: 'Hit the 8 pin on the right side' },
    '7-9': { name: '7-9 Split', difficulty: 'very_hard', conversion_rate: 7, advice: 'Hit the 7 pin on the left side' },
    '6-10': { name: '6-10 Split', difficulty: 'hard', conversion_rate: 15, advice: 'Strike the 6 pin straight on' },
    '4-7': { name: '4-7 Split', difficulty: 'hard', conversion_rate: 18, advice: 'Hit the 4 pin firmly' },
    '2-7': { name: '2-7 Split', difficulty: 'medium', conversion_rate: 35, advice: 'Aim at the 2 pin pocket' },
    '3-10': { name: '3-10 Split', difficulty: 'medium', conversion_rate: 32, advice: 'Hit the 3 pin on left side' }
  },
  
  single_pins: {
    '10': { name: '10 Pin', difficulty: 'easy', conversion_rate: 85, advice: 'Straight ball or slight hook' },
    '7': { name: '7 Pin', difficulty: 'easy', conversion_rate: 87, advice: 'Straight line approach' },
    '4': { name: '4 Pin', difficulty: 'easy', conversion_rate: 90, advice: 'Standard spare approach' },
    '6': { name: '6 Pin', difficulty: 'easy', conversion_rate: 88, advice: 'Move right, throw straight' },
    '2': { name: '2 Pin', difficulty: 'very_easy', conversion_rate: 95, advice: 'Simple straight shot' },
    '3': { name: '3 Pin', difficulty: 'very_easy', conversion_rate: 94, advice: 'Aim for pocket hit' }
  },
  
  multiple_pins: {
    '2-8': { name: '2-8 Spare', difficulty: 'easy', conversion_rate: 80, advice: 'Hit the 2 pin straight' },
    '3-6-10': { name: '3-6-10', difficulty: 'medium', conversion_rate: 45, advice: 'Strike the 3 pin firmly' },
    '2-4-5': { name: '2-4-5', difficulty: 'easy', conversion_rate: 75, advice: 'Hit the 2 pin on the right' },
    '1-2-4': { name: '1-2-4', difficulty: 'easy', conversion_rate: 78, advice: 'Standard pocket spare' },
    '6-7-10': { name: '6-7-10', difficulty: 'hard', conversion_rate: 25, advice: 'Hit the 6 pin thin' }
  }
};

export const CARRY_PATTERNS = {
  // Different carry scenarios and their characteristics
  light_hits: {
    high_flush: { name: 'High Flush Hit', carry_percentage: 95, description: 'Ball hits head pin directly' },
    light_pocket: { name: 'Light Pocket', carry_percentage: 85, description: 'Light hit on 1-3 pocket' },
    high_hit: { name: 'High Hit', carry_percentage: 70, description: 'Ball hits too high on head pin' }
  },
  
  heavy_hits: {
    heavy_pocket: { name: 'Heavy Pocket', carry_percentage: 75, description: 'Heavy hit on 1-3 pocket' },
    brooklyn: { name: 'Brooklyn Hit', carry_percentage: 60, description: 'Ball crosses to 1-2 pocket' },
    nose_hit: { name: 'Nose Hit', carry_percentage: 45, description: 'Direct hit on head pin' }
  },
  
  off_hits: {
    weak_hit: { name: 'Weak Hit', carry_percentage: 30, description: 'Insufficient power or angle' },
    deflection: { name: 'Ball Deflection', carry_percentage: 40, description: 'Ball deflects off pins' },
    late_hook: { name: 'Late Hook', carry_percentage: 55, description: 'Ball hooks too late' }
  }
};

export class PinCarryAnalyzer {
  constructor() {
    this.carryData = this.loadCarryData();
    this.pinPatterns = PIN_PATTERNS;
    this.carryPatterns = CARRY_PATTERNS;
  }

  // Load carry analysis data
  loadCarryData() {
    const stored = localStorage.getItem('pin-carry-data');
    return stored ? JSON.parse(stored) : {};
  }

  // Save carry data
  saveCarryData() {
    localStorage.setItem('pin-carry-data', JSON.stringify(this.carryData));
  }

  // Initialize carry tracking for a user
  initializeCarryTracking(userId) {
    if (!this.carryData[userId]) {
      this.carryData[userId] = {
        total_first_balls: 0,
        total_strikes: 0,
        total_spares: 0,
        total_opens: 0,
        carry_percentage: 0,
        pin_leave_frequency: {},
        carry_patterns: {},
        ball_reaction_data: {},
        improvement_areas: [],
        last_analysis: null
      };
      this.saveCarryData();
    }
    return this.carryData[userId];
  }

  // Record first ball data
  recordFirstBall(userId, ballData) {
    const userData = this.initializeCarryTracking(userId);
    
    userData.total_first_balls++;

    // Track strike
    if (ballData.isStrike) {
      userData.total_strikes++;
    }

    // Update carry percentage
    userData.carry_percentage = (userData.total_strikes / userData.total_first_balls) * 100;

    // Analyze first ball carry
    const carryInfo = this.analyzeFirstBallCarry(ballData.pinsKnocked, {
      pins_hit: ballData.pinsHit,
      remaining_pins: ballData.remainingPins
    });

    // Track carry patterns
    if (carryInfo.pattern) {
      userData.carry_patterns[carryInfo.pattern] = 
        (userData.carry_patterns[carryInfo.pattern] || 0) + 1;
    }

    this.saveCarryData();
    
    return carryInfo;
  }

  // Record second ball data
  recordSecondBall(userId, ballData) {
    const userData = this.initializeCarryTracking(userId);

    // Track spare or open
    if (ballData.isSpare) {
      userData.total_spares++;
      // Track the leave pattern that was converted
      const leavePattern = this.identifyLeavePatternFromPins(ballData.leavePattern);
      if (leavePattern) {
        userData.pin_leave_frequency[leavePattern] = 
          (userData.pin_leave_frequency[leavePattern] || 0) + 1;
      }
    } else {
      userData.total_opens++;
      // Track missed spare pattern
      const leavePattern = this.identifyLeavePatternFromPins(ballData.leavePattern);
      if (leavePattern) {
        const missedPattern = `missed_${leavePattern}`;
        userData.pin_leave_frequency[missedPattern] = 
          (userData.pin_leave_frequency[missedPattern] || 0) + 1;
      }
    }

    this.saveCarryData();
  }

  // Identify leave pattern from actual pin numbers
  identifyLeavePatternFromPins(pinsHit) {
    if (!pinsHit || pinsHit.length === 0) return null;

    const remainingPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(p => !pinsHit.includes(p));
    
    if (remainingPins.length === 0) return null;
    if (remainingPins.length === 1) {
      return remainingPins[0].toString();
    }
    
    // Sort pins for consistent pattern matching
    const sortedPins = remainingPins.sort((a, b) => a - b).join('-');
    
    // Check if it matches known patterns
    for (const category of Object.values(this.pinPatterns)) {
      if (category[sortedPins]) {
        return sortedPins;
      }
    }
    
    // Return the pin pattern even if not in our database
    return sortedPins;
  }

  // Analyze a single frame for pin carry
  analyzeFrame(userId, frameData) {
    const userData = this.initializeCarryTracking(userId);
    
    if (!frameData.throws || frameData.throws.length === 0) return;

    const firstThrow = frameData.throws[0];
    const secondThrow = frameData.throws[1] || 0;
    const totalPins = firstThrow + secondThrow;

    userData.total_first_balls++;

    // Analyze first ball carry
    const carryInfo = this.analyzeFirstBallCarry(firstThrow, frameData);
    
    // Track outcomes
    if (firstThrow === 10) {
      userData.total_strikes++;
    } else if (totalPins === 10) {
      userData.total_spares++;
      this.trackSparePattern(userData, firstThrow, frameData);
    } else {
      userData.total_opens++;
      this.trackOpenPattern(userData, firstThrow, secondThrow, frameData);
    }

    // Update carry percentage
    userData.carry_percentage = (userData.total_strikes / userData.total_first_balls) * 100;

    // Track carry patterns
    if (carryInfo.pattern) {
      userData.carry_patterns[carryInfo.pattern] = 
        (userData.carry_patterns[carryInfo.pattern] || 0) + 1;
    }

    // Track ball reaction data
    if (frameData.ball_reaction) {
      this.trackBallReaction(userData, frameData.ball_reaction);
    }

    this.saveCarryData();
    
    return {
      carryInfo,
      updatedStats: userData,
      recommendations: this.generateCarryRecommendations(userData, carryInfo)
    };
  }

  // Analyze first ball carry characteristics
  analyzeFirstBallCarry(pinsKnocked, frameData = {}) {
    let carryType = 'unknown';
    let carryPercentage = 0;
    let pattern = null;

    // Determine carry type based on pins knocked down
    if (pinsKnocked === 10) {
      carryType = 'strike';
      carryPercentage = 100;
      pattern = this.determineStrikePattern(frameData);
    } else if (pinsKnocked >= 8) {
      carryType = 'high_carry';
      carryPercentage = 85;
      pattern = 'good_carry';
    } else if (pinsKnocked >= 6) {
      carryType = 'medium_carry';
      carryPercentage = 65;
      pattern = 'average_carry';
    } else if (pinsKnocked >= 4) {
      carryType = 'low_carry';
      carryPercentage = 45;
      pattern = 'poor_carry';
    } else {
      carryType = 'very_low_carry';
      carryPercentage = 25;
      pattern = 'very_poor_carry';
    }

    return {
      type: carryType,
      percentage: carryPercentage,
      pattern: pattern,
      pins_knocked: pinsKnocked,
      analysis: this.getCarryAnalysis(carryType, pinsKnocked)
    };
  }

  // Determine strike pattern type
  determineStrikePattern(frameData) {
    // In a real implementation, this would analyze ball path, entry angle, etc.
    const patterns = ['flush_strike', 'light_pocket', 'heavy_pocket', 'messenger_strike'];
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  // Track spare patterns
  trackSparePattern(userData, firstThrow, frameData) {
    const pinsLeft = 10 - firstThrow;
    const leavePattern = this.identifyLeavePattern(firstThrow, frameData.pin_layout);
    
    if (leavePattern) {
      userData.pin_leave_frequency[leavePattern] = 
        (userData.pin_leave_frequency[leavePattern] || 0) + 1;
    }
  }

  // Track open (missed spare) patterns
  trackOpenPattern(userData, firstThrow, secondThrow, frameData) {
    const totalKnocked = firstThrow + secondThrow;
    const missedPins = 10 - totalKnocked;
    const leavePattern = this.identifyLeavePattern(firstThrow, frameData.pin_layout);
    
    if (leavePattern) {
      const missedPattern = `missed_${leavePattern}`;
      userData.pin_leave_frequency[missedPattern] = 
        (userData.pin_leave_frequency[missedPattern] || 0) + 1;
    }
  }

  // Identify pin leave pattern
  identifyLeavePattern(firstThrow, pinLayout = null) {
    // This would analyze the actual pin layout in a real implementation
    // For now, we'll simulate based on common patterns
    
    const remainingPins = 10 - firstThrow;
    
    if (remainingPins === 1) {
      // Single pin leaves
      const singlePins = ['10', '7', '4', '6', '2', '3'];
      return singlePins[Math.floor(Math.random() * singlePins.length)];
    } else if (remainingPins === 2) {
      // Common splits and two-pin spares
      const twoPinLeaves = ['7-10', '4-6', '2-8', '3-10', '6-10'];
      return twoPinLeaves[Math.floor(Math.random() * twoPinLeaves.length)];
    } else if (remainingPins >= 3) {
      // Multiple pin leaves
      const multipleLeaves = ['2-4-5', '3-6-10', '1-2-4', '6-7-10'];
      return multipleLeaves[Math.floor(Math.random() * multipleLeaves.length)];
    }
    
    return null;
  }

  // Track ball reaction data
  trackBallReaction(userData, reactionData) {
    const reactionTypes = ['early_hook', 'late_hook', 'smooth_arc', 'sharp_backend'];
    
    reactionTypes.forEach(type => {
      if (reactionData[type]) {
        userData.ball_reaction_data[type] = 
          (userData.ball_reaction_data[type] || 0) + 1;
      }
    });
  }

  // Get carry analysis description
  getCarryAnalysis(carryType, pinsKnocked) {
    const analyses = {
      strike: 'Excellent carry - all pins down on first ball',
      high_carry: `Good carry with ${pinsKnocked} pins - solid hit`,
      medium_carry: `Average carry with ${pinsKnocked} pins - room for improvement`,
      low_carry: `Poor carry with ${pinsKnocked} pins - check ball reaction`,
      very_low_carry: `Very poor carry with ${pinsKnocked} pins - major adjustments needed`
    };
    
    return analyses[carryType] || 'Unknown carry pattern';
  }

  // Generate carry improvement recommendations
  generateCarryRecommendations(userData, carryInfo) {
    const recommendations = [];
    
    // Overall carry percentage recommendations
    if (userData.carry_percentage < 15) {
      recommendations.push({
        type: 'technique',
        priority: 'high',
        message: 'Focus on improving pocket accuracy and ball speed',
        details: 'Low carry percentage indicates fundamental technique issues'
      });
    } else if (userData.carry_percentage < 25) {
      recommendations.push({
        type: 'equipment',
        priority: 'medium',
        message: 'Consider ball surface adjustment or different ball reaction',
        details: 'Ball may not be creating proper entry angle'
      });
    }

    // Specific pattern recommendations
    const mostFrequentLeave = this.getMostFrequentLeave(userData);
    if (mostFrequentLeave) {
      const leaveInfo = this.getLeaveInfo(mostFrequentLeave.pattern);
      if (leaveInfo) {
        recommendations.push({
          type: 'spare_shooting',
          priority: 'medium',
          message: `Work on ${leaveInfo.name} spare conversion`,
          details: leaveInfo.advice
        });
      }
    }

    // Ball reaction recommendations
    const dominantReaction = this.getDominantBallReaction(userData);
    if (dominantReaction === 'early_hook') {
      recommendations.push({
        type: 'lane_play',
        priority: 'medium',
        message: 'Move left and play more direct line',
        details: 'Ball hooking too early, reducing carry'
      });
    } else if (dominantReaction === 'late_hook') {
      recommendations.push({
        type: 'lane_play',
        priority: 'medium',
        message: 'Move right and create more angle',
        details: 'Ball not hooking enough to create good entry angle'
      });
    }

    return recommendations;
  }

  // Get most frequent pin leave
  getMostFrequentLeave(userData) {
    const leaves = Object.entries(userData.pin_leave_frequency);
    if (leaves.length === 0) return null;
    
    return leaves.reduce((max, current) => 
      current[1] > max[1] ? { pattern: current[0], count: current[1] } : max,
      { pattern: leaves[0][0], count: leaves[0][1] }
    );
  }

  // Get leave pattern information
  getLeaveInfo(pattern) {
    // Check all pattern categories
    for (const category of Object.values(this.pinPatterns)) {
      if (category[pattern]) {
        return category[pattern];
      }
    }
    return null;
  }

  // Get dominant ball reaction
  getDominantBallReaction(userData) {
    const reactions = Object.entries(userData.ball_reaction_data);
    if (reactions.length === 0) return null;
    
    return reactions.reduce((max, current) => 
      current[1] > max[1] ? current[0] : max
    );
  }

  // Get comprehensive carry analysis
  getCarryAnalysis(userId) {
    const userData = this.carryData[userId];
    if (!userData) return null;

    const totalFrames = userData.total_first_balls;
    const strikeRate = totalFrames > 0 ? (userData.total_strikes / totalFrames) * 100 : 0;
    const spareRate = totalFrames > 0 ? (userData.total_spares / totalFrames) * 100 : 0;
    const openRate = totalFrames > 0 ? (userData.total_opens / totalFrames) * 100 : 0;

    // Calculate pin leave statistics
    const mostCommonLeaves = Object.entries(userData.pin_leave_frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pattern, count]) => ({
        pattern,
        count,
        percentage: (count / totalFrames) * 100,
        info: this.getLeaveInfo(pattern)
      }));

    // Calculate carry trends
    const carryTrend = this.calculateCarryTrend(userData);

    return {
      overall_stats: {
        total_frames: totalFrames,
        strike_rate: strikeRate,
        spare_rate: spareRate,
        open_rate: openRate,
        carry_percentage: userData.carry_percentage
      },
      pin_leaves: mostCommonLeaves,
      carry_patterns: userData.carry_patterns,
      ball_reaction: userData.ball_reaction_data,
      trends: carryTrend,
      recommendations: this.generateCarryRecommendations(userData, {}),
      improvement_areas: this.identifyImprovementAreas(userData)
    };
  }

  // Calculate carry trend
  calculateCarryTrend(userData) {
    // In a real implementation, this would analyze historical data
    return {
      direction: 'improving', // improving, declining, stable
      change_percentage: 2.5,
      period: 'last_10_games'
    };
  }

  // Identify improvement areas
  identifyImprovementAreas(userData) {
    const areas = [];
    
    if (userData.carry_percentage < 20) {
      areas.push({
        area: 'Pocket Accuracy',
        priority: 'high',
        description: 'Focus on hitting 1-3 pocket consistently'
      });
    }
    
    if (userData.total_opens > userData.total_spares) {
      areas.push({
        area: 'Spare Shooting',
        priority: 'high',
        description: 'Work on converting single pin and easy spares'
      });
    }
    
    const dominantReaction = this.getDominantBallReaction(userData);
    if (dominantReaction === 'early_hook' || dominantReaction === 'late_hook') {
      areas.push({
        area: 'Ball Reaction',
        priority: 'medium',
        description: 'Adjust ball surface or lane position for better reaction'
      });
    }
    
    return areas;
  }

  // Get pin carry visualization data
  getVisualizationData(userId) {
    const userData = this.carryData[userId];
    if (!userData) return null;

    return {
      carry_distribution: {
        strikes: userData.total_strikes,
        spares: userData.total_spares,
        opens: userData.total_opens
      },
      pin_leave_heatmap: userData.pin_leave_frequency,
      carry_trend_data: this.generateTrendData(userData),
      ball_reaction_chart: userData.ball_reaction_data
    };
  }

  // Generate trend data for visualization
  generateTrendData(userData) {
    // Mock trend data - in real implementation would be historical
    return Array.from({ length: 10 }, (_, i) => ({
      game: i + 1,
      carry_percentage: Math.max(0, userData.carry_percentage + (Math.random() - 0.5) * 10)
    }));
  }

  // Export carry analysis data
  exportCarryData(userId) {
    const analysis = this.getCarryAnalysis(userId);
    return {
      user_id: userId,
      carry_analysis: analysis,
      exported_at: new Date().toISOString(),
      export_version: '1.0'
    };
  }
}

// Export singleton instance
export const pinCarryAnalyzer = new PinCarryAnalyzer();