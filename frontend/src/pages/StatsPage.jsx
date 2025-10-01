import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Award, 
  Target, 
  Zap, 
  BarChart3, 
  PieChart, 
  Calendar, 
  Activity,
  Trophy,
  Flame,
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
  MapPin,
  Users,
  Percent
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { gameAPI, ballAPI } from '../lib/api';

/**
 * Comprehensive Statistics Page
 * Displays detailed bowling analytics with charts, graphs, and performance metrics
 */
const StatsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);
  const [balls, setBalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('all'); // all, month, week

  useEffect(() => {
    loadStatsData();
  }, [timeframe]);

  const loadStatsData = async () => {
    try {
      setIsLoading(true);
      const [gamesResponse, ballsResponse] = await Promise.all([
        gameAPI.getGames(1, 100), // Get more games for better analytics
        ballAPI.getBalls()
      ]);
      
      const allGames = gamesResponse.data.games;
      setGames(allGames);
      setBalls(ballsResponse.data.balls);
      
      // Filter games based on timeframe
      const filteredGames = filterGamesByTimeframe(allGames, timeframe);
      
      // Calculate comprehensive statistics
      calculateComprehensiveStats(filteredGames, allGames);
    } catch (err) {
      setError('Failed to load statistics data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterGamesByTimeframe = (games, timeframe) => {
    if (timeframe === 'all') return games;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      default:
        return games;
    }
    
    return games.filter(game => new Date(game.created_at) >= cutoffDate);
  };

  const calculateComprehensiveStats = (games, allGames) => {
    const completedGames = games.filter(game => game.is_complete);
    const allCompletedGames = allGames.filter(game => game.is_complete);
    
    if (completedGames.length === 0) {
      setStats({
        isEmpty: true,
        totalGames: 0,
        averageScore: 0,
        highScore: 0,
        totalPins: 0
      });
      return;
    }

    const scores = completedGames.map(game => game.total_score || game.score);
    const totalPins = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = Math.round(totalPins / completedGames.length);
    const highScore = Math.max(...scores);
    const lowScore = Math.min(...scores);

    // Calculate strikes and spares from frame data or entry mode data
    let totalStrikes = 0;
    let totalSpares = 0;
    let totalFrames = 0;
    let totalPinsKnocked = 0;
    let frameAnalysisGamesCount = 0; // Only count games that have frame analysis

    completedGames.forEach(game => {
      if (game.entry_mode === 'final_score' && (game.strikes || game.spares)) {
        // Use provided strikes/spares data for final_score entries
        totalStrikes += game.strikes || 0;
        totalSpares += game.spares || 0;
        totalFrames += 10; // Assume 10 frames for final score entry
        frameAnalysisGamesCount++;
      } else if (game.entry_mode === 'frame_by_frame' || game.entry_mode === 'pin_by_pin') {
        // For frame-by-frame or pin-by-pin, we'd need to analyze frame data
        // For now, approximate based on score
        const gameStrikes = Math.floor((game.total_score || game.score) / 30);
        const gameSpares = Math.floor(((game.total_score || game.score) - gameStrikes * 30) / 15);
        totalStrikes += gameStrikes;
        totalSpares += gameSpares;
        totalFrames += 10;
        frameAnalysisGamesCount++;
      }
      totalPinsKnocked += (game.total_score || game.score);
    });

    // Performance metrics (only calculate if we have games with frame data)
    const strikePercentage = frameAnalysisGamesCount > 0 && totalFrames > 0 ? 
      Math.round((totalStrikes / totalFrames) * 100) : 0;
    const sparePercentage = frameAnalysisGamesCount > 0 && totalFrames > 0 ? 
      Math.round((totalSpares / totalFrames) * 100) : 0;
    const openFramePercentage = frameAnalysisGamesCount > 0 ? 
      Math.max(0, 100 - strikePercentage - sparePercentage) : 0;

    // Consistency calculation (lower standard deviation = higher consistency)
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    const consistency = Math.max(0, Math.min(100, 100 - (standardDeviation / 2)));

    // Improvement trend
    const recentGames = completedGames.slice(0, Math.min(5, completedGames.length));
    const olderGames = completedGames.slice(5, Math.min(10, completedGames.length));
    const recentAvg = recentGames.length > 0 ? 
      Math.round(recentGames.reduce((sum, game) => sum + (game.total_score || game.score), 0) / recentGames.length) : 0;
    const olderAvg = olderGames.length > 0 ? 
      Math.round(olderGames.reduce((sum, game) => sum + (game.total_score || game.score), 0) / olderGames.length) : 0;
    const improvementTrend = recentAvg - olderAvg;

    // Score distribution
    const scoreRanges = {
      perfect: scores.filter(s => s === 300).length,
      excellent: scores.filter(s => s >= 200 && s < 300).length,
      good: scores.filter(s => s >= 150 && s < 200).length,
      average: scores.filter(s => s >= 100 && s < 150).length,
      beginner: scores.filter(s => s < 100).length
    };

    // Weekly performance (last 8 weeks)
    const weeklyPerformance = [];
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      
      const weekGames = allCompletedGames.filter(game => {
        const gameDate = new Date(game.created_at);
        return gameDate >= weekStart && gameDate < weekEnd;
      });
      
      const weekAverage = weekGames.length > 0 ?
        Math.round(weekGames.reduce((sum, game) => sum + (game.total_score || game.score), 0) / weekGames.length) : 0;
      
      weeklyPerformance.unshift({
        week: `Week ${8 - i}`,
        average: weekAverage,
        games: weekGames.length
      });
    }

    // Monthly performance (last 12 months)
    const monthlyPerformance = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - (i + 1));
      monthStart.setDate(1);
      const monthEnd = new Date();
      monthEnd.setMonth(monthEnd.getMonth() - i);
      monthEnd.setDate(0);
      
      const monthGames = allCompletedGames.filter(game => {
        const gameDate = new Date(game.created_at);
        return gameDate >= monthStart && gameDate <= monthEnd;
      });
      
      const monthAverage = monthGames.length > 0 ?
        Math.round(monthGames.reduce((sum, game) => sum + (game.total_score || game.score), 0) / monthGames.length) : 0;
      
      monthlyPerformance.unshift({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        average: monthAverage,
        games: monthGames.length
      });
    }

    // Ball performance
    const ballPerformance = {};
    completedGames.forEach(game => {
      if (game.ball_id) {
        const ball = balls.find(b => b.id === game.ball_id);
        const ballName = ball ? `${ball.brand} ${ball.name}` : `Ball ${game.ball_id}`;
        
        if (!ballPerformance[ballName]) {
          ballPerformance[ballName] = {
            games: 0,
            totalScore: 0,
            bestScore: 0
          };
        }
        
        ballPerformance[ballName].games++;
        ballPerformance[ballName].totalScore += (game.total_score || game.score);
        ballPerformance[ballName].bestScore = Math.max(ballPerformance[ballName].bestScore, game.total_score || game.score);
      }
    });

    // Location performance
    const locationPerformance = {};
    completedGames.forEach(game => {
      if (game.location) {
        if (!locationPerformance[game.location]) {
          locationPerformance[game.location] = {
            games: 0,
            totalScore: 0,
            bestScore: 0
          };
        }
        
        locationPerformance[game.location].games++;
        locationPerformance[game.location].totalScore += (game.total_score || game.score);
        locationPerformance[game.location].bestScore = Math.max(locationPerformance[game.location].bestScore, game.total_score || game.score);
      }
    });

    // Personal records and achievements
    const personalRecords = {
      highestScore: highScore,
      lowestScore: lowScore,
      bestStreak: calculateBestStreak(scores),
      mostGamesInDay: calculateMostGamesInDay(completedGames),
      bestMonth: getBestMonth(monthlyPerformance),
      totalPinsKnocked: totalPinsKnocked,
      gamesPlayed: completedGames.length
    };

    setStats({
      isEmpty: false,
      totalGames: completedGames.length,
      frameAnalysisGames: frameAnalysisGamesCount,
      averageScore,
      highScore,
      lowScore,
      totalPins: totalPinsKnocked,
      strikePercentage,
      sparePercentage,
      openFramePercentage,
      consistency: Math.round(consistency),
      improvementTrend,
      scoreRanges,
      weeklyPerformance,
      monthlyPerformance,
      ballPerformance,
      locationPerformance,
      personalRecords,
      recentAverage: recentAvg
    });
  };

  const calculateBestStreak = (scores) => {
    let currentStreak = 0;
    let bestStreak = 0;
    let lastScore = 0;

    scores.forEach(score => {
      if (score >= lastScore) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
      lastScore = score;
    });

    return bestStreak;
  };

  const calculateMostGamesInDay = (games) => {
    const gamesByDate = {};
    games.forEach(game => {
      const date = new Date(game.created_at).toDateString();
      gamesByDate[date] = (gamesByDate[date] || 0) + 1;
    });
    
    return Math.max(...Object.values(gamesByDate), 0);
  };

  const getBestMonth = (monthlyPerformance) => {
    if (monthlyPerformance.length === 0) return { month: 'N/A', average: 0 };
    
    return monthlyPerformance.reduce((best, current) => 
      current.average > best.average ? current : best
    );
  };

  const renderCircularProgress = (percentage, color = 'text-blue-600', strokeColor = '#2563eb') => (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeDasharray={`${Math.min(100, percentage)}, 100`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-bold ${color}`}>
          {percentage}%
        </span>
      </div>
    </div>
  );

  const renderBarChart = (data, maxValue) => (
    <div className="flex items-end justify-between space-x-2 h-32">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div 
            className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg w-full transition-all duration-500"
            style={{ 
              height: `${Math.max(8, (item.average / maxValue) * 100)}%`,
              minHeight: '8px'
            }}
          />
          <div className="text-center mt-2">
            <p className="text-sm font-medium text-charcoal-900">{item.average}</p>
            <p className="text-xs text-charcoal-600">{item.week || item.month}</p>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (stats?.isEmpty) {
    return (
      <div>
        <PageHeader title="Statistics" subtitle="No completed games yet" />
        <Card className="text-center py-8">
          <CardContent>
            <BarChart3 className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-charcoal-900 mb-2">No Statistics Available</h3>
            <p className="text-charcoal-600 mb-4">Complete some games to see your bowling statistics</p>
            <Button onClick={() => navigate('/game-setup')} variant="primary">
              Start Your First Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Bowling Statistics"
        subtitle="Comprehensive analysis of your bowling performance"
        action={
          <div className="flex items-center space-x-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="month">Last 30 Days</option>
              <option value="week">Last 7 Days</option>
            </select>
            <Button onClick={() => navigate('/game-setup')} variant="primary">
              New Game
            </Button>
          </div>
        }
      />

      {/* Core Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Average Score</p>
                <p className="text-3xl font-bold text-charcoal-900">{stats.averageScore}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {stats.improvementTrend > 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-600" />
                  ) : stats.improvementTrend < 0 ? (
                    <ArrowDown className="w-4 h-4 text-red-600" />
                  ) : null}
                  <span className={`text-sm ${
                    stats.improvementTrend > 0 ? 'text-green-600' : 
                    stats.improvementTrend < 0 ? 'text-red-600' : 'text-charcoal-600'
                  }`}>
                    {stats.improvementTrend > 0 ? '+' : ''}{stats.improvementTrend}
                  </span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">High Score</p>
                <p className="text-3xl font-bold text-charcoal-900">{stats.highScore}</p>
                <p className="text-sm text-charcoal-500">
                  {stats.highScore >= 200 ? 'Excellent!' : 
                   stats.highScore >= 150 ? 'Great!' : 'Keep improving!'}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Games Played</p>
                <p className="text-3xl font-bold text-charcoal-900">{stats.totalGames}</p>
                <p className="text-sm text-charcoal-500">
                  {stats.totalPins.toLocaleString()} total pins
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-600 text-sm font-medium">Consistency</p>
                <p className="text-3xl font-bold text-charcoal-900">{stats.consistency}%</p>
                <p className="text-sm text-charcoal-500">
                  {stats.consistency >= 80 ? 'Very stable' : 
                   stats.consistency >= 60 ? 'Good' : 'Improving'}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Frame Performance Analysis */}
      {stats.frameAnalysisGames > 0 ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Frame Performance Analysis</span>
              <span className="text-sm font-normal text-charcoal-500">({stats.frameAnalysisGames} games)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                {renderCircularProgress(stats.strikePercentage, 'text-green-600', '#059669')}
                <p className="text-sm font-medium text-charcoal-700 mt-2">Strike Rate</p>
                <p className="text-xs text-charcoal-500">
                  {stats.strikePercentage >= 25 ? 'Excellent!' : 
                   stats.strikePercentage >= 15 ? 'Good' : 'Keep practicing'}
                </p>
              </div>

              <div className="text-center">
                {renderCircularProgress(stats.sparePercentage, 'text-blue-600', '#2563eb')}
                <p className="text-sm font-medium text-charcoal-700 mt-2">Spare Conversion</p>
                <p className="text-xs text-charcoal-500">
                  {stats.sparePercentage >= 60 ? 'Clutch!' : 
                   stats.sparePercentage >= 40 ? 'Solid' : 'Focus on spares'}
                </p>
              </div>

              <div className="text-center">
                {renderCircularProgress(stats.openFramePercentage, 'text-red-600', '#dc2626')}
                <p className="text-sm font-medium text-charcoal-700 mt-2">Open Frames</p>
                <p className="text-xs text-charcoal-500">
                  {stats.openFramePercentage <= 20 ? 'Excellent!' : 
                   stats.openFramePercentage <= 40 ? 'Good' : 'Reduce open frames'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Frame Performance Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-charcoal-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-charcoal-900 mb-2">No Frame Analysis Data</h3>
              <p className="text-charcoal-600 mb-4">
                Frame-by-frame and pin-by-pin games provide detailed performance metrics
              </p>
              <p className="text-sm text-charcoal-500">
                Use detailed entry modes to track strikes, spares, and frame completion rates
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score Distribution */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="w-5 h-5" />
            <span>Score Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gradient-to-t from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.scoreRanges.perfect}</div>
              <div className="text-sm font-medium text-green-800">Perfect</div>
              <div className="text-xs text-green-600">300</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-t from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.scoreRanges.excellent}</div>
              <div className="text-sm font-medium text-blue-800">Excellent</div>
              <div className="text-xs text-blue-600">200-299</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-t from-yellow-50 to-yellow-100 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.scoreRanges.good}</div>
              <div className="text-sm font-medium text-yellow-800">Good</div>
              <div className="text-xs text-yellow-600">150-199</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-t from-orange-50 to-orange-100 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.scoreRanges.average}</div>
              <div className="text-sm font-medium text-orange-800">Average</div>
              <div className="text-xs text-orange-600">100-149</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-t from-red-50 to-red-100 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.scoreRanges.beginner}</div>
              <div className="text-sm font-medium text-red-800">Learning</div>
              <div className="text-xs text-red-600">Under 100</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Weekly Performance Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderBarChart(stats.weeklyPerformance, 300)}
            <div className="mt-4 text-center">
              <p className="text-sm text-charcoal-600">
                Last 8 weeks performance trend
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Monthly Performance Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderBarChart(stats.monthlyPerformance.slice(-6), 300)}
            <div className="mt-4 text-center">
              <p className="text-sm text-charcoal-600">
                Last 6 months performance trend
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Records */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Personal Records & Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-t from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
              <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-800">{stats.personalRecords.highestScore}</div>
              <div className="text-sm font-medium text-yellow-700">Highest Score</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-t from-blue-50 to-blue-100 rounded-lg">
              <Flame className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-800">{stats.personalRecords.bestStreak}</div>
              <div className="text-sm font-medium text-blue-700">Best Streak</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-t from-green-50 to-green-100 rounded-lg">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-800">{stats.personalRecords.mostGamesInDay}</div>
              <div className="text-sm font-medium text-green-700">Games in One Day</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-t from-purple-50 to-purple-100 rounded-lg">
              <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-800">{stats.personalRecords.totalPinsKnocked.toLocaleString()}</div>
              <div className="text-sm font-medium text-purple-700">Total Pins Knocked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment & Location Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {Object.keys(stats.ballPerformance).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Ball Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.ballPerformance).map(([ballName, performance]) => (
                  <div key={ballName} className="flex items-center justify-between p-3 bg-charcoal-50 rounded-lg">
                    <div>
                      <p className="font-medium text-charcoal-900">{ballName}</p>
                      <p className="text-sm text-charcoal-600">{performance.games} games</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-charcoal-900">
                        {Math.round(performance.totalScore / performance.games)} avg
                      </p>
                      <p className="text-sm text-charcoal-600">
                        {performance.bestScore} best
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {Object.keys(stats.locationPerformance).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Location Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.locationPerformance).map(([location, performance]) => (
                  <div key={location} className="flex items-center justify-between p-3 bg-charcoal-50 rounded-lg">
                    <div>
                      <p className="font-medium text-charcoal-900">{location}</p>
                      <p className="text-sm text-charcoal-600">{performance.games} games</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-charcoal-900">
                        {Math.round(performance.totalScore / performance.games)} avg
                      </p>
                      <p className="text-sm text-charcoal-600">
                        {performance.bestScore} best
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Achievement Goals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 ${stats.frameAnalysisGames > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-blue-800">Score Goal</span>
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-1">
                {stats.averageScore < 100 ? '100' :
                 stats.averageScore < 150 ? '150' :
                 stats.averageScore < 200 ? '200' : '250'}
              </div>
              <div className="text-xs text-blue-700">Next milestone</div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="h-2 bg-blue-600 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, (stats.averageScore / (stats.averageScore < 100 ? 100 :
                      stats.averageScore < 150 ? 150 :
                      stats.averageScore < 200 ? 200 : 250)) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-green-800">Consistency Goal</span>
                <Activity className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-900 mb-1">85%</div>
              <div className="text-xs text-green-700">Target consistency</div>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div 
                  className="h-2 bg-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (stats.consistency / 85) * 100)}%` }}
                />
              </div>
            </div>

            {stats.frameAnalysisGames > 0 && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-purple-800">Strike Rate Goal</span>
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-900 mb-1">30%</div>
                <div className="text-xs text-purple-700">Professional level</div>
                <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                  <div 
                    className="h-2 bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (stats.strikePercentage / 30) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsPage;