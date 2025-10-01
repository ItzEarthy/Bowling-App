/**
 * Streak Tracking System
 * Tracks various types of bowling streaks and achievements
 */

export class StreakTracker {
  constructor() {
    this.streaks = {
      // Scoring streaks
      strikes: { current: 0, best: 0, total: 0 },
      spares: { current: 0, best: 0, total: 0 },
      opens: { current: 0, best: 0, total: 0 }, // For tracking missed spares
      
      // Score-based streaks
      improving: { current: 0, best: 0, total: 0 }, // Games with improving scores
      consistent: { current: 0, best: 0, total: 0 }, // Games within 10 pins of average
      above150: { current: 0, best: 0, total: 0 },
      above175: { current: 0, best: 0, total: 0 },
      above200: { current: 0, best: 0, total: 0 },
      
      // Perfect/near-perfect streaks
      turkeys: { current: 0, best: 0, total: 0 }, // 3 strikes in a row
      fourBagger: { current: 0, best: 0, total: 0 }, // 4 strikes in a row
      fiveBagger: { current: 0, best: 0, total: 0 }, // 5 strikes in a row
      cleanGames: { current: 0, best: 0, total: 0 }, // No opens
      
      // Playing frequency streaks
      dailyPlay: { current: 0, best: 0, total: 0 }, // Consecutive days played
      weeklyPlay: { current: 0, best: 0, total: 0 }, // Consecutive weeks played
      
      // Improvement streaks
      personalBest: { current: 0, best: 0, total: 0 }, // Days since last PB
      seriesImproving: { current: 0, best: 0, total: 0 } // Consecutive improving series
    };
    
    this.notifications = [];
    this.milestones = this.initializeMilestones();
  }

  initializeMilestones() {
    return {
      strikes: [5, 10, 25, 50, 100],
      spares: [10, 25, 50, 100, 200],
      improving: [3, 5, 10, 15, 20],
      above150: [5, 10, 20, 30, 50],
      above200: [3, 5, 10, 15, 25],
      turkeys: [5, 10, 20, 30, 50],
      cleanGames: [3, 5, 10, 15, 25],
      dailyPlay: [7, 14, 30, 60, 100],
      weeklyPlay: [4, 8, 12, 24, 52]
    };
  }

  // Load streak data from storage
  loadStreaks() {
    const stored = localStorage.getItem('bowling-streaks');
    if (stored) {
      this.streaks = { ...this.streaks, ...JSON.parse(stored) };
    }
    return this.streaks;
  }

  // Save streak data to storage
  saveStreaks() {
    localStorage.setItem('bowling-streaks', JSON.stringify(this.streaks));
  }

  // Process a single frame for streak tracking
  processFrame(frameData, frameNumber) {
    const { firstBall, secondBall, thirdBall, isStrike, isSpare, isOpen } = frameData;
    
    // Track strikes
    if (isStrike) {
      this.updateStreak('strikes', true);
    } else {
      this.updateStreak('strikes', false);
    }

    // Track spares (only if not a strike)
    if (!isStrike) {
      if (isSpare) {
        this.updateStreak('spares', true);
      } else {
        this.updateStreak('spares', false);
      }
    }

    // Track opens
    if (isOpen) {
      this.updateStreak('opens', true);
    } else {
      this.updateStreak('opens', false);
    }
  }

  // Process a complete game for streak tracking
  processGame(gameData) {
    const { frames, total_score, previous_games = [] } = gameData;
    
    // Reset frame-level streaks for new game
    this.resetFrameStreaks();
    
    // Process each frame
    frames.forEach((frame, index) => {
      this.processFrame(frame, index + 1);
    });

    // Check for multi-strike patterns
    this.checkMultiStrikeStreaks(frames);
    
    // Check score-based streaks
    this.checkScoreStreaks(total_score, previous_games);
    
    // Check clean game streak
    const hasOpens = frames.some(frame => frame.isOpen);
    this.updateStreak('cleanGames', !hasOpens);
    
    // Check playing frequency
    this.checkPlayingFrequency(gameData.created_at);
    
    // Save updated streaks
    this.saveStreaks();
    
    // Generate notifications for new achievements
    this.generateNotifications();
    
    return {
      streaks: this.streaks,
      notifications: this.notifications
    };
  }

  // Reset frame-level streak counters for new game
  resetFrameStreaks() {
    // Don't reset the persistent counters, just internal frame tracking
    this.currentStrikeRun = 0;
    this.currentSpareRun = 0;
    this.currentOpenRun = 0;
  }

  // Check for turkey, four-bagger, etc.
  checkMultiStrikeStreaks(frames) {
    let consecutiveStrikes = 0;
    let maxConsecutiveStrikes = 0;
    
    frames.forEach(frame => {
      if (frame.isStrike) {
        consecutiveStrikes++;
        maxConsecutiveStrikes = Math.max(maxConsecutiveStrikes, consecutiveStrikes);
      } else {
        consecutiveStrikes = 0;
      }
    });

    // Update multi-strike streaks based on max consecutive
    if (maxConsecutiveStrikes >= 3) {
      this.updateStreak('turkeys', true);
    } else {
      this.updateStreak('turkeys', false);
    }

    if (maxConsecutiveStrikes >= 4) {
      this.updateStreak('fourBagger', true);
    } else {
      this.updateStreak('fourBagger', false);
    }

    if (maxConsecutiveStrikes >= 5) {
      this.updateStreak('fiveBagger', true);
    } else {
      this.updateStreak('fiveBagger', false);
    }
  }

  // Check score-based streaks
  checkScoreStreaks(currentScore, previousGames) {
    // Check improvement streak
    if (previousGames.length > 0) {
      const lastScore = previousGames[previousGames.length - 1].total_score;
      this.updateStreak('improving', currentScore > lastScore);
      
      // Check consistency (within 10 pins of recent average)
      const recentGames = previousGames.slice(-5);
      const averageScore = recentGames.reduce((sum, game) => sum + game.total_score, 0) / recentGames.length;
      const isConsistent = Math.abs(currentScore - averageScore) <= 10;
      this.updateStreak('consistent', isConsistent);
    }

    // Check score threshold streaks
    this.updateStreak('above150', currentScore >= 150);
    this.updateStreak('above175', currentScore >= 175);
    this.updateStreak('above200', currentScore >= 200);
  }

  // Check playing frequency streaks
  checkPlayingFrequency(gameDate) {
    const today = new Date(gameDate);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check daily play streak
    const lastPlayDate = localStorage.getItem('last-play-date');
    if (lastPlayDate) {
      const lastDate = new Date(lastPlayDate);
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        this.updateStreak('dailyPlay', true);
      } else if (daysDiff === 0) {
        // Same day, maintain streak
        // Don't update
      } else {
        // Streak broken
        this.updateStreak('dailyPlay', false);
      }
    } else {
      // First play
      this.updateStreak('dailyPlay', true);
    }
    
