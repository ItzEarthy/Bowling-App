import React, { useState, useEffect } from 'react';
import { Plus, Target, TrendingUp, BarChart3, Settings, Trash2, Edit3, Star, Award, Calendar, Activity, Zap, Gauge, Camera, Palette } from 'lucide-react';
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
        <div className="space-y-6 mb-8">
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    <p className="text-lg font-bold text-charcoal-900 font-heading">
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
                    <p className="text-lg font-bold text-charcoal-900 font-heading">
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

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-charcoal-600 text-sm font-medium">Arsenal Average</p>
                    <p className="text-3xl font-bold text-charcoal-900 font-heading">
                      {balls.length > 0 ? Math.round(
                        balls.reduce((sum, ball) => sum + (ballStats[ball.id]?.averageScore || 0), 0) / 
                        balls.filter(ball => ballStats[ball.id]?.gamesPlayed > 0).length || 1
                      ) : 0}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Award className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Arsenal Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Weight Distribution */}
                <div>
                  <h4 className="font-semibold text-charcoal-900 mb-3">Weight Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      balls.reduce((acc, ball) => {
                        const weight = ball.weight + 'lbs';
                        acc[weight] = (acc[weight] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([weight, count]) => (
                      <div key={weight} className="flex justify-between items-center">
                        <span className="text-sm text-charcoal-600">{weight}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-teal-500 h-2 rounded-full" 
                              style={{ width: `${(count / balls.length) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-charcoal-900">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brand Distribution */}
                <div>
                  <h4 className="font-semibold text-charcoal-900 mb-3">Brands</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      balls.reduce((acc, ball) => {
                        const brand = ball.brand || 'Unknown';
                        acc[brand] = (acc[brand] || 0) + 1;
                        return acc;
                      }, {})
                    ).slice(0, 5).map(([brand, count]) => (
                      <div key={brand} className="flex justify-between items-center">
                        <span className="text-sm text-charcoal-600">{brand}</span>
                        <span className="text-sm font-medium text-charcoal-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Insights */}
                <div>
                  <h4 className="font-semibold text-charcoal-900 mb-3">Performance Insights</h4>
                  <div className="space-y-3">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Zap className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">High Performer</span>
                      </div>
                      <p className="text-xs text-green-700">
                        {balls.filter(ball => (ballStats[ball.id]?.averageScore || 0) >= 175).length} balls scoring 175+
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Gauge className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-900">Consistent</span>
                      </div>
                      <p className="text-xs text-yellow-700">
                        {balls.filter(ball => (ballStats[ball.id]?.consistency || 0) >= 80).length} balls with 80%+ consistency
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Recent Usage</span>
                      </div>
                      <p className="text-xs text-blue-700">
                        {balls.filter(ball => {
                          const lastUsed = ballStats[ball.id]?.lastUsed;
                          if (!lastUsed) return false;
                          const daysSince = (Date.now() - new Date(lastUsed).getTime()) / (1000 * 60 * 60 * 24);
                          return daysSince <= 7;
                        }).length} balls used this week
                      </p>
                    </div>
                  </div>
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
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Ball Visual */}
                      <div className="flex-shrink-0">
                        {ball.image ? (
                          <img 
                            src={ball.image} 
                            alt={ball.name}
                            className="w-16 h-16 object-cover rounded-full border-2 border-gray-200"
                          />
                        ) : (
                          <div 
                            className="w-16 h-16 rounded-full border-2 border-gray-200 shadow-inner"
                            style={{ backgroundColor: ball.color || '#374151' }}
                          ></div>
                        )}
                      </div>
                      
                      {/* Ball Info */}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{ball.name}</CardTitle>
                        {ball.brand && (
                          <p className="text-sm text-charcoal-600">{ball.brand}</p>
                        )}
                        <p className="text-sm text-charcoal-500">{ball.weight}lbs</p>
                      </div>
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
  const [imagePreview, setImagePreview] = useState(ball.image || null);
  const [selectedColor, setSelectedColor] = useState(ball.color || '#374151');

  const predefinedColors = [
    '#374151', // Dark Gray
    '#000000', // Black
    '#DC2626', // Red
    '#2563EB', // Blue
    '#16A34A', // Green
    '#CA8A04', // Yellow
    '#9333EA', // Purple
    '#EA580C', // Orange
    '#DB2777', // Pink
    '#0891B2', // Cyan
    '#65A30D', // Lime
    '#7C2D12', // Brown
  ];

  const handleInputChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setImagePreview(imageData);
        handleInputChange('image', imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    handleInputChange('color', color);
  };

  const removeImage = () => {
    setImagePreview(null);
    handleInputChange('image', null);
  };

  return (
    <div className="space-y-6">
      {/* Ball Appearance Section */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="text-lg font-semibold text-charcoal-900 font-heading mb-4">Ball Appearance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Upload */}
          <div>
            <label className="block text-charcoal-700 font-medium mb-2">Ball Photo</label>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Ball preview" 
                    className="w-32 h-32 object-cover rounded-full border-4 border-gray-200 mx-auto"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mx-auto">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <div className="text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="ball-image-upload"
                />
                <label 
                  htmlFor="ball-image-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Photo
                </label>
                <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG</p>
              </div>
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-charcoal-700 font-medium mb-2">Ball Color</label>
            <div className="space-y-3">
              <div 
                className="w-32 h-32 rounded-full border-4 border-gray-200 mx-auto shadow-inner"
                style={{ backgroundColor: selectedColor }}
              ></div>
              
              <div className="grid grid-cols-6 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color 
                        ? 'border-blue-500 scale-110' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-gray-500" />
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300"
                />
                <span className="text-sm text-gray-600">Custom color</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
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