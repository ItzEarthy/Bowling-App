import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Calendar, MapPin, Filter, TrendingUp, Award, BarChart3, Edit, Trash2, MoreVertical } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { LoadingCard } from '../components/ui/Spinner';
import { gameAPI, ballAPI } from '../lib/api';
import { extractScore, averageScore, roundedAverage, completedGamesFilter, standardDeviation } from '../utils/statsHelpers';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToEdit, setGameToEdit] = useState(null);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({
    location: '',
    notes: '',
    created_at: ''
  });
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
      
      console.log('Games response:', gamesResponse);
      console.log('Balls response:', ballsResponse);
      
      // Defensive checks for response structure
      if (!gamesResponse?.data) {
        throw new Error('Invalid games response structure');
      }
      if (!ballsResponse?.data) {
        throw new Error('Invalid balls response structure');
      }
      
      setGames(gamesResponse.data.games || []);
      setBalls(ballsResponse.data.balls || []);
      setHasMore(gamesResponse.data.pagination?.page < gamesResponse.data.pagination?.totalPages);
      
      // Calculate comprehensive stats
      calculateStats(gamesResponse.data.games || []);
    } catch (err) {
      console.error('Failed to load game data:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      setError(`Failed to load game data: ${errorMsg}`);
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
      console.error('Failed to load games:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      setError(`Failed to load games: ${errorMsg}`);
    }
  };

  const calculateStats = (gamesList) => {
  const completedGames = completedGamesFilter(gamesList);
    
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

  const scores = completedGames.map(game => extractScore(game));
  const totalPins = scores.reduce((sum, score) => sum + score, 0);
  const avgValue = averageScore(completedGames);
  const averageScore = Math.round(avgValue);
  const highScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Calculate recent trend (last 5 games vs previous 5 games)
    const recentGames = completedGames.slice(0, 5);
    const previousGames = completedGames.slice(5, 10);
    const recentAverage = roundedAverage(recentGames);
    const previousAverage = roundedAverage(previousGames);
    const improvementTrend = recentAverage - previousAverage;

    // Calculate consistency (standard deviation)
  const stdDev = standardDeviation(completedGames);
  const consistency = Math.max(0, Math.min(100, Math.round(100 - stdDev)));

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

  const handleEditGame = (game, event) => {
    event.stopPropagation(); // Prevent triggering game click
    setGameToEdit(game);
    setEditFormData({
      location: game.location || '',
      notes: game.notes || '',
      created_at: game.created_at ? game.created_at.split('T')[0] : '' // Convert to YYYY-MM-DD format
    });
    setShowEditModal(true);
  };

  const handleDeleteGame = (game, event) => {
    event.stopPropagation(); // Prevent triggering game click
    setGameToDelete(game);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updatedData = {
        location: editFormData.location,
        notes: editFormData.notes,
        created_at: editFormData.created_at ? new Date(editFormData.created_at).toISOString() : gameToEdit.created_at
      };

      await gameAPI.updateGame(gameToEdit.id, updatedData);
      
      // Update the games list
      setGames(prev => prev.map(game => 
        game.id === gameToEdit.id 
          ? { ...game, ...updatedData }
          : game
      ));

      setShowEditModal(false);
      setGameToEdit(null);
      setError(null);
    } catch (err) {
      setError('Failed to update game');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await gameAPI.deleteGame(gameToDelete.id);
      
      // Remove the game from the list
      setGames(prev => prev.filter(game => game.id !== gameToDelete.id));
      
      setShowDeleteModal(false);
      setGameToDelete(null);
      setError(null);
    } catch (err) {
      setError('Failed to delete game');
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

      {/* Entry Mode Breakdown */}
      {stats && stats.totalGames > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Game Entry Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pin by Pin */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3"
                      strokeDasharray={`${Math.round((games.filter(g => g.entry_mode === 'pin_by_pin').length / games.length) * 100)}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-bold text-charcoal-900">
                        {games.filter(g => g.entry_mode === 'pin_by_pin').length}
                      </p>
                      <p className="text-xs text-charcoal-600">games</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-charcoal-800">Pin by Pin</p>
                  <p className="text-sm text-green-600">Most detailed</p>
                  <p className="text-xs text-charcoal-500">
                    {Math.round((games.filter(g => g.entry_mode === 'pin_by_pin').length / games.length) * 100)}% of games
                  </p>
                </div>
              </div>

              {/* Frame by Frame */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="3"
                      strokeDasharray={`${Math.round((games.filter(g => g.entry_mode === 'frame_by_frame').length / games.length) * 100)}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-bold text-charcoal-900">
                        {games.filter(g => g.entry_mode === 'frame_by_frame').length}
                      </p>
                      <p className="text-xs text-charcoal-600">games</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-charcoal-800">Frame by Frame</p>
                  <p className="text-sm text-yellow-600">Moderate detail</p>
                  <p className="text-xs text-charcoal-500">
                    {Math.round((games.filter(g => g.entry_mode === 'frame_by_frame').length / games.length) * 100)}% of games
                  </p>
                </div>
              </div>

              {/* Final Score */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                      strokeDasharray={`${Math.round((games.filter(g => g.entry_mode === 'final_score').length / games.length) * 100)}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-bold text-charcoal-900">
                        {games.filter(g => g.entry_mode === 'final_score').length}
                      </p>
                      <p className="text-xs text-charcoal-600">games</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-charcoal-800">Final Score</p>
                  <p className="text-sm text-blue-600">Quick entry</p>
                  <p className="text-xs text-charcoal-500">
                    {Math.round((games.filter(g => g.entry_mode === 'final_score').length / games.length) * 100)}% of games
                  </p>
                </div>
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
                  className="flex items-center justify-between p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors cursor-pointer group"
                  onClick={() => handleGameClick(game)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-teal-100 p-3 rounded-xl">
                      <Target className="w-6 h-6 text-teal-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-charcoal-900">
                          {game.location || 'Bowling Game'}
                        </h3>
                        {!game.is_complete && (
                          <span className="bg-coral-100 text-coral-600 px-2 py-1 rounded-lg text-xs font-medium">
                            In Progress
                          </span>
                        )}
                        {/* Entry Mode Indicator */}
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          game.entry_mode === 'final_score' 
                            ? 'bg-blue-100 text-blue-600' 
                            : game.entry_mode === 'frame_by_frame'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {game.entry_mode === 'final_score' 
                            ? 'Final Score' 
                            : game.entry_mode === 'frame_by_frame'
                            ? 'Frame by Frame'
                            : 'Pin by Pin'
                          }
                        </span>
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
                        
                        {/* Show strikes/spares for final_score entry mode */}
                        {game.entry_mode === 'final_score' && (game.strikes > 0 || game.spares > 0) && (
                          <div className="flex items-center space-x-2">
                            {game.strikes > 0 && (
                              <span className="text-green-600 text-xs">
                                {game.strikes} strikes
                              </span>
                            )}
                            {game.spares > 0 && (
                              <span className="text-blue-600 text-xs">
                                {game.spares} spares
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-charcoal-900 font-heading">
                        {game.total_score || game.score}
                      </div>
                      <div className="text-sm text-charcoal-600">
                        {game.is_complete ? 'Final Score' : 'Current'}
                      </div>
                    </div>
                    
                    {/* Game Actions */}
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditGame(game, e)}
                        className="p-2 text-charcoal-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit game"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteGame(game, e)}
                        className="p-2 text-charcoal-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete game"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      {/* Edit Game Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Game"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Location
            </label>
            <Input
              type="text"
              value={editFormData.location}
              onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter bowling alley or location"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Date
            </label>
            <Input
              type="date"
              value={editFormData.created_at}
              onChange={(e) => setEditFormData(prev => ({ ...prev, created_at: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Notes
            </label>
            <textarea
              value={editFormData.notes}
              onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this game..."
              className="w-full px-4 py-3 border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              rows="4"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Game"
        size="sm"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">
              Delete this game?
            </h3>
            <p className="text-charcoal-600">
              This action cannot be undone. All game data and statistics will be permanently removed.
            </p>
          </div>
          
          {gameToDelete && (
            <div className="bg-charcoal-50 p-4 rounded-xl">
              <div className="text-sm">
                <div className="font-medium text-charcoal-900">
                  {gameToDelete.location || 'Bowling Game'}
                </div>
                <div className="text-charcoal-600">
                  Score: {gameToDelete.total_score || gameToDelete.score} • {new Date(gameToDelete.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Game
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Game Details Component
const GameDetails = ({ game }) => {
  const getEntryModeDisplay = () => {
    switch (game.entry_mode) {
      case 'final_score':
        return 'Final Score Entry';
      case 'frame_by_frame':
        return 'Frame by Frame Entry';
      case 'pin_by_pin':
        return 'Pin by Pin Entry';
      default:
        return 'Unknown Entry Mode';
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-charcoal-900 font-heading">
          {game.total_score || game.score}
        </h2>
        <p className="text-charcoal-600">
          {game.location || 'Bowling Game'} • {new Date(game.created_at).toLocaleDateString()}
        </p>
        {game.ball && (
          <p className="text-charcoal-500 text-sm">
            {game.ball.name} ({game.ball.weight}lbs)
          </p>
        )}
        <div className="mt-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            game.entry_mode === 'final_score' 
              ? 'bg-blue-100 text-blue-600' 
              : game.entry_mode === 'frame_by_frame'
              ? 'bg-yellow-100 text-yellow-600'
              : 'bg-green-100 text-green-600'
          }`}>
            {getEntryModeDisplay()}
          </span>
        </div>
        {game.notes && (
          <p className="text-charcoal-500 text-sm mt-2 italic">
            "{game.notes}"
          </p>
        )}
      </div>

      {/* Entry Mode Specific Content */}
      {game.entry_mode === 'final_score' && (
        <Card>
          <CardHeader>
            <CardTitle>Game Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-600">
                  {game.strikes || 0}
                </p>
                <p className="text-sm text-charcoal-600">Strikes</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-blue-600">
                  {game.spares || 0}
                </p>
                <p className="text-sm text-charcoal-600">Spares</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-yellow-600">
                  {10 - (game.strikes || 0) - (game.spares || 0)}
                </p>
                <p className="text-sm text-charcoal-600">Open Frames</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frame-by-Frame Breakdown */}
      {(game.entry_mode === 'frame_by_frame' || game.entry_mode === 'pin_by_pin') && 
       game.frames && game.frames.length > 0 && (
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
      {(game.entry_mode === 'frame_by_frame' || game.entry_mode === 'pin_by_pin') && 
       game.frames && game.frames.length > 0 && (
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