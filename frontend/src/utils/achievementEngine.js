/**
 * Achievement Engine
 * Processes game data and awards achievements
 */

import { ACHIEVEMENTS, getAchievementById } from '../data/achievements.js';

export class AchievementEngine {
  constructor() {
    this.userAchievements = new Map(); // achievementId -> { dateEarned, progress }
    this.userStats = {};
    this.streaks = {};
  }

  // Initialize with user data
  setUserData(achievements = [], stats = {}, streaks = {}) {
    this.userAchievements.clear();
    achievements.forEach(achievement => {
      this.userAchievements.set(achievement.achievement_id, {
        dateEarned: achievement.date_earned,
        progress: achievement.progress || 100
      });
    });
    this.userStats = { ...stats };
    this.streaks = { ...streaks };
  }

  // Check if user has achievement
  hasAchievement(achievementId) {
    return this.userAchievements.has(achievementId);
  }

  // Get achievement progress (0-100)
  getAchievementProgress(achievementId) {
    const userAchievement = this.userAchievements.get(achievementId);
    if (userAchievement && userAchievement.dateEarned) {
      return 100; // Completed
    }
    return userAchievement?.progress || 0;
  }

  // Process a game and return newly earned achievements
  processGame(gameData) {
    const newAchievements = [];
    
    // Update stats based on game
    this.updateStatsFromGame(gameData);
    
    // Check all achievements
    for (const achievement of ACHIEVEMENTS) {
      if (!this.hasAchievement(achievement.id)) {
        const { earned, progress } = this.checkAchievement(achievement, gameData);
        
        if (earned) {
          this.userAchievements.set(achievement.id, {
            dateEarned: new Date().toISOString(),
            progress: 100
          });
          newAchievements.push(achievement);
        } else if (progress > 0) {
          // Update progress for incomplete achievements
          this.userAchievements.set(achievement.id, {
            dateEarned: null,
            progress: Math.min(progress, 99) // Don't set to 100 unless earned
          });
        }
      }
    }
    
    return newAchievements;
  }

  // Update user stats from game data
  updateStatsFromGame(gameData) {
    // Basic game stats
    this.userStats.gamesPlayed = (this.userStats.gamesPlayed || 0) + 1;
    this.userStats.totalScore = (this.userStats.totalScore || 0) + (gameData.total_score || 0);
    this.userStats.totalStrikes = (this.userStats.totalStrikes || 0) + (gameData.strikes || 0);
    this.userStats.totalSpares = (this.userStats.totalSpares || 0) + (gameData.spares || 0);
    this.userStats.totalPinsKnocked = (this.userStats.totalPinsKnocked || 0) + this.calculatePinsKnocked(gameData);
    
    // High score tracking
    if (!this.userStats.highScore || gameData.total_score > this.userStats.highScore) {
      this.userStats.highScore = gameData.total_score;
    }

    // Perfect games
    if (gameData.total_score === 300) {
      this.userStats.perfectGames = (this.userStats.perfectGames || 0) + 1;
    }

    // Clean games (all strikes and spares)
    if (this.isCleanGame(gameData)) {
      this.userStats.cleanGames = (this.userStats.cleanGames || 0) + 1;
    }

    // Calculate average
    this.userStats.average = this.userStats.totalScore / this.userStats.gamesPlayed;

    // Update streaks
    this.updateStreaks(gameData);

    // Location tracking
    if (gameData.location) {
      this.userStats.uniqueVenues = this.userStats.uniqueVenues || new Set();
      this.userStats.uniqueVenues.add(gameData.location);
    }

    // Time-based stats
    const gameDate = new Date(gameData.created_at || Date.now());
    const hour = gameDate.getHours();
    
    if (hour < 10) {
      this.userStats.earlyMorningGames = (this.userStats.earlyMorningGames || 0) + 1;
    }
    if (hour >= 22) {
      this.userStats.lateNightGames = (this.userStats.lateNightGames || 0) + 1;
    }

    // Activity tracking
    this.updateActivityStats(gameDate);
  }

  // Check if a specific achievement is earned
  checkAchievement(achievement, gameData) {
    const condition = achievement.condition;
    let earned = false;
    let progress = 0;

    switch (condition.type) {
      case 'single_game_score':
        earned = gameData.total_score >= condition.value;
        progress = Math.min((gameData.total_score / condition.value) * 100, 100);
        break;

      case 'strike_count':
        earned = (gameData.strikes || 0) >= condition.value;
        progress = Math.min(((gameData.strikes || 0) / condition.value) * 100, 100);
        break;

      case 'games_played':
        earned = this.userStats.gamesPlayed >= condition.value;
        progress = Math.min((this.userStats.gamesPlayed / condition.value) * 100, 100);
        break;

      case 'total_strikes':
        earned = this.userStats.totalStrikes >= condition.value;
        progress = Math.min((this.userStats.totalStrikes / condition.value) * 100, 100);
        break;

      case 'total_spares':
        earned = this.userStats.totalSpares >= condition.value;
        progress = Math.min((this.userStats.totalSpares / condition.value) * 100, 100);
        break;

      case 'total_pins_knocked':
        earned = this.userStats.totalPinsKnocked >= condition.value;
        progress = Math.min((this.userStats.totalPinsKnocked / condition.value) * 100, 100);
        break;

      case 'perfect_games':
        earned = this.userStats.perfectGames >= condition.value;
        progress = Math.min(((this.userStats.perfectGames || 0) / condition.value) * 100, 100);
        break;

      case 'consecutive_strikes':
        const currentStreak = this.getConsecutiveStrikes(gameData);
        earned = currentStreak >= condition.value;
        progress = Math.min((currentStreak / condition.value) * 100, 100);
        break;

      case 'spares_in_game':
        earned = (gameData.spares || 0) >= condition.value;
        progress = Math.min(((gameData.spares || 0) / condition.value) * 100, 100);
        break;

      case 'clean_game':
        earned = this.isCleanGame(gameData);
        progress = earned ? 100 : 0;
        break;

      case 'average_over_games':
        if (this.userStats.gamesPlayed >= condition.games) {
          earned = this.userStats.average >= condition.average;
          progress = Math.min((this.userStats.average / condition.average) * 100, 100);
        }
        break;

      case 'strike_streak':
        earned = (this.streaks.strikeStreak || 0) >= condition.value;
        progress = Math.min(((this.streaks.strikeStreak || 0) / condition.value) * 100, 100);
        break;

      case 'spare_streak':
        earned = (this.streaks.spareStreak || 0) >= condition.value;
        progress = Math.min(((this.streaks.spareStreak || 0) / condition.value) * 100, 100);
        break;

      case 'improving_game_streak':
        earned = (this.streaks.improvingGameStreak || 0) >= condition.value;
        progress = Math.min(((this.streaks.improvingGameStreak || 0) / condition.value) * 100, 100);
        break;

      case 'daily_streak':
        earned = (this.streaks.dailyStreak || 0) >= condition.value;
        progress = Math.min(((this.streaks.dailyStreak || 0) / condition.value) * 100, 100);
        break;

      case 'unique_venues':
        const venueCount = this.userStats.uniqueVenues ? this.userStats.uniqueVenues.size : 0;
        earned = venueCount >= condition.value;
        progress = Math.min((venueCount / condition.value) * 100, 100);
        break;

      case 'early_morning_games':
        earned = (this.userStats.earlyMorningGames || 0) >= condition.value;
        progress = Math.min(((this.userStats.earlyMorningGames || 0) / condition.value) * 100, 100);
        break;

      case 'late_night_games':
        earned = (this.userStats.lateNightGames || 0) >= condition.value;
        progress = Math.min(((this.userStats.lateNightGames || 0) / condition.value) * 100, 100);
        break;

      case 'months_active':
        const monthsActive = this.calculateMonthsActive();
        earned = monthsActive >= condition.value;
        progress = Math.min((monthsActive / condition.value) * 100, 100);
        break;

      // Special achievements
      case 'birthday_strike':
        earned = this.checkBirthdayStrike(gameData);
        progress = earned ? 100 : 0;
        break;

      case 'palindrome_score':
        earned = this.isPalindromeScore(gameData.total_score);
        progress = earned ? 100 : 0;
        break;

      case 'fibonacci_score':
        earned = this.isFibonacciScore(gameData.total_score);
        progress = earned ? 100 : 0;
        break;

      default:
        // Default case for unsupported achievement types
        break;
    }

    return { earned, progress };
  }

  // Helper methods
  calculatePinsKnocked(gameData) {
    if (gameData.frames && Array.isArray(gameData.frames)) {
      return gameData.frames.reduce((total, frame) => {
        if (frame.throws && Array.isArray(frame.throws)) {
          return total + frame.throws.reduce((frameTotal, throwData) => {
            return frameTotal + (throwData.pins_knocked || 0);
          }, 0);
        }
        return total;
      }, 0);
    }
    return 0;
  }

