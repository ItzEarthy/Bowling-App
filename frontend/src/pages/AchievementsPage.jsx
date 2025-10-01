import React, { useState, useEffect } from 'react';
import { Trophy, Award, Star, Target, Zap, Users, Settings, Calendar, Activity, Crown } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { 
  ACHIEVEMENTS, 
  ACHIEVEMENT_CATEGORIES, 
  ACHIEVEMENT_RARITIES,
  getAchievementsByCategory,
  getAchievementsByRarity,
  getRarityColor,
  getCategoryColor 
} from '../data/achievements';
import { AchievementEngine } from '../utils/achievementEngine';
import { gameAPI, userAPI } from '../lib/api';

/**
 * Achievements Page Component
 * Displays all achievements with progress tracking and categories
 */
const AchievementsPage = () => {
  const [achievements, setAchievements] = useState({});
  const [userAchievements, setUserAchievements] = useState([]);
  const [achievementEngine, setAchievementEngine] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadAchievementData();
  }, []);

  const loadAchievementData = async () => {
    try {
      setIsLoading(true);
      
      // Load user achievements and stats
      const [achievementsResponse, gamesResponse] = await Promise.all([
        userAPI.getAchievements().catch(() => ({ data: { achievements: [] } })),
        gameAPI.getGames(1, 1000).catch(() => ({ data: { games: [] } }))
      ]);

      const userAchievements = achievementsResponse.data.achievements || [];
      const games = gamesResponse.data.games || [];

      // Initialize achievement engine
      const engine = new AchievementEngine();
      
      // Calculate user stats from games
      const userStats = calculateUserStats(games);
      const streaks = calculateStreaks(games);
      
      engine.setUserData(userAchievements, userStats, streaks);
      
      // Get achievements by category with progress
      const categorizedAchievements = engine.getAchievementsByCategory();
      
      setAchievements(categorizedAchievements);
      setUserAchievements(userAchievements);
      setAchievementEngine(engine);
      setStats(engine.getAchievementSummary());

    } catch (error) {
      console.error('Failed to load achievement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateUserStats = (games) => {
    return games.reduce((stats, game) => {
      stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
      stats.totalScore = (stats.totalScore || 0) + (game.total_score || 0);
      stats.totalStrikes = (stats.totalStrikes || 0) + (game.strikes || 0);
      stats.totalSpares = (stats.totalSpares || 0) + (game.spares || 0);
      
      if (!stats.highScore || game.total_score > stats.highScore) {
        stats.highScore = game.total_score;
      }
      
      if (game.total_score === 300) {
        stats.perfectGames = (stats.perfectGames || 0) + 1;
      }
      
      return stats;
    }, {});
  };

  const calculateStreaks = (games) => {
    // Calculate various streaks from game history
    return {
      strikeStreak: 0,
      spareStreak: 0,
      improvingGameStreak: 0,
      dailyStreak: 0
    };
  };

  const openAchievementModal = (achievement) => {
    setSelectedAchievement(achievement);
    setShowModal(true);
  };

  const getFilteredAchievements = () => {
    let filtered = Object.values(achievements).flat();

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(achievement => achievement.category === selectedCategory);
    }

    if (selectedRarity !== 'all') {
      filtered = filtered.filter(achievement => achievement.rarity === selectedRarity);
    }

    return filtered.sort((a, b) => {
      // Sort by earned status first, then by points
      if (a.earned !== b.earned) {
        return b.earned - a.earned;
      }
      return b.points - a.points;
    });
  };

  const getCategoryStats = () => {
    const categoryStats = {};
    
    Object.entries(achievements).forEach(([category, achievementList]) => {
      const earned = achievementList.filter(a => a.earned).length;
      const total = achievementList.length;
      categoryStats[category] = { earned, total, percentage: (earned / total) * 100 };
    });
    
    return categoryStats;
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Achievements" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const filteredAchievements = getFilteredAchievements();
  const categoryStats = getCategoryStats();

  return (
    <div>
      <PageHeader 
        title="Achievements"
        subtitle="Track your bowling accomplishments and milestones"
      />

      {/* Achievement Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="text-center py-6">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-charcoal-900">{stats.earned}</div>
              <div className="text-sm text-charcoal-600">Achievements Earned</div>
              <div className="text-xs text-charcoal-500">of {stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-6">
              <Star className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-charcoal-900">{stats.totalPoints}</div>
              <div className="text-sm text-charcoal-600">Points Earned</div>
              <div className="text-xs text-charcoal-500">{stats.percentage.toFixed(1)}% Complete</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-6">
              <Target className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-charcoal-900">{stats.userStats.gamesPlayed || 0}</div>
              <div className="text-sm text-charcoal-600">Games Played</div>
              <div className="text-xs text-charcoal-500">Keep bowling!</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-6">
              <Zap className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-charcoal-900">{stats.userStats.highScore || 0}</div>
              <div className="text-sm text-charcoal-600">High Score</div>
              <div className="text-xs text-charcoal-500">Personal Best</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Progress by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div key={category} className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full border-4 border-gray-200 flex items-center justify-center relative">
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-blue-500"
                    style={{
                      clipPath: `polygon(0 0, ${stats.percentage}% 0, ${stats.percentage}% 100%, 0 100%)`
                    }}
                  ></div>
                  <span className="text-sm font-bold">{stats.earned}</span>
                </div>
                <div className="text-xs font-medium capitalize">{category.replace('_', ' ')}</div>
                <div className="text-xs text-gray-500">{stats.total} total</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {Object.values(ACHIEVEMENT_CATEGORIES).map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">Rarity</label>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Rarities</option>
                {Object.values(ACHIEVEMENT_RARITIES).map(rarity => (
                  <option key={rarity} value={rarity}>
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedRarity('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
          <Card 
            key={achievement.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              achievement.earned ? 'ring-2 ring-green-200 bg-green-50' : ''
            }`}
            onClick={() => openAchievementModal(achievement)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`text-3xl ${achievement.earned ? '' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${achievement.earned ? 'text-charcoal-900' : 'text-charcoal-600'}`}>
                      {achievement.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(achievement.category)}`}>
                        {achievement.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {achievement.earned && (
                  <Crown className="w-6 h-6 text-yellow-500" />
                )}
              </div>

              <p className={`text-sm mb-4 ${achievement.earned ? 'text-charcoal-700' : 'text-charcoal-500'}`}>
                {achievement.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{achievement.points} pts</span>
                </div>

                {!achievement.earned && (
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all" 
                        style={{ width: `${achievement.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-charcoal-500">{achievement.progress}%</span>
                  </div>
                )}
              </div>

              {achievement.earned && achievement.dateEarned && (
                <div className="mt-3 text-xs text-green-600 font-medium">
                  Earned: {new Date(achievement.dateEarned).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <Card>
          <CardContent className="text-center py-20">
            <Trophy className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
              No achievements found
            </h3>
            <p className="text-charcoal-600">
              Try adjusting your filters or start bowling to unlock achievements!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Achievement Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Achievement Details"
        size="lg"
      >
        {selectedAchievement && (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`text-6xl mb-4 ${selectedAchievement.earned ? '' : 'grayscale opacity-50'}`}>
                {selectedAchievement.icon}
              </div>
              <h2 className="text-2xl font-bold text-charcoal-900 mb-2">
                {selectedAchievement.name}
              </h2>
              <p className="text-charcoal-600 mb-4">
                {selectedAchievement.description}
              </p>
              
              <div className="flex items-center justify-center space-x-4 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRarityColor(selectedAchievement.rarity)}`}>
                  {selectedAchievement.rarity}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedAchievement.category)}`}>
                  {selectedAchievement.category.replace('_', ' ')}
                </span>
                <span className="flex items-center space-x-1 text-yellow-600">
                  <Star className="w-4 h-4" />
                  <span className="font-medium">{selectedAchievement.points} points</span>
                </span>
              </div>
            </div>

            {selectedAchievement.earned ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-semibold text-green-900 mb-1">Achievement Unlocked!</h3>
                <p className="text-green-700 text-sm">
                  Earned on {new Date(selectedAchievement.dateEarned).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-3">Progress</h3>
                <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all" 
                    style={{ width: `${selectedAchievement.progress}%` }}
                  ></div>
                </div>
                <p className="text-blue-700 text-sm">
                  {selectedAchievement.progress}% complete
                </p>
              </div>
            )}

            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => setShowModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AchievementsPage;