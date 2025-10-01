import React, { useState, useEffect } from 'react';
import { Droplets, TrendingUp, Target, BarChart3, Search, Plus, Eye, Award, AlertCircle, Info, Lightbulb } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { oilPatternAnalyzer, OIL_PATTERNS } from '../utils/oilPatterns';
import { gameAPI } from '../lib/api';

/**
 * Oil Pattern Analysis Page
 * Track performance on different oil patterns and get recommendations
 */
const OilPatternPage = () => {
  const [activeTab, setActiveTab] = useState('patterns');
  const [patterns, setPatterns] = useState([]);
  const [performanceSummaries, setPerformanceSummaries] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameForm, setGameForm] = useState({
    pattern_id: '',
    total_score: '',
    strikes: '',
    spares: '',
    ball_id: '',
    preferred_line: '',
    notes: ''
  });

  useEffect(() => {
    loadOilPatternData();
  }, []);

  const loadOilPatternData = () => {
    setIsLoading(true);
    try {
      const allPatterns = oilPatternAnalyzer.getAllPatterns();
      const summaries = oilPatternAnalyzer.getAllPatternSummaries();
      
      setPatterns(allPatterns);
      setPerformanceSummaries(summaries);
    } catch (error) {
      console.error('Failed to load oil pattern data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredPatterns = () => {
    let filtered = patterns;

    if (filterType !== 'all') {
      filtered = filtered.filter(pattern => pattern.type === filterType);
    }

    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(pattern => pattern.difficulty === filterDifficulty);
    }

    if (searchQuery) {
      filtered = filtered.filter(pattern => 
        pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pattern.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const handleViewPattern = (pattern) => {
    const summary = performanceSummaries.find(s => s.pattern.id === pattern.id);
    setSelectedPattern({ ...pattern, performanceSummary: summary });
    setShowPatternModal(true);
  };

  const handleAddGame = () => {
    setGameForm({
      pattern_id: '',
      total_score: '',
      strikes: '',
      spares: '',
      ball_id: '',
      preferred_line: '',
      notes: ''
    });
    setShowAddGameModal(true);
  };

  const handleSubmitGame = () => {
    if (!gameForm.pattern_id || !gameForm.total_score) return;

    const gameData = {
      total_score: parseInt(gameForm.total_score),
      strikes: parseInt(gameForm.strikes) || 0,
      spares: parseInt(gameForm.spares) || 0,
      ball_id: gameForm.ball_id || null,
      preferred_line: gameForm.preferred_line || null,
      notes: gameForm.notes || '',
      frames: [] // Would be populated in real implementation
    };

    const result = oilPatternAnalyzer.recordGamePerformance(gameForm.pattern_id, gameData);
    
    // Reload data
    loadOilPatternData();
    setShowAddGameModal(false);
    
    // Show recommendations if any
    if (result.recommendations.length > 0) {
      alert(`Game recorded! Recommendations: ${result.recommendations.map(r => r.message).join(', ')}`);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      'easy-medium': 'bg-lime-100 text-lime-800',
      medium: 'bg-yellow-100 text-yellow-800',
      'medium-hard': 'bg-orange-100 text-orange-800',
      hard: 'bg-red-100 text-red-800',
      'very-hard': 'bg-purple-100 text-purple-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    const icons = {
      house: Target,
      sport: Award,
      challenge: AlertCircle,
      pba: Award
    };
    return icons[type] || Droplets;
  };

  const rankings = oilPatternAnalyzer.getPerformanceRankings();

  const tabs = [
    { id: 'patterns', label: 'Oil Patterns', icon: Droplets },
    { id: 'performance', label: 'My Performance', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Oil Pattern Analysis" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const filteredPatterns = getFilteredPatterns();

  return (
    <div>
      <PageHeader 
        title="Oil Pattern Analysis"
        subtitle="Track your performance across different lane conditions"
        action={
          <Button onClick={handleAddGame}>
            <Plus className="w-4 h-4 mr-2" />
            Record Game
          </Button>
        }
      />

      {/* Tab Navigation */}
      <Card className="mb-8">
        <CardContent>
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-charcoal-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Oil Patterns Tab */}
      {activeTab === 'patterns' && (
        <div>
          {/* Filters */}
          <Card className="mb-6">
            <CardContent>
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Pattern Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="house">House Patterns</option>
                    <option value="sport">Sport Patterns</option>
                    <option value="challenge">Challenge Patterns</option>
                    <option value="pba">PBA Patterns</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="easy-medium">Easy-Medium</option>
                    <option value="medium">Medium</option>
                    <option value="medium-hard">Medium-Hard</option>
                    <option value="hard">Hard</option>
                    <option value="very-hard">Very Hard</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Search
                  </label>
                  <Input
                    placeholder="Search patterns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={Search}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pattern Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatterns.map((pattern) => {
              const Icon = getTypeIcon(pattern.type);
              const summary = performanceSummaries.find(s => s.pattern.id === pattern.id);
              
              return (
                <Card key={pattern.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleViewPattern(pattern)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-8 h-8 text-blue-500" />
                        <div>
                          <h3 className="font-semibold text-charcoal-900">{pattern.name}</h3>
                          <p className="text-sm text-charcoal-600 capitalize">{pattern.type} Pattern</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(pattern.difficulty)}`}>
                        {pattern.difficulty}
                      </span>
                    </div>

                    <p className="text-sm text-charcoal-600 mb-4 line-clamp-2">
                      {pattern.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <span className="text-charcoal-500">Length:</span>
                        <span className="ml-2 font-medium">{pattern.length}ft</span>
                      </div>
                      <div>
                        <span className="text-charcoal-500">Ratio:</span>
                        <span className="ml-2 font-medium">{pattern.ratio}</span>
                      </div>
                      <div>
                        <span className="text-charcoal-500">Volume:</span>
                        <span className="ml-2 font-medium">{pattern.volume}ml</span>
                      </div>
                      <div>
                        <span className="text-charcoal-500">Backend:</span>
                        <span className="ml-2 font-medium capitalize">{pattern.characteristics.backend}</span>
                      </div>
                    </div>

                    {summary && (
                      <div className="border-t pt-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-charcoal-900">
                              {Math.round(summary.averageScore)}
                            </div>
                            <div className="text-charcoal-600">Your Avg</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-charcoal-900">
                              {summary.totalGames}
                            </div>
                            <div className="text-charcoal-600">Games</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div>
          {performanceSummaries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-20">
                <Droplets className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
                  No performance data yet
                </h3>
                <p className="text-charcoal-600 mb-6">
                  Record games on different oil patterns to see your performance analysis
                </p>
                <Button onClick={handleAddGame}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Your First Game
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {performanceSummaries.map((summary) => (
                <Card key={summary.pattern.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-charcoal-900">
                          {summary.pattern.name}
                        </h3>
                        <p className="text-charcoal-600 capitalize">
                          {summary.pattern.type} • {summary.pattern.difficulty}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewPattern(summary.pattern)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-900">
                          {Math.round(summary.averageScore)}
                        </div>
                        <div className="text-sm text-blue-700">Average</div>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-900">
                          {summary.highScore}
                        </div>
                        <div className="text-sm text-green-700">High Score</div>
                      </div>
                      
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-900">
                          {summary.totalGames}
                        </div>
                        <div className="text-sm text-purple-700">Games</div>
                      </div>
                      
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-xl font-bold text-yellow-900">
                          {Math.round(summary.strikeRate)}%
                        </div>
                        <div className="text-sm text-yellow-700">Strikes</div>
                      </div>
                      
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className={`text-xl font-bold ${
                          summary.improvement >= 0 ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {summary.improvement >= 0 ? '+' : ''}{Math.round(summary.improvement)}
                        </div>
                        <div className="text-sm text-orange-700">Trend</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Performance Rankings */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-charcoal-900 mb-3">Highest Average</h4>
                  <div className="space-y-2">
                    {rankings.bestByAverage.slice(0, 3).map((summary, index) => (
                      <div key={summary.pattern.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{summary.pattern.name}</span>
                        <span className="font-medium">{Math.round(summary.averageScore)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-charcoal-900 mb-3">Most Improved</h4>
                  <div className="space-y-2">
                    {rankings.bestByImprovement.slice(0, 3).map((summary, index) => (
                      <div key={summary.pattern.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{summary.pattern.name}</span>
                        <span className="font-medium text-green-600">
                          +{Math.round(summary.improvement)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-charcoal-900 mb-3">Most Played</h4>
                  <div className="space-y-2">
                    {rankings.mostPlayed.slice(0, 3).map((summary, index) => (
                      <div key={summary.pattern.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{summary.pattern.name}</span>
                        <span className="font-medium">{summary.totalGames} games</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pattern Type Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Pattern Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Chart visualization would appear here</p>
                  <p className="text-sm text-gray-500">Showing average scores across pattern types</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pattern Detail Modal */}
      <Modal
        isOpen={showPatternModal}
        onClose={() => setShowPatternModal(false)}
        title={selectedPattern?.name || 'Pattern Details'}
        size="lg"
      >
        {selectedPattern && (
          <div className="space-y-6">
            {/* Pattern Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-900">{selectedPattern.length}ft</div>
                <div className="text-sm text-blue-700">Length</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-900">{selectedPattern.ratio}</div>
                <div className="text-sm text-green-700">Ratio</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-900">{selectedPattern.volume}ml</div>
                <div className="text-sm text-yellow-700">Volume</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-900 capitalize">
                  {selectedPattern.characteristics.backend}
                </div>
                <div className="text-sm text-purple-700">Backend</div>
              </div>
            </div>

            {/* Strategy */}
            <div>
              <h4 className="font-semibold text-charcoal-900 mb-3 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Recommended Strategy
              </h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Line:</strong> {selectedPattern.strategy?.recommended_line}
                  </div>
                  <div>
                    <strong>Ball Surface:</strong> {selectedPattern.strategy?.ball_surface}
                  </div>
                  <div>
                    <strong>Release:</strong> {selectedPattern.strategy?.release}
                  </div>
                  <div>
                    <strong>Targeting:</strong> {selectedPattern.strategy?.targeting}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            {selectedPattern.performanceSummary && (
              <div>
                <h4 className="font-semibold text-charcoal-900 mb-3">Your Performance</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-charcoal-900">
                      {Math.round(selectedPattern.performanceSummary.averageScore)}
                    </div>
                    <div className="text-sm text-charcoal-600">Average</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-charcoal-900">
                      {selectedPattern.performanceSummary.highScore}
                    </div>
                    <div className="text-sm text-charcoal-600">High Score</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-charcoal-900">
                      {selectedPattern.performanceSummary.totalGames}
                    </div>
                    <div className="text-sm text-charcoal-600">Games</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-charcoal-900">
                      {Math.round(selectedPattern.performanceSummary.averagePerformanceScore)}
                    </div>
                    <div className="text-sm text-charcoal-600">Performance Score</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setShowPatternModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setGameForm({ ...gameForm, pattern_id: selectedPattern.id });
                setShowPatternModal(false);
                setShowAddGameModal(true);
              }}>
                Record Game
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Game Modal */}
      <Modal
        isOpen={showAddGameModal}
        onClose={() => setShowAddGameModal(false)}
        title="Record Game Performance"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Oil Pattern
            </label>
            <select
              value={gameForm.pattern_id}
              onChange={(e) => setGameForm({ ...gameForm, pattern_id: e.target.value })}
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select a pattern...</option>
              {patterns.map((pattern) => (
                <option key={pattern.id} value={pattern.id}>
                  {pattern.name} ({pattern.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Score"
              type="number"
              value={gameForm.total_score}
              onChange={(e) => setGameForm({ ...gameForm, total_score: e.target.value })}
              placeholder="e.g., 185"
            />
            <Input
              label="Strikes"
              type="number"
              value={gameForm.strikes}
              onChange={(e) => setGameForm({ ...gameForm, strikes: e.target.value })}
              placeholder="e.g., 6"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Spares"
              type="number"
              value={gameForm.spares}
              onChange={(e) => setGameForm({ ...gameForm, spares: e.target.value })}
              placeholder="e.g., 3"
            />
            <Input
              label="Ball Used (ID)"
              value={gameForm.ball_id}
              onChange={(e) => setGameForm({ ...gameForm, ball_id: e.target.value })}
              placeholder="Ball ID"
            />
          </div>

          <Input
            label="Preferred Line"
            value={gameForm.preferred_line}
            onChange={(e) => setGameForm({ ...gameForm, preferred_line: e.target.value })}
            placeholder="e.g., 2nd arrow to 7 pin"
          />

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Notes
            </label>
            <textarea
              value={gameForm.notes}
              onChange={(e) => setGameForm({ ...gameForm, notes: e.target.value })}
              placeholder="Any observations about lane conditions, adjustments made, etc."
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setShowAddGameModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitGame}
              disabled={!gameForm.pattern_id || !gameForm.total_score}
            >
              Record Game
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OilPatternPage;