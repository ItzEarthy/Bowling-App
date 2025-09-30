import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Calendar, MapPin, Filter, TrendingUp, Award, BarChart3 } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { LoadingCard } from '../components/ui/Spinner';
import { gameAPI, ballAPI } from '../lib/api';

/**
 * Game Log Page Component
 * Complete game history with filtering, sorting, and detailed analytics
 */
const GameLogPage = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [balls, setBalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    ballId: '',
    location: '',
    minScore: '',
    maxScore: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadGames();
    }
  }, [filters, page]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [gamesResponse, ballsResponse] = await Promise.all([
        gameAPI.getGames(1, 20),
        ballAPI.getBalls()
      ]);
      
      setGames(gamesResponse.data.games);
      setBalls(ballsResponse.data.balls);
      setHasMore(gamesResponse.data.pagination.page < gamesResponse.data.pagination.totalPages);
      
      // Calculate comprehensive stats
      calculateStats(gamesResponse.data.games);
    } catch (err) {
      setError('Failed to load game data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGames = async () => {
    try {
      const response = await gameAPI.getGames(page, 20);
      if (page === 1) {
        setGames(response.data.games);
      } else {
        setGames(prev => [...prev, ...response.data.games]);
      }
      setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
    } catch (err) {
      setError('Failed to load games');
    }
  };

  const calculateStats = (gamesList) => {
    const completedGames = gamesList.filter(game => game.is_complete);
    
    if (completedGames.length === 0) {
      setStats({
        totalGames: 0,
        averageScore: 0,
        highScore: 0,
        lowScore: 0,
        totalPins: 0,
        improvementTrend: 0,
        recentAverage: 0,
        consistency: 0,
        gamesByScore: { excellent: 0, good: 0, average: 0, needsWork: 0 }
      });
      return;
    }

    const scores = completedGames.map(game => game.score);
    const totalPins = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = Math.round(totalPins / completedGames.length);
    const highScore = Math.max(...scores);
    const lowScore = Math.min(...scores);

    // Calculate recent trend (last 5 games vs previous 5 games)
    const recentGames = completedGames.slice(0, 5);
    const previousGames = completedGames.slice(5, 10);
    const recentAverage = recentGames.length > 0 ? 
      Math.round(recentGames.reduce((sum, game) => sum + game.score, 0) / recentGames.length) : 0;
    const previousAverage = previousGames.length > 0 ? 
      Math.round(previousGames.reduce((sum, game) => sum + game.score, 0) / previousGames.length) : 0;
    const improvementTrend = recentAverage - previousAverage;

    // Calculate consistency (standard deviation)
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
    const consistency = Math.round(100 - Math.sqrt(variance));

    // Categorize games by score ranges
    const gamesByScore = {
      excellent: scores.filter(score => score >= 200).length,
      good: scores.filter(score => score >= 150 && score < 200).length,
      average: scores.filter(score => score >= 100 && score < 150).length,
      needsWork: scores.filter(score => score < 100).length
    };

    setStats({
      totalGames: completedGames.length,
      averageScore,
      highScore,
      lowScore,
      totalPins,
      improvementTrend,
      recentAverage,
      consistency: Math.max(0, Math.min(100, consistency)),
      gamesByScore
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleGameClick = async (game) => {
    try {
      const response = await gameAPI.getGame(game.id);
      setSelectedGame(response.data.game);
      setShowGameModal(true);
    } catch (err) {
      setError('Failed to load game details');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Game Log" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => <LoadingCard key={i} />)}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <LoadingCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Game Log"
        subtitle="Track your bowling progress and analyze your performance"
        action={
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </Button>
            <Button onClick={() => navigate('/game-setup')} variant="primary">
              New Game
            </Button>
          </div>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-charcoal-600 text-sm font-medium">Total Games</p>
                  <p className="text-3xl font-bold text-charcoal-900 font-heading">
                    {stats.totalGames}
                  </p>
                </div>
                <div className="bg-teal-100 p-3 rounded-xl">
                  <Target className="w-8 h-8 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-charcoal-600 text-sm font-medium">Average Score</p>
                  <p className="text-3xl font-bold text-charcoal-900 font-heading">
                    {stats.averageScore}
                  </p>
                  {stats.improvementTrend !== 0 && (
                    <p className={`text-sm ${stats.improvementTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.improvementTrend > 0 ? '+' : ''}{stats.improvementTrend} recent trend
                    </p>
                  )}
                </div>
                <div className="bg-coral-100 p-3 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-coral-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-charcoal-600 text-sm font-medium">High Score</p>
                  <p className="text-3xl font-bold text-charcoal-900 font-heading">
                    {stats.highScore}
                  </p>
                  <p className="text-sm text-charcoal-600">
                    Low: {stats.lowScore}
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
                  <p className="text-charcoal-600 text-sm font-medium">Consistency</p>
                  <p className="text-3xl font-bold text-charcoal-900 font-heading">
                    {stats.consistency}%
                  </p>
                  <p className="text-sm text-charcoal-600">
                    Total Pins: {stats.totalPins.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Score Distribution */}
      {stats && stats.totalGames > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">{stats.gamesByScore.excellent}</p>
                <p className="text-sm text-charcoal-600">Excellent (200+)</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{stats.gamesByScore.good}</p>
                <p className="text-sm text-charcoal-600">Good (150-199)</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <p className="text-2xl font-bold text-yellow-600">{stats.gamesByScore.average}</p>
                <p className="text-sm text-charcoal-600">Average (100-149)</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <p className="text-2xl font-bold text-red-600">{stats.gamesByScore.needsWork}</p>
                <p className="text-sm text-charcoal-600">Needs Work (&lt;100)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="From Date"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
              <Input
                label="To Date"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
              <div>
                <label className="block text-charcoal-700 font-medium mb-2">Bowling Ball</label>
                <select
                  value={filters.ballId}
                  onChange={(e) => handleFilterChange('ballId', e.target.value)}
                  className="w-full px-4 py-3 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Balls</option>
                  {balls.map(ball => (
                    <option key={ball.id} value={ball.id}>
                      {ball.name} ({ball.weight}lbs)
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Location"
                placeholder="Bowling alley name"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
              <Input
                label="Min Score"
                type="number"
                placeholder="0"
                value={filters.minScore}
                onChange={(e) => handleFilterChange('minScore', e.target.value)}
              />
              <Input
                label="Max Score"
                type="number"
                placeholder="300"
                value={filters.maxScore}
                onChange={(e) => handleFilterChange('maxScore', e.target.value)}
              />
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="px-3 py-2 border border-cream-300 rounded-lg text-sm"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="score-desc">Highest Score</option>
                <option value="score-asc">Lowest Score</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Games List */}
      {games.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-charcoal-900 font-heading mb-2">
                No games yet
              </h3>
              <p className="text-charcoal-600 mb-6">
                Start your first game to see your bowling history here
              </p>
              <Button onClick={() => navigate('/game-setup')} variant="primary">
                Start Your First Game
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {games.map((game) => (
                <div 
                  key={game.id}
                  className="flex items-center justify-between p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors cursor-pointer"
                  onClick={() => handleGameClick(game)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-teal-100 p-3 rounded-xl">
                      <Target className="w-6 h-6 text-teal-600" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-charcoal-900">
                          {game.location || 'Bowling Game'}
                        </h3>
                        {!game.is_complete && (
                          <span className="bg-coral-100 text-coral-600 px-2 py-1 rounded-lg text-xs font-medium">
                            In Progress
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-charcoal-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(game.created_at)}</span>
                          <span className="text-charcoal-500">{formatTime(game.created_at)}</span>
                        </div>
                        
                        {game.ball && (
                          <div className="flex items-center space-x-1">
                            <span>🎳</span>
                            <span>{game.ball.name} ({game.ball.weight}lbs)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-charcoal-900 font-heading">
                      {game.score}
                    </div>
                    <div className="text-sm text-charcoal-600">
                      {game.is_complete ? 'Final Score' : 'Current'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {hasMore && (
              <div className="text-center pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPage(prev => prev + 1);
                    loadGames();
                  }}
                >
                  Load More Games
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Game Details Modal */}
      <Modal
        isOpen={showGameModal}
        onClose={() => setShowGameModal(false)}
        title="Game Details"
        size="lg"
      >
        {selectedGame && <GameDetails game={selectedGame} />}
      </Modal>
    </div>
  );
};

// Game Details Component
const GameDetails = ({ game }) => {
  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-charcoal-900 font-heading">
          {game.score}
        </h2>
        <p className="text-charcoal-600">
          {game.location || 'Bowling Game'} • {new Date(game.created_at).toLocaleDateString()}
        </p>
        {game.ball && (
          <p className="text-charcoal-500 text-sm">
            {game.ball.name} ({game.ball.weight}lbs)
          </p>
        )}
      </div>

      {/* Frame-by-Frame Breakdown */}
      {game.frames && game.frames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Frame Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {game.frames.map((frame) => (
                <div 
                  key={frame.frame_number}
                  className="bg-cream-50 rounded-lg p-3 text-center"
                >
                  <div className="text-xs text-charcoal-600 mb-1">
                    Frame {frame.frame_number}
                  </div>
                  <div className="text-sm font-medium text-charcoal-900">
                    {frame.throws ? frame.throws.join(', ') : '—'}
                  </div>
                  <div className="text-lg font-bold text-teal-600">
                    {frame.cumulative_score || 0}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Statistics */}
      {game.frames && game.frames.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {game.frames.filter(f => f.throws && f.throws[0] === 10 && f.frame_number < 10).length}
            </p>
            <p className="text-sm text-charcoal-600">Strikes</p>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {game.frames.filter(f => 
                f.frame_number < 10 && 
                f.throws && 
                f.throws[0] !== 10 && 
                (f.throws[0] + (f.throws[1] || 0)) === 10
              ).length}
            </p>
            <p className="text-sm text-charcoal-600">Spares</p>
          </div>
          
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {game.frames.filter(f => 
                f.frame_number < 10 && 
                f.throws &&
                f.throws[0] !== 10 && 
                (f.throws[0] + (f.throws[1] || 0)) < 10
              ).length}
            </p>
            <p className="text-sm text-charcoal-600">Open Frames</p>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {game.frames.reduce((sum, f) => 
                sum + (f.throws ? f.throws.reduce((s, t) => s + t, 0) : 0), 0
              )}
            </p>
            <p className="text-sm text-charcoal-600">Total Pins</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameLogPage;