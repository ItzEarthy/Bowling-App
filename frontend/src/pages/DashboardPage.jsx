import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Award, Target, Zap, Circle, Minus, Users, BarChart3, Calendar } from 'lucide-react';
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
  const [trendData, setTrendData] = useState(null);
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
        const scores = completedGames.map(game => game.score);
        const totalPins = scores.reduce((sum, score) => sum + score, 0);
        const averageScore = Math.round(totalPins / totalGames);
        const highScore = Math.max(...scores);
        
        // Calculate improvement trend
        const recentGames = completedGames.slice(0, 5);
        const olderGames = completedGames.slice(5, 10);
        const recentAvg = recentGames.length > 0 ? 
          Math.round(recentGames.reduce((sum, game) => sum + game.score, 0) / recentGames.length) : 0;
        const olderAvg = olderGames.length > 0 ? 
          Math.round(olderGames.reduce((sum, game) => sum + game.score, 0) / olderGames.length) : 0;
        const improvement = recentAvg - olderAvg;
        
        // For demo purposes, we'll calculate some approximate stats
        // In a real app, these would come from the backend
        const strikePercentage = Math.round(averageScore / 3); // Rough approximation
        const sparePercentage = Math.round((averageScore - strikePercentage * 3) / 2);
        const openFramePercentage = 100 - strikePercentage - sparePercentage;
        
        setStats({
          gameAverage: averageScore,
          highScore: highScore,
          totalPins: totalPins,
          strikePercentage: Math.max(0, Math.min(100, strikePercentage)),
          sparePercentage: Math.max(0, Math.min(100, sparePercentage)),
          openFramePercentage: Math.max(0, Math.min(100, openFramePercentage)),
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
          strikePercentage: 0,
          sparePercentage: 0,
          openFramePercentage: 0,
          totalGames: 0,
          improvement: 0,
          gamesThisWeek: 0
        });
        setTrendData({ weeklyScores: [0, 0, 0, 0] });
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
        // Friends endpoint might not be implemented yet
        setFriendStats({ totalFriends: 0, activeFriends: 0 });
      }
    } catch (err) {
      setError('Failed to load dashboard data');
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Game Average */}
        <Card variant="interactive" onClick={() => navigate('/game-log')}>
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
        <Card variant="interactive" onClick={() => navigate('/game-log')}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">High Score</p>
                <p className="text-3xl font-bold text-charcoal-900 font-heading">
                  {stats?.highScore || 0}
                </p>
              </div>
              <div className="bg-coral-100 p-3 rounded-xl">
                <Award className="w-8 h-8 text-coral-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Pins */}
        <Card variant="interactive" onClick={() => navigate('/game-log')}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Total Pins</p>
                <p className="text-3xl font-bold text-charcoal-900 font-heading">
                  {stats?.totalPins?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-cream-200 p-3 rounded-xl">
                <Target className="w-8 h-8 text-charcoal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strike Percentage */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Strike %</p>
                <p className="text-3xl font-bold text-charcoal-900 font-heading">
                  {stats?.strikePercentage || 0}%
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spare Percentage */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Spare %</p>
                <p className="text-3xl font-bold text-charcoal-900 font-heading">
                  {stats?.sparePercentage || 0}%
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Circle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Open Frame Percentage */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Open Frame %</p>
                <p className="text-3xl font-bold text-charcoal-900 font-heading">
                  {stats?.openFramePercentage || 0}%
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <Minus className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Improvement Trend */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Recent Trend</p>
                <p className={`text-3xl font-bold font-heading ${
                  (stats?.improvement || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(stats?.improvement || 0) >= 0 ? '+' : ''}{stats?.improvement || 0}
                </p>
                <p className="text-xs text-charcoal-500">vs previous games</p>
              </div>
              <div className={`p-3 rounded-xl ${
                (stats?.improvement || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <TrendingUp className={`w-8 h-8 ${
                  (stats?.improvement || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Games This Week */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">This Week</p>
                <p className="text-3xl font-bold text-charcoal-900 font-heading">
                  {stats?.gamesThisWeek || 0}
                </p>
                <p className="text-xs text-charcoal-500">games played</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Friends */}
        <Card variant="interactive" onClick={() => navigate('/friends')}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Friends</p>
                <p className="text-3xl font-bold text-charcoal-900 font-heading">
                  {friendStats?.totalFriends || 0}
                </p>
                <p className="text-xs text-charcoal-500">
                  {friendStats?.activeFriends || 0} active this week
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-xl">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Rating */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Performance</p>
                <p className="text-3xl font-bold text-charcoal-900 font-heading">
                  {stats?.gameAverage >= 200 ? 'A+' : 
                   stats?.gameAverage >= 175 ? 'A' :
                   stats?.gameAverage >= 150 ? 'B+' :
                   stats?.gameAverage >= 125 ? 'B' :
                   stats?.gameAverage >= 100 ? 'C' : 'D'}
                </p>
                <p className="text-xs text-charcoal-500">overall rating</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend Visualization */}
      {trendData && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>4-Week Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between space-x-2 h-32">
              {trendData.weeklyScores.map((score, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="bg-teal-500 rounded-t-lg w-full transition-all duration-500"
                    style={{ 
                      height: `${Math.max(10, (score / 300) * 100)}%`,
                      minHeight: '8px'
                    }}
                  />
                  <div className="text-center mt-2">
                    <p className="text-sm font-medium text-charcoal-900">{score}</p>
                    <p className="text-xs text-charcoal-600">Week {4 - index}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-charcoal-600">
                {trendData.weeklyScores[3] > trendData.weeklyScores[0] ? 
                  '📈 Improving trend - keep it up!' :
                  trendData.weeklyScores[3] < trendData.weeklyScores[0] ?
                  '📉 Focus on consistency' :
                  '➡️ Steady performance'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                      <p className="font-medium text-charcoal-900">
                        {game.location || 'Bowling Alley'}
                      </p>
                      <p className="text-sm text-charcoal-600">
                        {new Date(game.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-charcoal-900">
                      {game.score}
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