    localStorage.setItem('last-play-date', today.toISOString().split('T')[0]);
  }

  // Update a specific streak
  updateStreak(streakType, success) {
    if (!this.streaks[streakType]) return;
    
    const streak = this.streaks[streakType];
    
    if (success) {
      streak.current++;
      streak.total++;
      if (streak.current > streak.best) {
        streak.best = streak.current;
        this.checkMilestone(streakType, streak.current);
      }
    } else {
      streak.current = 0;
    }
  }

  // Check if a milestone has been reached
  checkMilestone(streakType, currentValue) {
    const milestones = this.milestones[streakType];
    if (!milestones) return;
    
    const reachedMilestone = milestones.find(milestone => milestone === currentValue);
    if (reachedMilestone) {
      this.notifications.push({
        id: Date.now() + Math.random(),
        type: 'milestone',
        streakType,
        value: reachedMilestone,
        message: this.getMilestoneMessage(streakType, reachedMilestone),
        timestamp: new Date().toISOString()
      });
    }
  }

  // Generate milestone messages
  getMilestoneMessage(streakType, value) {
    const messages = {
      strikes: {
        5: "🔥 Strike Master! 5 strikes in a row!",
        10: "⚡ Lightning Bowler! 10 consecutive strikes!",
        25: "🎯 Strike Legend! 25 strikes in a row!",
        50: "👑 Strike King/Queen! 50 consecutive strikes!",
        100: "🏆 Strike Immortal! 100 strikes in a row!"
      },
      improving: {
        3: "📈 On a Roll! 3 improving games!",
        5: "🚀 Momentum Builder! 5 improving games!",
        10: "⭐ Consistency Star! 10 improving games!",
        15: "🌟 Improvement Master! 15 improving games!",
        20: "🏅 Growth Champion! 20 improving games!"
      },
      above200: {
        3: "💯 High Roller! 3 games above 200!",
        5: "🎯 Elite Bowler! 5 games above 200!",
        10: "👑 200 Club Royalty! 10 games above 200!",
        15: "🏆 Scoring Machine! 15 games above 200!",
        25: "🌟 Bowling Superstar! 25 games above 200!"
      },
      dailyPlay: {
        7: "📅 Week Warrior! 7 days straight!",
        14: "🔥 Two Week Streak! Dedication!",
        30: "💪 Monthly Master! 30 days straight!",
        60: "🏆 Bowling Addict! 2 months daily!",
        100: "👑 Century Player! 100 days straight!"
      }
    };
    
    return messages[streakType]?.[value] || `🎉 Amazing! ${value} ${streakType} streak!`;
  }

  // Generate notifications for recent achievements
  generateNotifications() {
    // Notifications are added in checkMilestone
    // This method could be expanded to add other types of notifications
  }

  // Get current active streaks
  getActiveStreaks() {
    return Object.entries(this.streaks)
      .filter(([_, streak]) => streak.current > 0)
      .map(([type, streak]) => ({
        type,
        current: streak.current,
        best: streak.best,
        name: this.getStreakDisplayName(type)
      }))
      .sort((a, b) => b.current - a.current);
  }

  // Get best streaks of all time
  getBestStreaks() {
    return Object.entries(this.streaks)
      .map(([type, streak]) => ({
        type,
        best: streak.best,
        total: streak.total,
        name: this.getStreakDisplayName(type)
      }))
      .sort((a, b) => b.best - a.best);
  }

  // Get display name for streak type
  getStreakDisplayName(type) {
    const names = {
      strikes: 'Consecutive Strikes',
      spares: 'Consecutive Spares',
      opens: 'Consecutive Opens',
      improving: 'Improving Games',
      consistent: 'Consistent Games',
      above150: 'Games Above 150',
      above175: 'Games Above 175',
      above200: 'Games Above 200',
      turkeys: 'Turkey Games',
      fourBagger: 'Four-Bagger Games',
      fiveBagger: 'Five-Bagger Games',
      cleanGames: 'Clean Games',
      dailyPlay: 'Daily Play Days',
      weeklyPlay: 'Weekly Play Weeks',
      personalBest: 'Days Since PB',
      seriesImproving: 'Improving Series'
    };
    
    return names[type] || type;
  }

  // Reset all streaks (admin function)
  resetAllStreaks() {
    Object.keys(this.streaks).forEach(key => {
      this.streaks[key] = { current: 0, best: 0, total: 0 };
    });
    this.saveStreaks();
  }

  // Get streak statistics for display
  getStreakStats() {
    const activeCount = this.getActiveStreaks().length;
    const totalBest = Object.values(this.streaks).reduce((sum, streak) => sum + streak.best, 0);
    const longestStreak = Math.max(...Object.values(this.streaks).map(s => s.best));
    
    return {
      activeStreaks: activeCount,
      totalBestCombined: totalBest,
      longestSingleStreak: longestStreak,
      totalAchievements: this.notifications.length
    };
  }
}

// Export singleton instance
export const streakTracker = new StreakTracker();