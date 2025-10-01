import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, Award, Flame, Clock, BarChart3, Target, Star } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { streakTracker } from '../utils/streakTracker';
import { gameAPI } from '../lib/api';

/**
 * Streaks Tracking Page
 * Display current streaks, best streaks, and streak achievements
 */
const StreaksPage = () => {
  const [streaks, setStreaks] = useState(null);
  const [activeStreaks, setActiveStreaks] = useState([]);
  const [bestStreaks, setBestStreaks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [streakStats, setStreakStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed, scoring

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      setIsLoading(true);
      
      // Load streaks from tracker
      const currentStreaks = streakTracker.loadStreaks();
      const active = streakTracker.getActiveStreaks();
      const best = streakTracker.getBestStreaks();
      const stats = streakTracker.getStreakStats();
      
      // Load notifications
      const storedNotifications = localStorage.getItem('streak-notifications');
      const notifs = storedNotifications ? JSON.parse(storedNotifications) : [];
      
      setStreaks(currentStreaks);
      setActiveStreaks(active);
      setBestStreaks(best);
      setNotifications(notifs);
      setStreakStats(stats);
    } catch (error) {
      console.error('Failed to load streak data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStreakIcon = (type) => {
    const icons = {
      strikes: Zap,
      spares: Target,
      improving: TrendingUp,
      above200: Star,
      above175: Award,
      above150: BarChart3,
  cleanGames: Flame,
      dailyPlay: Clock,
  turkeys: Flame,
  fourBagger: Flame,
  fiveBagger: Flame
    };
    
    return icons[type] || Zap;
  };

  const getStreakColor = (type) => {
    const colors = {
      strikes: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      spares: 'text-blue-600 bg-blue-50 border-blue-200',
      improving: 'text-green-600 bg-green-50 border-green-200',
      above200: 'text-purple-600 bg-purple-50 border-purple-200',
      above175: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      above150: 'text-teal-600 bg-teal-50 border-teal-200',
      cleanGames: 'text-orange-600 bg-orange-50 border-orange-200',
      dailyPlay: 'text-red-600 bg-red-50 border-red-200',
      turkeys: 'text-amber-600 bg-amber-50 border-amber-200'
    };
    
    return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getFilteredStreaks = () => {
    switch (filter) {
      case 'active':
        return activeStreaks;
      case 'scoring':
        return bestStreaks.filter(streak => 
          ['strikes', 'spares', 'above150', 'above175', 'above200', 'turkeys', 'fourBagger', 'fiveBagger'].includes(streak.type)
        );
      case 'consistency':
        return bestStreaks.filter(streak => 
          ['improving', 'consistent', 'cleanGames', 'dailyPlay'].includes(streak.type)
        );
      default:
        return bestStreaks;
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('streak-notifications');
  };

  const simulateStreakUpdate = async () => {
    // For demo purposes - simulate processing a good game
    const mockGame = {
      frames: Array(10).fill().map((_, i) => ({
        isStrike: Math.random() > 0.7,
        isSpare: Math.random() > 0.5,
        isOpen: false
      })),
      total_score: 180 + Math.floor(Math.random() * 40),
      created_at: new Date().toISOString()
    };

    const result = streakTracker.processGame(mockGame);
    
    // Save notifications
    if (result.notifications.length > 0) {
      const existingNotifications = JSON.parse(localStorage.getItem('streak-notifications') || '[]');
      const updatedNotifications = [...existingNotifications, ...result.notifications];
      localStorage.setItem('streak-notifications', JSON.stringify(updatedNotifications));
    }
    
    // Reload data
    loadStreakData();
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Streaks" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const filteredStreaks = getFilteredStreaks();

  return (
    <div>
      <PageHeader 
        title="Streaks & Momentum"
        subtitle="Track your consistency and hot streaks"
        action={
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={simulateStreakUpdate}>
              Simulate Game
            </Button>
          </div>
        }
      />

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>🎉 Recent Achievements</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearNotifications}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.slice(-5).map((notification) => (
                <div key={notification.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                  <Flame className="w-6 h-6 text-orange-500" />
                  <div className="flex-1">
                    <p className="font-medium text-charcoal-900">{notification.message}</p>
                    <p className="text-sm text-charcoal-600">
                      {new Date(notification.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Streak Statistics */}
      {streakStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
              <CardContent className="text-center py-6">
              <Flame className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-charcoal-900">
                {streakStats.activeStreaks}
              </div>
              <div className="text-sm text-charcoal-600">Active Streaks</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-6">
              <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-charcoal-900">
                {streakStats.longestSingleStreak}
              </div>
              <div className="text-sm text-charcoal-600">Longest Streak</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-6">
              <Award className="w-12 h-12 text-purple-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-charcoal-900">
                {streakStats.totalBestCombined}
              </div>
              <div className="text-sm text-charcoal-600">Total Best Combined</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-6">
              <Star className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-charcoal-900">
                {streakStats.totalAchievements}
              </div>
              <div className="text-sm text-charcoal-600">Streak Achievements</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'All Streaks' },
              { key: 'active', label: 'Currently Active' },
              { key: 'scoring', label: 'Scoring Streaks' },
              { key: 'consistency', label: 'Consistency Streaks' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-500 text-white'
                    : 'text-charcoal-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Streaks Highlight */}
      {filter === 'all' && activeStreaks.length > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle>🔥 Currently Hot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStreaks.slice(0, 6).map((streak) => {
                const Icon = getStreakIcon(streak.type);
                return (
                  <div key={streak.type} className={`p-4 rounded-lg border ${getStreakColor(streak.type)}`}>
                    <div className="flex items-center space-x-3">
                      <Icon className="w-8 h-8" />
                      <div>
                        <div className="text-lg font-bold">{streak.current}</div>
                        <div className="text-sm font-medium">{streak.name}</div>
                        <div className="text-xs opacity-75">Best: {streak.best}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Streaks List */}
      {filteredStreaks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-20">
            <Flame className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
              {filter === 'active' ? 'No active streaks' : 'No streaks yet'}
            </h3>
            <p className="text-charcoal-600">
              {filter === 'active' 
                ? 'Play some games to start building streaks!'
                : 'Your streak history will appear here as you play'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredStreaks.map((streak, index) => {
            const Icon = getStreakIcon(streak.type);
            const isActive = filter === 'active' || (streak.current && streak.current > 0);
            
            return (
              <Card key={`${streak.type}-${index}`} className={isActive ? 'border-green-200 bg-green-50' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg border ${getStreakColor(streak.type)}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-charcoal-900">
                          {streak.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-charcoal-600">
                          {streak.current !== undefined && (
                            <span>Current: {streak.current}</span>
                          )}
                          <span>Best: {streak.best || 0}</span>
                          {streak.total !== undefined && (
                            <span>Total: {streak.total}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-charcoal-900">
                        {filter === 'active' ? streak.current : streak.best || 0}
                      </div>
                      <div className="text-sm text-charcoal-600">
                        {filter === 'active' ? 'Current' : 'Best Ever'}
                      </div>
                      {isActive && streak.current > 0 && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          🔥 Active Streak
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress indicator for known streaks */}
                  {streak.current !== undefined && streak.current > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-charcoal-600 mb-1">
                        <span>Progress to Personal Best</span>
                        <span>{Math.round((streak.current / (streak.best || 1)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((streak.current / (streak.best || 1)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tips Section */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>💡 Streak Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-charcoal-700">
            <div>
              <h4 className="font-semibold mb-2">Building Streaks:</h4>
              <ul className="space-y-1 text-charcoal-600">
                <li>• Focus on consistency over perfection</li>
                <li>• Practice spare shooting for clean game streaks</li>
                <li>• Play regularly to maintain daily/weekly streaks</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Streak Strategy:</h4>
              <ul className="space-y-1 text-charcoal-600">
                <li>• Track multiple streak types simultaneously</li>
                <li>• Use streaks as motivation for improvement</li>
                <li>• Celebrate small wins to build momentum</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreaksPage;