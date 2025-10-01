import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/layout/PageHeader';
import { pinCarryAnalyzer, PIN_PATTERNS, CARRY_PATTERNS } from '../utils/pinCarryAnalysis';
import useAuthStore from '../stores/authStore';

const PinCarryPage = () => {
  const { user } = useAuthStore();
  const [carryAnalysis, setCarryAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [visualizationData, setVisualizationData] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadCarryAnalysis();
    }
  }, [user]);

  const loadCarryAnalysis = async () => {
    setLoading(true);
    try {
      // Initialize carry tracking for user
      pinCarryAnalyzer.initializeCarryTracking(user.id);
      
      // Get comprehensive analysis
      const analysis = pinCarryAnalyzer.getCarryAnalysis(user.id);
      setCarryAnalysis(analysis);
      
      // Get visualization data
      const vizData = pinCarryAnalyzer.getVisualizationData(user.id);
      setVisualizationData(vizData);
    } catch (error) {
      console.error('Error loading carry analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalysis = () => {
    const exportData = pinCarryAnalyzer.exportCarryData(user.id);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pin-carry-analysis-${user.username}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {carryAnalysis?.overall_stats?.carry_percentage?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-sm text-gray-600">Strike Rate</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {carryAnalysis?.overall_stats?.spare_rate?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-sm text-gray-600">Spare Rate</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {carryAnalysis?.overall_stats?.open_rate?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-sm text-gray-600">Open Rate</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {carryAnalysis?.overall_stats?.total_frames || 0}
            </div>
            <div className="text-sm text-gray-600">Total Frames</div>
          </div>
        </Card>
      </div>

      {/* Carry Distribution Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Carry Distribution</h3>
        {visualizationData?.carry_distribution && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Strikes</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(visualizationData.carry_distribution.strikes / 
                        (visualizationData.carry_distribution.strikes + 
                         visualizationData.carry_distribution.spares + 
                         visualizationData.carry_distribution.opens)) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{visualizationData.carry_distribution.strikes}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Spares</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(visualizationData.carry_distribution.spares / 
                        (visualizationData.carry_distribution.strikes + 
                         visualizationData.carry_distribution.spares + 
                         visualizationData.carry_distribution.opens)) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{visualizationData.carry_distribution.spares}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Opens</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(visualizationData.carry_distribution.opens / 
                        (visualizationData.carry_distribution.strikes + 
                         visualizationData.carry_distribution.spares + 
                         visualizationData.carry_distribution.opens)) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{visualizationData.carry_distribution.opens}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Recommendations */}
      {carryAnalysis?.recommendations && carryAnalysis.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Improvement Recommendations</h3>
          <div className="space-y-3">
            {carryAnalysis.recommendations.map((rec, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border-l-4 ${
                  rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                  rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="font-medium">{rec.message}</div>
                <div className="text-sm text-gray-600 mt-1">{rec.details}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Priority: {rec.priority} • Type: {rec.type}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  const renderPinLeaves = () => (
    <div className="space-y-6">
      {/* Most Common Pin Leaves */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Most Common Pin Leaves</h3>
        {carryAnalysis?.pin_leaves && carryAnalysis.pin_leaves.length > 0 ? (
          <div className="space-y-3">
            {carryAnalysis.pin_leaves.map((leave, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{leave.info?.name || leave.pattern}</div>
                  <div className="text-sm text-gray-600">
                    {leave.count} times ({leave.percentage.toFixed(1)}%)
                  </div>
                  {leave.info?.advice && (
                    <div className="text-xs text-blue-600 mt-1">{leave.info.advice}</div>
                  )}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  leave.info?.difficulty === 'impossible' ? 'bg-red-100 text-red-800' :
                  leave.info?.difficulty === 'very_hard' ? 'bg-red-100 text-red-800' :
                  leave.info?.difficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
                  leave.info?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  leave.info?.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {leave.info?.difficulty || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No pin leave data available yet. Play some games to see your patterns!
          </div>
        )}
      </Card>

      {/* Pin Pattern Reference */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pin Pattern Reference</h3>
        <div className="space-y-4">
          {Object.entries(PIN_PATTERNS).map(([category, patterns]) => (
            <div key={category}>
              <h4 className="font-medium text-gray-700 mb-2 capitalize">
                {category.replace('_', ' ')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(patterns).map(([patternKey, pattern]) => (
                  <div 
                    key={patternKey}
                    className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedPattern(pattern)}
                  >
                    <div className="font-medium text-sm">{pattern.name}</div>
                    <div className="text-xs text-gray-600">
                      {pattern.conversion_rate}% conversion rate
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderCarryPatterns = () => (
    <div className="space-y-6">
      {/* Ball Reaction Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Ball Reaction Analysis</h3>
        {visualizationData?.ball_reaction_chart && Object.keys(visualizationData.ball_reaction_chart).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(visualizationData.ball_reaction_chart).map(([reaction, count]) => (
              <div key={reaction} className="flex items-center justify-between">
                <span className="capitalize">{reaction.replace('_', ' ')}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(count / Math.max(...Object.values(visualizationData.ball_reaction_chart))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No ball reaction data available yet. Play some games to analyze your ball reaction!
          </div>
        )}
      </Card>

      {/* Carry Pattern Reference */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Carry Pattern Types</h3>
        <div className="space-y-4">
          {Object.entries(CARRY_PATTERNS).map(([category, patterns]) => (
            <div key={category}>
              <h4 className="font-medium text-gray-700 mb-2 capitalize">
                {category.replace('_', ' ')}
              </h4>
              <div className="space-y-2">
                {Object.entries(patterns).map(([patternKey, pattern]) => (
                  <div key={patternKey} className="p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{pattern.name}</div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        pattern.carry_percentage >= 80 ? 'bg-green-100 text-green-800' :
                        pattern.carry_percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {pattern.carry_percentage}% carry
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{pattern.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      {/* Carry Trend Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Carry Percentage Trend</h3>
        {visualizationData?.carry_trend_data && (
          <div className="space-y-4">
            <div className="h-48 flex items-end space-x-2">
              {visualizationData.carry_trend_data.map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${(point.carry_percentage / 50) * 100}%` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-1">G{point.game}</div>
                </div>
              ))}
            </div>
            <div className="text-center text-sm text-gray-600">
              Last 10 Games Carry Percentage
            </div>
          </div>
        )}
      </Card>

      {/* Improvement Areas */}
      {carryAnalysis?.improvement_areas && carryAnalysis.improvement_areas.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Focus Areas for Improvement</h3>
          <div className="space-y-3">
            {carryAnalysis.improvement_areas.map((area, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  area.priority === 'high' ? 'border-red-200 bg-red-50' :
                  area.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{area.area}</div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    area.priority === 'high' ? 'bg-red-100 text-red-800' :
                    area.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {area.priority} priority
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-2">{area.description}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Overall Trends */}
      {carryAnalysis?.trends && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded">
              <div className={`text-2xl font-bold ${
                carryAnalysis.trends.direction === 'improving' ? 'text-green-600' :
                carryAnalysis.trends.direction === 'declining' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {carryAnalysis.trends.direction === 'improving' ? '↗️' :
                 carryAnalysis.trends.direction === 'declining' ? '↘️' : '→'}
              </div>
              <div className="text-sm text-gray-600">Trend Direction</div>
              <div className="text-xs text-gray-500 capitalize">{carryAnalysis.trends.direction}</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className={`text-2xl font-bold ${
                carryAnalysis.trends.change_percentage > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {carryAnalysis.trends.change_percentage > 0 ? '+' : ''}{carryAnalysis.trends.change_percentage}%
              </div>
              <div className="text-sm text-gray-600">Change</div>
              <div className="text-xs text-gray-500">{carryAnalysis.trends.period}</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-blue-600">
                {carryAnalysis.overall_stats?.total_frames || 0}
              </div>
              <div className="text-sm text-gray-600">Analyzed Frames</div>
              <div className="text-xs text-gray-500">Total data points</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Pin Carry Analysis" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div>Loading carry analysis...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Pin Carry Analysis" />
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'pin-leaves', label: 'Pin Leaves', icon: '🎳' },
              { key: 'carry-patterns', label: 'Carry Patterns', icon: '⚡' },
              { key: 'trends', label: 'Trends', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Export Button */}
      <div className="mb-6 flex justify-end">
        <Button onClick={exportAnalysis} className="bg-blue-600 text-white hover:bg-blue-700">
          Export Analysis
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'pin-leaves' && renderPinLeaves()}
      {activeTab === 'carry-patterns' && renderCarryPatterns()}
      {activeTab === 'trends' && renderTrends()}

      {/* Pattern Detail Modal */}
      {selectedPattern && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{selectedPattern.name}</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Conversion Rate:</span> {selectedPattern.conversion_rate}%
              </div>
              <div>
                <span className="font-medium">Difficulty:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  selectedPattern.difficulty === 'impossible' ? 'bg-red-100 text-red-800' :
                  selectedPattern.difficulty === 'very_hard' ? 'bg-red-100 text-red-800' :
                  selectedPattern.difficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
                  selectedPattern.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  selectedPattern.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedPattern.difficulty}
                </span>
              </div>
              <div>
                <span className="font-medium">Advice:</span>
                <div className="text-sm text-gray-600 mt-1">{selectedPattern.advice}</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setSelectedPattern(null)}
                className="bg-gray-600 text-white hover:bg-gray-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PinCarryPage;