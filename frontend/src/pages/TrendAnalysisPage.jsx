import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, BarChart3, LineChart, Target, Activity, Award, Zap, Filter, Download } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { gameAPI, ballAPI } from '../lib/api';

/**
 * Trend Analysis Dashboard
 * Comprehensive analysis of bowling performance over time
 */
const TrendAnalysisPage = () => {
  const [games, setGames] = useState([]);
  const [balls, setBalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('6months'); // week, month, 3months, 6months, year, all
  const [selectedMetric, setSelectedMetric] = useState('score'); // score, average, strikes, spares, consistency
  const [filteredData, setFilteredData] = useState([]);
  const [trendStats, setTrendStats] = useState(null);

  useEffect(() => {
    loadTrendData();
  }, []);

  useEffect(() => {
    if (games.length > 0) {
      calculateTrends();
    }
  }, [games, timeframe, selectedMetric]);

  const loadTrendData = async () => {
    try {
      setIsLoading(true);
      const [gamesResponse, ballsResponse] = await Promise.all([
        gameAPI.getGames(1, 1000), // Get all games for analysis
        ballAPI.getBalls()
      ]);
      
      setGames(gamesResponse.data.games || []);
      setBalls(ballsResponse.data.balls || []);
    } catch (error) {
      console.error('Failed to load trend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeframeDate = () => {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3months':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '6months':
        return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0); // All time
    }
  };

  const calculateTrends = () => {
    const cutoffDate = getTimeframeDate();
    const filtered = games
      .filter(game => new Date(game.created_at) >= cutoffDate)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    setFilteredData(filtered);

    if (filtered.length === 0) {
      setTrendStats(null);
      return;
    }

    // Calculate various trend statistics
    const stats = {
      totalGames: filtered.length,
      averageScore: filtered.reduce((sum, game) => sum + (game.total_score || 0), 0) / filtered.length,
      highScore: Math.max(...filtered.map(game => game.total_score || 0)),
      lowScore: Math.min(...filtered.map(game => game.total_score || 0)),
      totalStrikes: filtered.reduce((sum, game) => sum + (game.strikes || 0), 0),
      totalSpares: filtered.reduce((sum, game) => sum + (game.spares || 0), 0),
      improvement: calculateImprovement(filtered),
      consistency: calculateConsistency(filtered),
      trendDirection: calculateTrendDirection(filtered),
      weeklyBreakdown: calculateWeeklyBreakdown(filtered),
      monthlyBreakdown: calculateMonthlyBreakdown(filtered),
      ballPerformance: calculateBallPerformance(filtered),
      timeOfDayAnalysis: calculateTimeOfDayAnalysis(filtered),
      streaks: calculateStreaks(filtered),
      predictions: calculatePredictions(filtered)
    };

    setTrendStats(stats);
  };

  const calculateImprovement = (games) => {
    if (games.length < 2) return 0;
    
    const firstQuarter = games.slice(0, Math.floor(games.length / 4));
    const lastQuarter = games.slice(-Math.floor(games.length / 4));
    
    const firstAvg = firstQuarter.reduce((sum, game) => sum + game.total_score, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((sum, game) => sum + game.total_score, 0) / lastQuarter.length;
    
    return lastAvg - firstAvg;
  };

  const calculateConsistency = (games) => {
    if (games.length < 2) return 0;
    
    const scores = games.map(game => game.total_score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to consistency percentage (lower std dev = higher consistency)
    return Math.max(0, 100 - (standardDeviation / mean) * 100);
  };

  const calculateTrendDirection = (games) => {
    if (games.length < 5) return 'insufficient_data';
    
    const recentGames = games.slice(-10);
    const scores = recentGames.map(game => game.total_score);
    
    // Simple linear regression to determine trend
    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = scores.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * scores[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    if (slope > 2) return 'improving';
    if (slope < -2) return 'declining';
    return 'stable';
  };

  const calculateWeeklyBreakdown = (games) => {
    const weeks = {};
    
    games.forEach(game => {
      const date = new Date(game.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { games: 0, totalScore: 0, strikes: 0, spares: 0 };
      }
      
      weeks[weekKey].games++;
      weeks[weekKey].totalScore += game.total_score || 0;
      weeks[weekKey].strikes += game.strikes || 0;
      weeks[weekKey].spares += game.spares || 0;
    });
    
    return Object.entries(weeks).map(([week, data]) => ({
      week,
      ...data,
      average: data.totalScore / data.games
    })).sort((a, b) => new Date(a.week) - new Date(b.week));
  };

  const calculateMonthlyBreakdown = (games) => {
    const months = {};
    
    games.forEach(game => {
      const date = new Date(game.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { games: 0, totalScore: 0, strikes: 0, spares: 0 };
      }
      
      months[monthKey].games++;
      months[monthKey].totalScore += game.total_score || 0;
      months[monthKey].strikes += game.strikes || 0;
      months[monthKey].spares += game.spares || 0;
    });
    
    return Object.entries(months).map(([month, data]) => ({
      month,
      ...data,
      average: data.totalScore / data.games
    })).sort((a, b) => a.month.localeCompare(b.month));
  };

  const calculateBallPerformance = (games) => {
    const ballMap = balls.reduce((map, ball) => {
      map[ball.id] = { ...ball, games: 0, totalScore: 0, strikes: 0, spares: 0 };
      return map;
    }, {});
    
    games.forEach(game => {
      if (game.ball_id && ballMap[game.ball_id]) {
        ballMap[game.ball_id].games++;
        ballMap[game.ball_id].totalScore += game.total_score || 0;
        ballMap[game.ball_id].strikes += game.strikes || 0;
        ballMap[game.ball_id].spares += game.spares || 0;
      }
    });
    
    return Object.values(ballMap)
      .filter(ball => ball.games > 0)
      .map(ball => ({
        ...ball,
        average: ball.totalScore / ball.games,
        strikeRate: (ball.strikes / (ball.games * 10)) * 100,
        spareRate: (ball.spares / (ball.games * 10)) * 100
      }))
      .sort((a, b) => b.average - a.average);
  };

  const calculateTimeOfDayAnalysis = (games) => {
    const timeSlots = {
      morning: { games: 0, totalScore: 0, label: 'Morning (6-12)' },
      afternoon: { games: 0, totalScore: 0, label: 'Afternoon (12-18)' },
      evening: { games: 0, totalScore: 0, label: 'Evening (18-24)' },
      night: { games: 0, totalScore: 0, label: 'Night (0-6)' }
    };
    
    games.forEach(game => {
      const hour = new Date(game.created_at).getHours();
      let slot;
      
      if (hour >= 6 && hour < 12) slot = 'morning';
      else if (hour >= 12 && hour < 18) slot = 'afternoon';
      else if (hour >= 18 && hour < 24) slot = 'evening';
      else slot = 'night';
      
      timeSlots[slot].games++;
      timeSlots[slot].totalScore += game.total_score || 0;
    });
    
    return Object.entries(timeSlots).map(([key, data]) => ({
      timeSlot: key,
      label: data.label,
      games: data.games,
      average: data.games > 0 ? data.totalScore / data.games : 0
    })).filter(slot => slot.games > 0);
  };

  const calculateStreaks = (games) => {
    let currentStreak = 0;
    let bestStreak = 0;
    let previousScore = null;
    
    games.forEach(game => {
      if (previousScore !== null) {
        if (game.total_score >= previousScore) {
          currentStreak++;
          bestStreak = Math.max(bestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
      previousScore = game.total_score;
    });
    
    return {
      currentImproving: currentStreak,
      bestImproving: bestStreak,
      gamesAbove150: games.filter(game => game.total_score >= 150).length,
      gamesAbove200: games.filter(game => game.total_score >= 200).length
    };
  };

  const calculatePredictions = (games) => {
    if (games.length < 10) return null;
    
    const recentGames = games.slice(-20);
    const scores = recentGames.map(game => game.total_score);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Simple trend-based prediction
    const trend = calculateTrendDirection(recentGames);
    let predictedNext = average;
    
    if (trend === 'improving') predictedNext += 5;
    else if (trend === 'declining') predictedNext -= 5;
    
    return {
      nextGamePrediction: Math.round(predictedNext),
      confidenceLevel: Math.min(95, recentGames.length * 4), // Higher confidence with more data
      targetToReach: Math.round(average + 10), // Stretch goal
      daysToTarget: Math.ceil(30 / (games.length / 30)) // Estimated based on current frequency
    };
  };

  const exportData = () => {
    const dataToExport = {
      timeframe,
      games: filteredData.length,
      stats: trendStats,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bowling-trends-${timeframe}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Trend Analysis" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!games.length) {
    return (
      <div>
        <PageHeader title="Trend Analysis" />
        <Card>
          <CardContent className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
              No games to analyze
            </h3>
            <p className="text-charcoal-600">
              Play some games to see your performance trends
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Trend Analysis"
        subtitle="Track your bowling performance over time"
        action={
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="mb-8">
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">Primary Metric</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="score">Score</option>
                <option value="average">Average</option>
                <option value="strikes">Strikes</option>
                <option value="spares">Spares</option>
                <option value="consistency">Consistency</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {trendStats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="text-center py-6">
                <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-charcoal-900">
                  {Math.round(trendStats.averageScore)}
                </div>
                <div className="text-sm text-charcoal-600">Average Score</div>
                <div className={`text-xs font-medium ${
                  trendStats.improvement > 0 ? 'text-green-600' : 
                  trendStats.improvement < 0 ? 'text-red-600' : 'text-charcoal-500'
                }`}>
                  {trendStats.improvement > 0 ? '+' : ''}{Math.round(trendStats.improvement)} vs period start
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center py-6">
                <Target className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-charcoal-900">
                  {Math.round(trendStats.consistency)}%
                </div>
                <div className="text-sm text-charcoal-600">Consistency</div>
                <div className="text-xs text-charcoal-500">Score reliability</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center py-6">
                <TrendingUp className={`w-12 h-12 mx-auto mb-3 ${
                  trendStats.trendDirection === 'improving' ? 'text-green-500' :
                  trendStats.trendDirection === 'declining' ? 'text-red-500' : 'text-yellow-500'
                }`} />
                <div className="text-lg font-bold text-charcoal-900 capitalize">
                  {trendStats.trendDirection.replace('_', ' ')}
                </div>
                <div className="text-sm text-charcoal-600">Trend Direction</div>
                <div className="text-xs text-charcoal-500">Recent 10 games</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center py-6">
                <Activity className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-charcoal-900">
                  {trendStats.totalGames}
                </div>
                <div className="text-sm text-charcoal-600">Games Played</div>
                <div className="text-xs text-charcoal-500">In this period</div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Interactive chart would be rendered here</p>
                  <p className="text-sm text-gray-500">Showing {selectedMetric} trends for {timeframe}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ball Performance Analysis */}
          {trendStats.ballPerformance.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Ball Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendStats.ballPerformance.slice(0, 5).map((ball, index) => (
                    <div key={ball.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full ${
                          index === 0 ? 'bg-yellow-400' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-400' : 'bg-blue-400'
                        } flex items-center justify-center text-white font-bold text-sm`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-charcoal-900">{ball.name}</h4>
                          <p className="text-sm text-charcoal-600">
                            {ball.brand} • {ball.weight}lbs • {ball.games} games
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-charcoal-900">
                          {Math.round(ball.average)}
                        </div>
                        <div className="text-sm text-charcoal-600">
                          {Math.round(ball.strikeRate)}% strikes
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time of Day Analysis */}
          {trendStats.timeOfDayAnalysis.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Performance by Time of Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {trendStats.timeOfDayAnalysis.map((slot) => (
                    <div key={slot.timeSlot} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-charcoal-900">
                        {Math.round(slot.average)}
                      </div>
                      <div className="text-sm text-charcoal-600">{slot.label}</div>
                      <div className="text-xs text-charcoal-500">{slot.games} games</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Predictions */}
          {trendStats.predictions && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Performance Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">
                      {trendStats.predictions.nextGamePrediction}
                    </div>
                    <div className="text-sm text-blue-700">Predicted Next Score</div>
                    <div className="text-xs text-blue-600">
                      {trendStats.predictions.confidenceLevel}% confidence
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">
                      {trendStats.predictions.targetToReach}
                    </div>
                    <div className="text-sm text-green-700">Stretch Goal</div>
                    <div className="text-xs text-green-600">
                      Based on current trend
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-900">
                      {trendStats.predictions.daysToTarget}
                    </div>
                    <div className="text-sm text-purple-700">Days to Goal</div>
                    <div className="text-xs text-purple-600">
                      At current pace
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Streaks & Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Streaks & Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-xl font-bold text-yellow-900">
                    {trendStats.streaks.currentImproving}
                  </div>
                  <div className="text-sm text-yellow-700">Current Streak</div>
                  <div className="text-xs text-yellow-600">Improving games</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-900">
                    {trendStats.streaks.bestImproving}
                  </div>
                  <div className="text-sm text-orange-700">Best Streak</div>
                  <div className="text-xs text-orange-600">Improving games</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-900">
                    {trendStats.streaks.gamesAbove150}
                  </div>
                  <div className="text-sm text-red-700">150+ Games</div>
                  <div className="text-xs text-red-600">In this period</div>
                </div>
                
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-xl font-bold text-indigo-900">
                    {trendStats.streaks.gamesAbove200}
                  </div>
                  <div className="text-sm text-indigo-700">200+ Games</div>
                  <div className="text-xs text-indigo-600">In this period</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TrendAnalysisPage;