  isCleanGame(gameData) {
    if (!gameData.frames || !Array.isArray(gameData.frames)) return false;
    
    for (let i = 0; i < Math.min(10, gameData.frames.length); i++) {
      const frame = gameData.frames[i];
      if (!frame.throws || !Array.isArray(frame.throws)) return false;
      
      const totalPins = frame.throws.reduce((sum, throwData) => sum + (throwData.pins_knocked || 0), 0);
      if (totalPins < 10) return false; // Open frame
    }
    return true;
  }

  getConsecutiveStrikes(gameData) {
    let maxStreak = 0;
    let currentStreak = 0;
    
    if (gameData.frames && Array.isArray(gameData.frames)) {
      for (const frame of gameData.frames) {
        if (frame.throws && frame.throws.length > 0 && frame.throws[0].pins_knocked === 10) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
    }
    
    return maxStreak;
  }

  updateStreaks(gameData) {
    // Strike streak
    if (gameData.strikes > 0) {
      this.streaks.strikeStreak = (this.streaks.strikeStreak || 0) + gameData.strikes;
    } else if (gameData.strikes === 0) {
      this.streaks.strikeStreak = 0;
    }

    // Spare streak
    if (gameData.spares > 0) {
      this.streaks.spareStreak = (this.streaks.spareStreak || 0) + gameData.spares;
    } else if (gameData.spares === 0) {
      this.streaks.spareStreak = 0;
    }

    // Improving game streak
    if (this.userStats.lastGameScore && gameData.total_score > this.userStats.lastGameScore) {
      this.streaks.improvingGameStreak = (this.streaks.improvingGameStreak || 0) + 1;
    } else {
      this.streaks.improvingGameStreak = 0;
    }
    this.userStats.lastGameScore = gameData.total_score;

    // Daily streak
    const today = new Date().toDateString();
    if (this.userStats.lastGameDate !== today) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      if (this.userStats.lastGameDate === yesterday) {
        this.streaks.dailyStreak = (this.streaks.dailyStreak || 0) + 1;
      } else {
        this.streaks.dailyStreak = 1;
      }
      this.userStats.lastGameDate = today;
    }
  }

  updateActivityStats(gameDate) {
    // Track months active
    const monthKey = `${gameDate.getFullYear()}-${gameDate.getMonth()}`;
    this.userStats.activeMonths = this.userStats.activeMonths || new Set();
    this.userStats.activeMonths.add(monthKey);

    // Track first game date
    if (!this.userStats.firstGameDate || gameDate < new Date(this.userStats.firstGameDate)) {
      this.userStats.firstGameDate = gameDate.toISOString();
    }
  }

  calculateMonthsActive() {
    return this.userStats.activeMonths ? this.userStats.activeMonths.size : 0;
  }

  checkBirthdayStrike(gameData) {
    // This would need user birthday data to implement properly
    // For now, return false
    return false;
  }

  isPalindromeScore(score) {
    const scoreStr = score.toString();
    return scoreStr === scoreStr.split('').reverse().join('');
  }

  isFibonacciScore(score) {
    const fibNumbers = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];
    return fibNumbers.includes(score);
  }

  // Get user's achievement summary
  getAchievementSummary() {
    const total = ACHIEVEMENTS.length;
    const earned = this.userAchievements.size;
    const totalPoints = Array.from(this.userAchievements.entries())
      .filter(([_, data]) => data.dateEarned)
      .reduce((sum, [achievementId, _]) => {
        const achievement = getAchievementById(achievementId);
        return sum + (achievement?.points || 0);
      }, 0);

    return {
      total,
      earned,
      percentage: (earned / total) * 100,
      totalPoints,
      userStats: this.userStats,
      streaks: this.streaks
    };
  }

  // Get achievements by category with progress
  getAchievementsByCategory() {
    const categories = {};
    
    for (const achievement of ACHIEVEMENTS) {
      if (!categories[achievement.category]) {
        categories[achievement.category] = [];
      }
      
      categories[achievement.category].push({
        ...achievement,
        earned: this.hasAchievement(achievement.id),
        progress: this.getAchievementProgress(achievement.id),
        dateEarned: this.userAchievements.get(achievement.id)?.dateEarned
      });
    }
    
    return categories;
  }

  // Get recent achievements (last 30 days)
  getRecentAchievements(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return Array.from(this.userAchievements.entries())
      .filter(([_, data]) => {
        return data.dateEarned && new Date(data.dateEarned) > cutoffDate;
      })
      .map(([achievementId, data]) => ({
        ...getAchievementById(achievementId),
        dateEarned: data.dateEarned
      }))
      .sort((a, b) => new Date(b.dateEarned) - new Date(a.dateEarned));
  }
}

export default AchievementEngine;