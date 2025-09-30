import React, { useState, useEffect } from 'react';
import { Plus, Target, TrendingUp, BarChart3, Settings, Trash2, Edit3, Star } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { LoadingCard } from '../components/ui/Spinner';
import { ballAPI, gameAPI } from '../lib/api';

/**
 * Arsenal Page Component
 * Complete ball management with performance tracking and recommendations
 */
const ArsenalPage = () => {
  const [balls, setBalls] = useState([]);
  const [ballStats, setBallStats] = useState({});
  const [selectedBall, setSelectedBall] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [error, setError] = useState(null);
  const [newBall, setNewBall] = useState({
    name: '',
    brand: '',
    weight: '',
    coverstock: '',
    core_type: '',
    hook_potential: '',
    length: '',
    backend: '',
    notes: ''
  });

  useEffect(() => {
    loadArsenalData();
  }, []);

  const loadArsenalData = async () => {
    try {
      setIsLoading(true);
      const [ballsResponse, gamesResponse] = await Promise.all([
        ballAPI.getBalls(),
        gameAPI.getGames(1, 100) // Get more games for better stats
      ]);
      
      setBalls(ballsResponse.data.balls);
      
      // Calculate performance stats for each ball
      const games = gamesResponse.data.games.filter(game => game.is_complete);
      const stats = {};
      
      ballsResponse.data.balls.forEach(ball => {
        const ballGames = games.filter(game => game.ball_id === ball.id);
        if (ballGames.length > 0) {
          const scores = ballGames.map(game => game.score);
          const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
          const highScore = Math.max(...scores);
          const lowScore = Math.min(...scores);
          const recentGames = ballGames.slice(0, 5);
          const recentAvg = recentGames.length > 0 ? 
            Math.round(recentGames.reduce((sum, game) => sum + game.score, 0) / recentGames.length) : 0;
          
          stats[ball.id] = {
            gamesPlayed: ballGames.length,
            averageScore,
            highScore,
            lowScore,
            recentAverage: recentAvg,
            lastUsed: ballGames[0]?.created_at,
            consistency: Math.round(100 - (Math.sqrt(
              scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length
            )))
          };
        } else {
          stats[ball.id] = {
            gamesPlayed: 0,
            averageScore: 0,
            highScore: 0,
            lowScore: 0,
            recentAverage: 0,
            lastUsed: null,
            consistency: 0
          };
        }
      });
      
      setBallStats(stats);
    } catch (err) {
      setError('Failed to load arsenal data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBall = async () => {
    try {
      await ballAPI.createBall(newBall);
      setShowAddModal(false);
      setNewBall({
        name: '',
        brand: '',
        weight: '',
        coverstock: '',
        core_type: '',
        hook_potential: '',
        length: '',
        backend: '',
        notes: ''
      });
      loadArsenalData();
    } catch (err) {
      setError('Failed to add ball');
    }
  };

  const handleEditBall = async () => {
    try {
      await ballAPI.updateBall(selectedBall.id, newBall);
      setShowEditModal(false);
      setSelectedBall(null);
      loadArsenalData();
    } catch (err) {
      setError('Failed to update ball');
    }
  };

  const handleDeleteBall = async (ballId) => {
    if (window.confirm('Are you sure you want to delete this ball?')) {
      try {
        await ballAPI.deleteBall(ballId);
        loadArsenalData();
      } catch (err) {
        setError('Failed to delete ball');
      }
    }
  };

  const openEditModal = (ball) => {
    setSelectedBall(ball);
    setNewBall({
      name: ball.name || '',
      brand: ball.brand || '',
      weight: ball.weight || '',
      coverstock: ball.coverstock || '',
      core_type: ball.core_type || '',
      hook_potential: ball.hook_potential || '',
      length: ball.length || '',
      backend: ball.backend || '',
      notes: ball.notes || ''
    });
    setShowEditModal(true);
  };

  const openStatsModal = (ball) => {
    setSelectedBall(ball);
    setShowStatsModal(true);
  };

  const getPerformanceRating = (avgScore) => {
    if (avgScore >= 200) return { rating: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (avgScore >= 175) return { rating: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (avgScore >= 150) return { rating: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (avgScore >= 125) return { rating: 'Fair', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (avgScore > 0) return { rating: 'Needs Work', color: 'text-red-600', bg: 'bg-red-100' };
    return { rating: 'No Data', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  if (isLoading) {
    return (
      <div>
        <PageHeader title="My Arsenal" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <LoadingCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="My Arsenal"
        subtitle="Manage your bowling balls and track performance"
        action={
          <Button onClick={() => setShowAddModal(true)} variant="primary">
            <Plus className="w-5 h-5 mr-2" />
            Add Ball
          </Button>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Arsenal Summary */}
      {balls.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-charcoal-600 text-sm font-medium">Total Balls</p>
                  <p className="text-3xl font-bold text-charcoal-900 font-heading">
                    {balls.length}
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
                  <p className="text-charcoal-600 text-sm font-medium">Best Performer</p>
                  <p className="text-xl font-bold text-charcoal-900 font-heading">
                    {balls.reduce((best, ball) => {
                      const currentStats = ballStats[ball.id];
                      const bestStats = ballStats[best.id];
                      return (currentStats?.averageScore || 0) > (bestStats?.averageScore || 0) ? ball : best;
                    }, balls[0])?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-charcoal-600">
                    {Math.max(...balls.map(ball => ballStats[ball.id]?.averageScore || 0))} avg
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-charcoal-600 text-sm font-medium">Most Used</p>
                  <p className="text-xl font-bold text-charcoal-900 font-heading">
                    {balls.reduce((mostUsed, ball) => {
                      const currentStats = ballStats[ball.id];
                      const mostUsedStats = ballStats[mostUsed.id];
                      return (currentStats?.gamesPlayed || 0) > (mostUsedStats?.gamesPlayed || 0) ? ball : mostUsed;
                    }, balls[0])?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-charcoal-600">
                    {Math.max(...balls.map(ball => ballStats[ball.id]?.gamesPlayed || 0))} games
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

      {/* Ball Grid */}
      {balls.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-20">
              <Target className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-charcoal-900 font-heading mb-2">
                No bowling balls yet
              </h3>
              <p className="text-charcoal-600 mb-6">
                Add your first bowling ball to start tracking performance
              </p>
              <Button onClick={() => setShowAddModal(true)} variant="primary">
                Add Your First Ball
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {balls.map((ball) => {
            const stats = ballStats[ball.id] || {};
            const performance = getPerformanceRating(stats.averageScore);
            
            return (
              <Card key={ball.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{ball.name}</CardTitle>
                      {ball.brand && (
                        <p className="text-sm text-charcoal-600">{ball.brand}</p>
                      )}
                      <p className="text-sm text-charcoal-500">{ball.weight}lbs</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openStatsModal(ball)}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(ball)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBall(ball.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Performance Rating */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${performance.bg} ${performance.color}`}>
                      {performance.rating}
                    </div>

                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-charcoal-500">Average Score</p>
                        <p className="text-lg font-bold text-charcoal-900">
                          {stats.averageScore || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-charcoal-500">Games Played</p>
                        <p className="text-lg font-bold text-charcoal-900">
                          {stats.gamesPlayed || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-charcoal-500">High Score</p>
                        <p className="text-lg font-bold text-charcoal-900">
                          {stats.highScore || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-charcoal-500">Last Used</p>
                        <p className="text-lg font-bold text-charcoal-900">
                          {formatDate(stats.lastUsed)}
                        </p>
                      </div>
                    </div>

                    {/* Ball Details */}
                    {(ball.coverstock || ball.core_type) && (
                      <div className="pt-2 border-t border-cream-200">
                        {ball.coverstock && (
                          <p className="text-xs text-charcoal-600">
                            <span className="font-medium">Coverstock:</span> {ball.coverstock}
                          </p>
                        )}
                        {ball.core_type && (
                          <p className="text-xs text-charcoal-600">
                            <span className="font-medium">Core:</span> {ball.core_type}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Ball Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Ball"
        size="lg"
      >
        <BallForm
          ball={newBall}
          onChange={setNewBall}
          onSubmit={handleAddBall}
          onCancel={() => setShowAddModal(false)}
          submitLabel="Add Ball"
        />
      </Modal>

      {/* Edit Ball Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Ball"
        size="lg"
      >
        <BallForm
          ball={newBall}
          onChange={setNewBall}
          onSubmit={handleEditBall}
          onCancel={() => setShowEditModal(false)}
          submitLabel="Update Ball"
        />
      </Modal>

      {/* Ball Stats Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Ball Performance"
        size="lg"
      >
        {selectedBall && <BallStats ball={selectedBall} stats={ballStats[selectedBall.id]} />}
      </Modal>
    </div>
  );
};

// Ball Form Component
const BallForm = ({ ball, onChange, onSubmit, onCancel, submitLabel }) => {
  const handleInputChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Ball Name *"
          value={ball.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g. Storm Phaze II"
        />
        <Input
          label="Brand"
          value={ball.brand}
          onChange={(e) => handleInputChange('brand', e.target.value)}
          placeholder="e.g. Storm, Hammer, Brunswick"
        />
        <Input
          label="Weight (lbs) *"
          type="number"
          value={ball.weight}
          onChange={(e) => handleInputChange('weight', e.target.value)}
          placeholder="12-16"
          min="6"
          max="16"
        />
        <Input
          label="Coverstock"
          value={ball.coverstock}
          onChange={(e) => handleInputChange('coverstock', e.target.value)}
          placeholder="e.g. Reactive, Urethane, Plastic"
        />
        <Input
          label="Core Type"
          value={ball.core_type}
          onChange={(e) => handleInputChange('core_type', e.target.value)}
          placeholder="e.g. Asymmetric, Symmetric"
        />
        <div>
          <label className="block text-charcoal-700 font-medium mb-2">Hook Potential</label>
          <select
            value={ball.hook_potential}
            onChange={(e) => handleInputChange('hook_potential', e.target.value)}
            className="w-full px-4 py-3 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Select hook potential</option>
            <option value="Low">Low</option>
            <option value="Medium-Low">Medium-Low</option>
            <option value="Medium">Medium</option>
            <option value="Medium-High">Medium-High</option>
            <option value="High">High</option>
          </select>
        </div>
        <div>
          <label className="block text-charcoal-700 font-medium mb-2">Length</label>
          <select
            value={ball.length}
            onChange={(e) => handleInputChange('length', e.target.value)}
            className="w-full px-4 py-3 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Select length</option>
            <option value="Early">Early</option>
            <option value="Medium">Medium</option>
            <option value="Long">Long</option>
          </select>
        </div>
        <div>
          <label className="block text-charcoal-700 font-medium mb-2">Backend</label>
          <select
            value={ball.backend}
            onChange={(e) => handleInputChange('backend', e.target.value)}
            className="w-full px-4 py-3 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Select backend reaction</option>
            <option value="Smooth">Smooth</option>
            <option value="Angular">Angular</option>
            <option value="Sharp">Sharp</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-charcoal-700 font-medium mb-2">Notes</label>
        <textarea
          value={ball.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Additional notes about this ball..."
          rows={3}
          className="w-full px-4 py-3 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={onSubmit}
          disabled={!ball.name || !ball.weight}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};

// Ball Stats Component
const BallStats = ({ ball, stats = {} }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-charcoal-900 font-heading">
          {ball.name}
        </h3>
        <p className="text-charcoal-600">{ball.brand} • {ball.weight}lbs</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-teal-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{stats.gamesPlayed || 0}</p>
          <p className="text-sm text-charcoal-600">Games Played</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.averageScore || 0}</p>
          <p className="text-sm text-charcoal-600">Average Score</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.highScore || 0}</p>
          <p className="text-sm text-charcoal-600">High Score</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.consistency || 0}%</p>
          <p className="text-sm text-charcoal-600">Consistency</p>
        </div>
      </div>

      {stats.recentAverage > 0 && (
        <div className="bg-cream-50 rounded-xl p-4">
          <h4 className="font-semibold text-charcoal-900 mb-2">Recent Performance</h4>
          <p className="text-charcoal-600">
            Recent 5-game average: <span className="font-bold">{stats.recentAverage}</span>
          </p>
          <p className="text-sm text-charcoal-500 mt-1">
            Last used: {stats.lastUsed ? new Date(stats.lastUsed).toLocaleDateString() : 'Never'}
          </p>
        </div>
      )}

      {ball.notes && (
        <div className="bg-yellow-50 rounded-xl p-4">
          <h4 className="font-semibold text-charcoal-900 mb-2">Notes</h4>
          <p className="text-charcoal-600">{ball.notes}</p>
        </div>
      )}
    </div>
  );
};

export default ArsenalPage;