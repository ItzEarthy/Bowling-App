import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit, Trash2, TrendingUp, Award, Calendar, CheckCircle, Clock, Star } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { gameAPI } from '../lib/api';

/**
 * Goal Setting and Progress Tracking Page
 * Allows users to set bowling goals and track progress
 */
const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, completed, overdue

  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    type: 'score', // score, average, strikes, spares, games, consistency
    target: '',
    currentValue: 0,
    deadline: '',
    priority: 'medium' // low, medium, high
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [goalsData, gamesResponse] = await Promise.all([
        loadGoals(),
        gameAPI.getGames(1, 1000)
      ]);
      
      setGames(gamesResponse.data.games || []);
      calculateGoalProgress(goalsData, gamesResponse.data.games || []);
    } catch (error) {
      console.error('Failed to load goal data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock goal storage - in real app would be API calls
  const loadGoals = async () => {
    const stored = localStorage.getItem('bowling-goals');
    const goals = stored ? JSON.parse(stored) : getDefaultGoals();
    setGoals(goals);
    return goals;
  };

  const saveGoals = async (updatedGoals) => {
    localStorage.setItem('bowling-goals', JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
  };

  const getDefaultGoals = () => [
    {
      id: 1,
      title: 'Break 200',
      description: 'Roll a game with score of 200 or higher',
      type: 'score',
      target: 200,
      currentValue: 0,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'high',
      progress: 0,
      isCompleted: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Maintain 150+ Average',
      description: 'Keep your average score above 150 for 10 consecutive games',
      type: 'average',
      target: 150,
      currentValue: 0,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      progress: 0,
      isCompleted: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    }
  ];

  const calculateGoalProgress = (currentGoals, gameData) => {
    const updatedGoals = currentGoals.map(goal => {
      let progress = 0;
      let currentValue = 0;
      let isCompleted = goal.isCompleted;

      switch (goal.type) {
        case 'score':
          const highScore = Math.max(...gameData.map(game => game.total_score || 0), 0);
          currentValue = highScore;
          progress = Math.min((currentValue / goal.target) * 100, 100);
          if (currentValue >= goal.target && !isCompleted) {
            isCompleted = true;
          }
          break;

        case 'average':
          if (gameData.length >= 10) {
            const recent10 = gameData.slice(-10);
            const average = recent10.reduce((sum, game) => sum + (game.total_score || 0), 0) / 10;
            currentValue = Math.round(average);
            progress = Math.min((currentValue / goal.target) * 100, 100);
            if (currentValue >= goal.target && !isCompleted) {
              isCompleted = true;
            }
          }
          break;

        case 'strikes':
          const totalStrikes = gameData.reduce((sum, game) => sum + (game.strikes || 0), 0);
          currentValue = totalStrikes;
          progress = Math.min((currentValue / goal.target) * 100, 100);
          if (currentValue >= goal.target && !isCompleted) {
            isCompleted = true;
          }
          break;

        case 'spares':
          const totalSpares = gameData.reduce((sum, game) => sum + (game.spares || 0), 0);
          currentValue = totalSpares;
          progress = Math.min((currentValue / goal.target) * 100, 100);
          if (currentValue >= goal.target && !isCompleted) {
            isCompleted = true;
          }
          break;

        case 'games':
          currentValue = gameData.length;
          progress = Math.min((currentValue / goal.target) * 100, 100);
          if (currentValue >= goal.target && !isCompleted) {
            isCompleted = true;
          }
          break;

        case 'consistency':
          if (gameData.length >= 5) {
            const scores = gameData.slice(-10).map(game => game.total_score || 0);
            const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
            const standardDeviation = Math.sqrt(variance);
            const consistency = Math.max(0, 100 - (standardDeviation / mean) * 100);
            currentValue = Math.round(consistency);
            progress = Math.min((currentValue / goal.target) * 100, 100);
            if (currentValue >= goal.target && !isCompleted) {
              isCompleted = true;
            }
          }
          break;
      }

      return {
        ...goal,
        currentValue,
        progress,
        isCompleted,
        completedAt: isCompleted && !goal.isCompleted ? new Date().toISOString() : goal.completedAt
      };
    });

    saveGoals(updatedGoals);
  };

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setGoalForm({
      title: '',
      description: '',
      type: 'score',
      target: '',
      currentValue: 0,
      deadline: '',
      priority: 'medium'
    });
    setShowGoalModal(true);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      title: goal.title,
      description: goal.description,
      type: goal.type,
      target: goal.target.toString(),
      currentValue: goal.currentValue,
      deadline: goal.deadline,
      priority: goal.priority
    });
    setShowGoalModal(true);
  };

  const handleSaveGoal = async () => {
    const goalData = {
      ...goalForm,
      target: parseFloat(goalForm.target),
      id: editingGoal ? editingGoal.id : Date.now(),
      progress: 0,
      isCompleted: false,
      completedAt: null,
      createdAt: editingGoal ? editingGoal.createdAt : new Date().toISOString()
    };

    let updatedGoals;
    if (editingGoal) {
      updatedGoals = goals.map(goal => goal.id === editingGoal.id ? { ...goal, ...goalData } : goal);
    } else {
      updatedGoals = [...goals, goalData];
    }

    await saveGoals(updatedGoals);
    calculateGoalProgress(updatedGoals, games);
    setShowGoalModal(false);
  };

  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      const updatedGoals = goals.filter(goal => goal.id !== goalId);
      await saveGoals(updatedGoals);
    }
  };

  const getFilteredGoals = () => {
    const now = new Date();
    
    switch (filter) {
      case 'active':
        return goals.filter(goal => !goal.isCompleted && new Date(goal.deadline) >= now);
      case 'completed':
        return goals.filter(goal => goal.isCompleted);
      case 'overdue':
        return goals.filter(goal => !goal.isCompleted && new Date(goal.deadline) < now);
      default:
        return goals;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getGoalTypeLabel = (type) => {
    const labels = {
      score: 'High Score',
      average: 'Average Score',
      strikes: 'Total Strikes',
      spares: 'Total Spares',
      games: 'Games Played',
      consistency: 'Consistency %'
    };
    return labels[type] || type;
  };

  const goalStats = {
    total: goals.length,
    completed: goals.filter(goal => goal.isCompleted).length,
    active: goals.filter(goal => !goal.isCompleted && new Date(goal.deadline) >= new Date()).length,
    overdue: goals.filter(goal => !goal.isCompleted && new Date(goal.deadline) < new Date()).length
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Goals" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const filteredGoals = getFilteredGoals();

  return (
    <div>
      <PageHeader 
        title="Goals"
        subtitle="Set targets and track your bowling progress"
        action={
          <Button onClick={handleCreateGoal}>
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        }
      />

      {/* Goal Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="text-center py-6">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-charcoal-900">{goalStats.total}</div>
            <div className="text-sm text-charcoal-600">Total Goals</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-6">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-charcoal-900">{goalStats.active}</div>
            <div className="text-sm text-charcoal-600">Active</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-6">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-charcoal-900">{goalStats.completed}</div>
            <div className="text-sm text-charcoal-600">Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-6">
            <TrendingUp className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-charcoal-900">{goalStats.overdue}</div>
            <div className="text-sm text-charcoal-600">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'All Goals' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
              { key: 'overdue', label: 'Overdue' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-500 text-white'
                    : 'text-charcoal-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-20">
            <Target className="w-16 h-16 text-charcoal-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
              {filter === 'all' ? 'No goals yet' : `No ${filter} goals`}
            </h3>
            <p className="text-charcoal-600 mb-6">
              {filter === 'all' 
                ? 'Set your first bowling goal to start tracking progress'
                : `You don't have any ${filter} goals at the moment`
              }
            </p>
            {filter === 'all' && (
              <Button onClick={handleCreateGoal}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map((goal) => {
            const isOverdue = !goal.isCompleted && new Date(goal.deadline) < new Date();
            const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              <Card key={goal.id} className={`${goal.isCompleted ? 'opacity-75' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`text-lg font-semibold ${
                          goal.isCompleted ? 'text-green-700 line-through' : 'text-charcoal-900'
                        }`}>
                          {goal.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(goal.priority)}`}>
                          {goal.priority}
                        </span>
                        {goal.isCompleted && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-charcoal-600 mb-3">{goal.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-charcoal-500">
                        <span>Type: {getGoalTypeLabel(goal.type)}</span>
                        <span>Target: {goal.target}</span>
                        <span>Current: {goal.currentValue}</span>
                        {!goal.isCompleted && (
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditGoal(goal)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(goal.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal-600">Progress</span>
                      <span className="font-medium text-charcoal-900">{Math.round(goal.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          goal.isCompleted 
                            ? 'bg-green-500' 
                            : goal.progress >= 75 
                              ? 'bg-blue-500' 
                              : goal.progress >= 50 
                                ? 'bg-yellow-500' 
                                : 'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Goal Creation/Edit Modal */}
      <Modal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title={editingGoal ? 'Edit Goal' : 'Create New Goal'}
      >
        <div className="space-y-4">
          <Input
            label="Goal Title"
            value={goalForm.title}
            onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
            placeholder="e.g., Break 200, Improve average..."
          />

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Description
            </label>
            <textarea
              value={goalForm.description}
              onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
              placeholder="Describe what you want to achieve..."
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Goal Type
              </label>
              <select
                value={goalForm.type}
                onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="score">High Score</option>
                <option value="average">Average Score</option>
                <option value="strikes">Total Strikes</option>
                <option value="spares">Total Spares</option>
                <option value="games">Games Played</option>
                <option value="consistency">Consistency %</option>
              </select>
            </div>

            <Input
              label="Target Value"
              type="number"
              value={goalForm.target}
              onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
              placeholder="e.g., 200, 150..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={goalForm.deadline}
                onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Priority
              </label>
              <select
                value={goalForm.priority}
                onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value })}
                className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setShowGoalModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveGoal}
              disabled={!goalForm.title || !goalForm.target || !goalForm.deadline}
            >
              {editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GoalsPage;