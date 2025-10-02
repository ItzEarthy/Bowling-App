/**
 * Achievement Handler
 * Centralized system for checking and awarding achievements automatically
 */

import { AchievementEngine } from './achievementEngine';
import { userAPI } from '../lib/api';

class AchievementHandler {
  constructor() {
    this.engine = new AchievementEngine();
    this.listeners = [];
    this.isInitialized = false;
  }

  /**
   * Initialize the achievement handler with user data
   */
  async initialize(userId) {
    try {
      // Load user's current achievements
      const achievementsResponse = await userAPI.getAchievements();
      const userAchievements = achievementsResponse.data.achievements || [];
      
      // Load user stats from localStorage (will be calculated from games)
      const userStats = this.loadUserStats(userId);
      const streaks = this.loadStreaks(userId);
      
      // Initialize the engine
      this.engine.setUserData(userAchievements, userStats, streaks);
      this.isInitialized = true;
      
      return true;
    } catch (error) {
      console.error('Failed to initialize achievement handler:', error);
      return false;
    }
  }

  /**
   * Process a completed game and check for new achievements
   */
  async processGame(gameData) {
    if (!this.isInitialized) {
      console.warn('Achievement handler not initialized');
      return { newAchievements: [], success: false };
    }

    try {
      // Process the game through the achievement engine
      const newAchievements = this.engine.processGame(gameData);
      
      // If there are new achievements, save them to the backend
      if (newAchievements.length > 0) {
        await this.saveNewAchievements(newAchievements);
        
        // Notify all listeners about new achievements
        this.notifyListeners(newAchievements);
        
        // Save updated stats to localStorage
        this.saveUserStats(gameData.user_id);
      }
      
      // Always save stats after processing a game
      this.saveUserStats(gameData.user_id);
      this.saveStreaks(gameData.user_id);
      
      return {
        newAchievements,
        success: true,
        stats: this.engine.getAchievementSummary()
      };
    } catch (error) {
      console.error('Failed to process game achievements:', error);
      return { newAchievements: [], success: false, error };
    }
  }

  /**
   * Save new achievements to the backend
   */
  async saveNewAchievements(achievements) {
    try {
      // Save each achievement to the backend
      const savePromises = achievements.map(achievement => {
        return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/me/achievements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            achievement_id: achievement.id,
            date_earned: new Date().toISOString()
          })
        });
      });
      
      await Promise.all(savePromises);
      return true;
    } catch (error) {
      console.error('Failed to save achievements to backend:', error);
      return false;
    }
  }

  /**
   * Add a listener for achievement events
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners about new achievements
   */
  notifyListeners(newAchievements) {
    this.listeners.forEach(listener => {
      try {
        listener(newAchievements);
      } catch (error) {
        console.error('Achievement listener error:', error);
      }
    });
  }

  /**
   * Get current achievement stats
   */
  getStats() {
    return this.engine.getAchievementSummary();
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory() {
    return this.engine.getAchievementsByCategory();
  }

  /**
   * Get recent achievements
   */
  getRecentAchievements(days = 30) {
    return this.engine.getRecentAchievements(days);
  }

  /**
   * Load user stats from localStorage
   */
  loadUserStats(userId) {
    const key = `achievement_stats_${userId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Save user stats to localStorage
   */
  saveUserStats(userId) {
    const key = `achievement_stats_${userId}`;
    const stats = this.engine.userStats;
    
    // Convert Sets to Arrays for storage
    const storableStats = { ...stats };
    if (stats.uniqueVenues instanceof Set) {
      storableStats.uniqueVenues = Array.from(stats.uniqueVenues);
    }
    if (stats.activeMonths instanceof Set) {
      storableStats.activeMonths = Array.from(stats.activeMonths);
    }
    
    localStorage.setItem(key, JSON.stringify(storableStats));
  }

  /**
   * Load streaks from localStorage
   */
  loadStreaks(userId) {
    const key = `achievement_streaks_${userId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Save streaks to localStorage
   */
  saveStreaks(userId) {
    const key = `achievement_streaks_${userId}`;
    const streaks = this.engine.streaks;
    localStorage.setItem(key, JSON.stringify(streaks));
  }

  /**
   * Bulk process multiple games (useful for initial sync)
   */
  async bulkProcessGames(games) {
    const allNewAchievements = [];
    
    for (const game of games) {
      const result = await this.processGame(game);
      if (result.success && result.newAchievements.length > 0) {
        allNewAchievements.push(...result.newAchievements);
      }
    }
    
    return {
      newAchievements: allNewAchievements,
      success: true
    };
  }

  /**
   * Force refresh achievements from backend
   */
  async refreshAchievements() {
    try {
      const achievementsResponse = await userAPI.getAchievements();
      const userAchievements = achievementsResponse.data.achievements || [];
      
      // Update engine with fresh data
      const userStats = this.loadUserStats();
      const streaks = this.loadStreaks();
      this.engine.setUserData(userAchievements, userStats, streaks);
      
      return true;
    } catch (error) {
      console.error('Failed to refresh achievements:', error);
      return false;
    }
  }
}

// Export singleton instance
export const achievementHandler = new AchievementHandler();
export default achievementHandler;
