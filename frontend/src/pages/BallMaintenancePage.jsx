import React, { useState, useEffect } from 'react';
import { Wrench, Clock, AlertTriangle, CheckCircle, TrendingUp, Calendar, DollarSign, Target, Plus, X, Bell, BellOff } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { ballMaintenanceTracker } from '../utils/ballMaintenance';
import { ballAPI } from '../lib/api';

/**
 * Ball Maintenance Management Page
 * Track ball usage, maintenance history, and get reminders
 */
const BallMaintenancePage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [balls, setBalls] = useState([]);
  const [maintenanceOverview, setMaintenanceOverview] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [selectedBall, setSelectedBall] = useState(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: '',
    description: '',
    cost: '',
    location: '',
    notes: '',
    performed_by: 'self'
  });

  useEffect(() => {
    loadMaintenanceData();
  }, []);

  const loadMaintenanceData = async () => {
    try {
      setIsLoading(true);
      
      // Load balls from API
      const ballsResponse = await ballAPI.getBalls();
      const ballsData = ballsResponse.data.balls || [];
      setBalls(ballsData);

      // Initialize maintenance tracking for each ball
      ballsData.forEach(ball => {
        ballMaintenanceTracker.initializeBallMaintenance(ball.id, {
          name: ball.name,
          brand: ball.brand,
          weight: ball.weight,
          purchase_date: ball.created_at
        });
      });

      // Load maintenance overview and reminders
      const overview = ballMaintenanceTracker.getAllBallsOverview();
      const activeReminders = ballMaintenanceTracker.getAllActiveReminders();
      
      setMaintenanceOverview(overview);
      setReminders(activeReminders);
    } catch (error) {
      console.error('Failed to load maintenance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordMaintenance = () => {
    if (!selectedBall || !maintenanceForm.type) return;

    const maintenanceDetails = {
      description: maintenanceForm.description,
      cost: parseFloat(maintenanceForm.cost) || 0,
      location: maintenanceForm.location,
      notes: maintenanceForm.notes,
      performed_by: maintenanceForm.performed_by
    };

    ballMaintenanceTracker.recordMaintenance(
      selectedBall.ball_id,
      maintenanceForm.type,
      maintenanceDetails
    );

    // Reload data
    loadMaintenanceData();
    setShowMaintenanceModal(false);
    setMaintenanceForm({
      type: '',
      description: '',
      cost: '',
      location: '',
      notes: '',
      performed_by: 'self'
    });
  };

  const handleRecordGameUsage = (ballId) => {
    ballMaintenanceTracker.recordGameUsage(ballId, { new_session: true });
    loadMaintenanceData();
  };

  const handleDismissReminder = (reminderId) => {
    ballMaintenanceTracker.dismissReminder(reminderId);
    loadMaintenanceData();
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMaintenanceTypeLabel = (type) => {
    const labels = {
      cleaning: 'Basic Cleaning',
      deep_clean: 'Deep Clean',
      light_resurface: 'Light Resurfacing',
      full_resurface: 'Full Resurfacing',
      oil_extraction: 'Oil Extraction',
      plug_and_redrill: 'Plug & Re-drill'
    };
    return labels[type] || type;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'reminders', label: 'Reminders', icon: Bell, count: reminders.length },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Ball Maintenance" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Ball Maintenance"
        subtitle="Track usage, maintenance, and keep your equipment in perfect condition"
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
                  {tab.count !== undefined && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activeTab === tab.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-200 text-charcoal-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {maintenanceOverview.length === 0 ? (
            <Card>
              <CardContent className="text-center py-20">
                <Wrench className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
                  No balls to track
                </h3>
                <p className="text-charcoal-600">
                  Add bowling balls to your arsenal to start tracking maintenance
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {maintenanceOverview.map((ballData) => {
                const ball = balls.find(b => b.id === ballData.ball_id);
                const urgentNeeds = ballData.maintenance_needs.filter(n => n.urgency === 'high');
                
                return (
                  <Card key={ballData.ball_id} className={urgentNeeds.length > 0 ? 'border-red-200 bg-red-50' : ''}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {ball?.name?.charAt(0) || 'B'}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-charcoal-900">
                              {ball?.name || `Ball ${ballData.ball_id}`}
                            </h3>
                            <p className="text-charcoal-600">
                              {ball?.brand} • {ball?.weight}lbs
                            </p>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-charcoal-500">
                              <span>{ballData.stats?.total_games || 0} games</span>
                              <span>{ballData.stats?.ball_age_days || 0} days old</span>
                              {urgentNeeds.length > 0 && (
                                <span className="flex items-center text-red-600 font-medium">
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  {urgentNeeds.length} urgent
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRecordGameUsage(ballData.ball_id)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Game
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBall(ballData);
                              setShowMaintenanceModal(true);
                            }}
                          >
                            <Wrench className="w-4 h-4 mr-1" />
                            Maintenance
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedBall(ballData);
                              setShowHistoryModal(true);
                            }}
                          >
                            History
                          </Button>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-xl font-bold text-blue-900">
                            {ballData.stats?.total_games || 0}
                          </div>
                          <div className="text-sm text-blue-700">Games</div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-xl font-bold text-green-900">
                            ${(ballData.stats?.total_maintenance_cost || 0).toFixed(0)}
                          </div>
                          <div className="text-sm text-green-700">Maintenance Cost</div>
                        </div>
                        
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-xl font-bold text-purple-900">
                            {ballData.stats?.maintenance_count || 0}
                          </div>
                          <div className="text-sm text-purple-700">Services</div>
                        </div>
                        
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="text-xl font-bold text-yellow-900">
                            ${(ballData.stats?.cost_per_game || 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-yellow-700">Cost/Game</div>
                        </div>

                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-xl font-bold text-orange-900">
                            {ballData.maintenance_needs.length}
                          </div>
                          <div className="text-sm text-orange-700">Needs</div>
                        </div>
                      </div>

                      {/* Maintenance Needs */}
                      {ballData.maintenance_needs.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-charcoal-900 mb-3">
                            Maintenance Needed
                          </h4>
                          <div className="space-y-2">
                            {ballData.maintenance_needs.slice(0, 3).map((need, index) => (
                              <div key={index} className={`p-3 rounded-lg border ${getUrgencyColor(need.urgency)}`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">
                                      {getMaintenanceTypeLabel(need.type)}
                                    </div>
                                    <div className="text-sm opacity-75">
                                      {need.reason}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium capitalize">
                                      {need.urgency}
                                    </div>
                                    {need.overdue_by > 0 && (
                                      <div className="text-sm">
                                        {need.overdue_by} {need.type.includes('games') ? 'games' : 'days'} overdue
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {ballData.maintenance_needs.length > 3 && (
                              <div className="text-center">
                                <Button variant="ghost" size="sm">
                                  +{ballData.maintenance_needs.length - 3} more
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reminders Tab */}
      {activeTab === 'reminders' && (
        <div>
          {reminders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-20">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
                  All caught up!
                </h3>
                <p className="text-charcoal-600">
                  No maintenance reminders at the moment
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <Card key={reminder.id} className={reminder.urgency === 'high' ? 'border-red-200' : ''}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${getUrgencyColor(reminder.urgency)}`}>
                        {reminder.urgency === 'high' ? (
                          <AlertTriangle className="w-6 h-6" />
                        ) : (
                          <Clock className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-charcoal-900">
                          {reminder.ball_name} - {getMaintenanceTypeLabel(reminder.maintenance_type)}
                        </h3>
                        <p className="text-charcoal-600">{reminder.reason}</p>
                        <p className="text-sm text-charcoal-500">
                          Created {new Date(reminder.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const ballData = maintenanceOverview.find(b => b.ball_id === reminder.ball_id);
                          setSelectedBall(ballData);
                          setMaintenanceForm({ ...maintenanceForm, type: reminder.maintenance_type });
                          setShowMaintenanceModal(true);
                        }}
                      >
                        Record Maintenance
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismissReminder(reminder.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
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
          {/* Maintenance Cost Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Cost analysis chart would appear here</p>
                  <p className="text-sm text-gray-500">Showing maintenance costs over time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ball Performance vs Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance vs Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {maintenanceOverview.map((ballData) => {
                  const ball = balls.find(b => b.id === ballData.ball_id);
                  const stats = ballData.stats;
                  
                  return (
                    <div key={ballData.ball_id} className="text-center p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-charcoal-900 mb-2">
                        {ball?.name}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Maintenance Frequency:</span>
                          <span>{stats?.total_games > 0 ? Math.round(stats.total_games / (stats.maintenance_count || 1)) : 0} games/service</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost Efficiency:</span>
                          <span>${(stats?.cost_per_game || 0).toFixed(2)}/game</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Surface Condition:</span>
                          <span className="capitalize">{stats?.performance_status?.surface_wear}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Record Maintenance Modal */}
      <Modal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        title={`Record Maintenance - ${selectedBall?.ball_info?.name || 'Ball'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Maintenance Type
            </label>
            <select
              value={maintenanceForm.type}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })}
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select maintenance type...</option>
              <option value="cleaning">Basic Cleaning</option>
              <option value="deep_clean">Deep Clean</option>
              <option value="light_resurface">Light Resurfacing</option>
              <option value="full_resurface">Full Resurfacing</option>
              <option value="oil_extraction">Oil Extraction</option>
              <option value="plug_and_redrill">Plug & Re-drill</option>
            </select>
          </div>

          <Input
            label="Description"
            value={maintenanceForm.description}
            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
            placeholder="Brief description of work done"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cost"
              type="number"
              step="0.01"
              value={maintenanceForm.cost}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
              placeholder="0.00"
            />
            <Input
              label="Location"
              value={maintenanceForm.location}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, location: e.target.value })}
              placeholder="Pro shop, home, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Performed By
            </label>
            <select
              value={maintenanceForm.performed_by}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performed_by: e.target.value })}
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="self">Self</option>
              <option value="pro_shop">Pro Shop</option>
              <option value="professional">Professional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Notes
            </label>
            <textarea
              value={maintenanceForm.notes}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
              placeholder="Any additional notes or observations"
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setShowMaintenanceModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRecordMaintenance}
              disabled={!maintenanceForm.type}
            >
              Record Maintenance
            </Button>
          </div>
        </div>
      </Modal>

      {/* Maintenance History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`Maintenance History - ${selectedBall?.ball_info?.name || 'Ball'}`}
        size="lg"
      >
        {selectedBall && (
          <div className="space-y-4">
            {(() => {
              const history = ballMaintenanceTracker.getMaintenanceHistory(selectedBall.ball_id);
              return history.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-charcoal-400 mx-auto mb-4" />
                  <p className="text-charcoal-600">No maintenance history yet</p>
                </div>
              ) : (
                history.map((maintenance) => (
                  <div key={maintenance.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-charcoal-900">
                          {getMaintenanceTypeLabel(maintenance.type)}
                        </h4>
                        <span className="text-sm text-charcoal-500">
                          {new Date(maintenance.date).toLocaleDateString()}
                        </span>
                      </div>
                      {maintenance.details && (
                        <p className="text-charcoal-600 mb-2">{maintenance.details}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-charcoal-500">
                        {maintenance.cost > 0 && (
                          <span>Cost: ${maintenance.cost.toFixed(2)}</span>
                        )}
                        {maintenance.location && (
                          <span>Location: {maintenance.location}</span>
                        )}
                        <span>By: {maintenance.performed_by}</span>
                      </div>
                      {maintenance.notes && (
                        <p className="text-sm text-charcoal-500 mt-2 italic">
                          {maintenance.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BallMaintenancePage;