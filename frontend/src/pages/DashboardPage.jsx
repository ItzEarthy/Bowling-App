import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Award, Target, BarChart3 } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner, { LoadingCard } from '../components/ui/Spinner';
import { gameAPI, friendAPI } from '../lib/api';

/**
 * Dashboard Page Component
 * Shows user stats and provides quick access to start new game
 */
const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [friendStats, setFriendStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await gameAPI.getGames(1, 20); // Get more games for trend analysis
      const games = response.data.games;
      
      // Calculate stats from games
      const completedGames = games.filter(game => game.is_complete);
      const totalGames = completedGames.length;
      
      if (totalGames > 0) {
        const scores = completedGames.map(game => game.total_score || game.score);
        const totalPins = scores.reduce((sum, score) => sum + score, 0);
        const averageScore = Math.round(totalPins / totalGames);
        const highScore = Math.max(...scores);
        
        // Calculate improvement trend
        const recentGames = completedGames.slice(0, 5);
        const olderGames = completedGames.slice(5, 10);
        const recentAvg = recentGames.length > 0 ? 
          Math.round(recentGames.reduce((sum, game) => sum + (game.total_score || game.score), 0) / recentGames.length) : 0;
        const olderAvg = olderGames.length > 0 ? 
          Math.round(olderGames.reduce((sum, game) => sum + (game.total_score || game.score), 0) / olderGames.length) : 0;
        const improvement = recentAvg - olderAvg;
        
        setStats({
          gameAverage: averageScore,
          highScore: highScore,
          totalPins: totalPins,
          totalGames: totalGames,
          improvement: improvement,
          gamesThisWeek: completedGames.filter(game => 
            new Date(game.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length
        });

        // Calculate weekly trend data
        const weeklyScores = [];
        for (let i = 0; i < 4; i++) {
          const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
          const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
          const weekGames = completedGames.filter(game => {
            const gameDate = new Date(game.created_at);
            return gameDate >= weekStart && gameDate < weekEnd;
          });
          const weekAvg = weekGames.length > 0 ? 
            Math.round(weekGames.reduce((sum, game) => sum + game.score, 0) / weekGames.length) : 0;
          weeklyScores.unshift(weekAvg);
        }
        setTrendData({ weeklyScores });
      } else {
        setStats({
          gameAverage: 0,
          highScore: 0,
          totalPins: 0,
          totalGames: 0,
          improvement: 0,
          gamesThisWeek: 0
        });
      }
      
      setRecentGames(games.slice(0, 5));
      
      // Load friend stats
      try {
        const friendsResponse = await friendAPI.getFriends();
        const friends = friendsResponse.data.friends;
        setFriendStats({
          totalFriends: friends.length,
          activeFriends: friends.filter(f => f.last_active && 
            new Date(f.last_active) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length
        });
      } catch (friendErr) {
        console.warn('Friends API not available:', friendErr.message);
        setFriendStats({ totalFriends: 0, activeFriends: 0 });
      }
    } catch (err) {
      console.error('Dashboard data error:', err);
      setError(`Failed to load dashboard data: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewGame = () => {
    navigate('/game-setup');
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title={`Welcome back, ${user?.displayName || user?.username}`}
        subtitle="Ready to improve your game?"
        action={
          <Button onClick={handleStartNewGame} variant="primary" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Start New Game
          </Button>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Game Average */}
        <Card variant="interactive" onClick={() => navigate('/stats')}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Game Average</p>
                <p className="text-3xl font-bold text-charcoal-900 font-heading">
                  {stats?.gameAverage || 0}
                </p>
              </div>
              <div className="bg-teal-100 p-3 rounded-xl">
                <TrendingUp className="w-8 h-8 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High Score */}
        <Card variant="interactive" onClick={() => navigate('/stats')}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-charcoal-600 text-sm font-medium">High Score</p>
                <p className="text-3xl font-bold text-charcoal-900 font-heading">
                  {stats?.highScore || 0}
                </p>
                <p className="text-xs text-charcoal-500 mt-1">
                  {stats?.highScore >= 200 ? 'Excellent!' : 
                   stats?.highScore >= 150 ? 'Great!' : 
                   stats?.highScore >= 100 ? 'Good' : 'Keep practicing'}
                </p>
              </div>
              <div className="bg-coral-100 p-3 rounded-xl">
                <Award className="w-8 h-8 text-coral-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Games */}
        <Card variant="interactive" onClick={() => navigate('/stats')}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Games Played</p>
                <p className="text-3xl font-bold text-charcoal-900 font-heading">
                  {stats?.totalGames || 0}
                </p>
                <p className="text-xs text-charcoal-500 mt-1">
                  {stats?.gamesThisWeek || 0} this week
                </p>
              </div>
              <div className="bg-cream-200 p-3 rounded-xl">
                <Target className="w-8 h-8 text-charcoal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Link */}
        <Card variant="interactive" onClick={() => navigate('/stats')}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Detailed Stats</p>
                <p className="text-lg font-bold text-charcoal-900 font-heading">
                  View All
                </p>
                <p className="text-xs text-charcoal-500 mt-1">
                  Analysis & trends
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-xl">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Games */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-charcoal-900 font-heading">
              Recent Games
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/game-log')}
            >
              View All
            </Button>
          </div>

          {recentGames.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-charcoal-400 mx-auto mb-4" />
              <p className="text-charcoal-600 font-medium">No games yet</p>
              <p className="text-charcoal-500 text-sm">
                Start your first game to see your progress here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentGames.map((game) => (
                <div 
                  key={game.id} 
                  className="flex items-center justify-between p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/game/${game.id}`)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-white p-2 rounded-lg">
                      <Target className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-charcoal-900">
                          {game.location || 'Bowling Alley'}
                        </p>
                        {/* Entry Mode Indicator */}
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          game.entry_mode === 'final_score' 
                            ? 'bg-blue-100 text-blue-600' 
                            : game.entry_mode === 'frame_by_frame'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {game.entry_mode === 'final_score' 
                            ? 'Final' 
                            : game.entry_mode === 'frame_by_frame'
                            ? 'Frame'
                            : 'Pin-by-Pin'
                          }
                        </span>
                      </div>
                      <p className="text-sm text-charcoal-600">
                        {new Date(game.created_at).toLocaleDateString()}
                      </p>
                      {/* Show strikes/spares for final_score entry mode */}
                      {game.entry_mode === 'final_score' && (game.strikes > 0 || game.spares > 0) && (
                        <div className="flex items-center space-x-2 mt-1">
                          {game.strikes > 0 && (
                            <span className="text-green-600 text-xs">
                              {game.strikes} ⚡
                            </span>
                          )}
                          {game.spares > 0 && (
                            <span className="text-blue-600 text-xs">
                              {game.spares} /
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-charcoal-900">
                      {game.total_score || game.score}
                    </p>
                    <p className="text-sm text-charcoal-600">
                      {game.is_complete ? 'Complete' : 'In Progress'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start New Game CTA */}
      {stats?.totalGames === 0 && (
        <Card className="mt-8 bg-gradient-to-r from-teal-50 to-coral-50 border-2 border-teal-200">
          <CardContent className="text-center">
            <Target className="w-16 h-16 text-teal-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-charcoal-900 font-heading mb-2">
              Ready to Start Bowling?
            </h3>
            <p className="text-charcoal-600 mb-6">
              Track your first game and start building your bowling statistics
            </p>
            <Button onClick={handleStartNewGame} variant="primary" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Start Your First Game
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;