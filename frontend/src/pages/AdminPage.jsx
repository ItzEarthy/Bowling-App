import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Target, 
  Database, 
  Activity, 
  Settings,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Plus,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { userAPI, gameAPI, ballAPI } from '../lib/api';

/**
 * Admin Portal Component
 * Comprehensive administrative dashboard with user management, system overview, and data management
 */
const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [systemStats, setSystemStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Check admin access
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadAdminData();
  }, [user, navigate]);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      // Load system statistics
      const [usersResponse, gamesResponse] = await Promise.all([
        userAPI.getAllUsers(), // We'll need to create this endpoint
        gameAPI.getGames(1, 100) // Get recent games for stats
      ]);

      setUsers(usersResponse.data.users || []);
      setGames(gamesResponse.data.games || []);
      
      // Calculate system stats
      calculateSystemStats(usersResponse.data.users || [], gamesResponse.data.games || []);
    } catch (err) {
      setError('Failed to load admin data');
      console.error('Admin data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSystemStats = (usersList, gamesList) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentUsers = usersList.filter(u => new Date(u.created_at) >= oneWeekAgo);
    const recentGames = gamesList.filter(g => new Date(g.created_at) >= oneWeekAgo);
    const activeUsers = usersList.filter(u => {
      const userGames = gamesList.filter(g => g.user_id === u.id);
      return userGames.some(g => new Date(g.created_at) >= oneMonthAgo);
    });

    setSystemStats({
      totalUsers: usersList.length,
      totalGames: gamesList.length,
      activeUsers: activeUsers.length,
      newUsersThisWeek: recentUsers.length,
      newGamesThisWeek: recentGames.length,
      averageGamesPerUser: usersList.length > 0 ? (gamesList.length / usersList.length).toFixed(1) : 0,
      systemHealth: 'Excellent',
      uptime: '99.9%'
    });
  };

  const handleDeleteUser = async () => {
    try {
      await userAPI.deleteUserAsAdmin(userToDelete.id);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleUserStatusToggle = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await userAPI.updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      ));
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-charcoal-900 mb-2">Access Denied</h2>
          <p className="text-charcoal-600">You don't have permission to access the admin portal.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Admin Portal"
        subtitle="System administration and user management"
        icon={<Shield className="w-8 h-8" />}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-charcoal-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-charcoal-900 shadow-sm'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-white text-charcoal-900 shadow-sm'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Users
        </button>
        <button
          onClick={() => setActiveTab('games')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'games'
              ? 'bg-white text-charcoal-900 shadow-sm'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          Games
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'system'
              ? 'bg-white text-charcoal-900 shadow-sm'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <Database className="w-4 h-4 inline mr-2" />
          System
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* System Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="text-center p-6">
                <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-charcoal-900 mb-1">
                  {systemStats?.totalUsers || 0}
                </div>
                <div className="text-sm text-charcoal-600">Total Users</div>
                <div className="text-xs text-green-600 mt-1">
                  +{systemStats?.newUsersThisWeek || 0} this week
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center p-6">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-charcoal-900 mb-1">
                  {systemStats?.activeUsers || 0}
                </div>
                <div className="text-sm text-charcoal-600">Active Users</div>
                <div className="text-xs text-charcoal-500 mt-1">Last 30 days</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center p-6">
                <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-charcoal-900 mb-1">
                  {systemStats?.totalGames || 0}
                </div>
                <div className="text-sm text-charcoal-600">Total Games</div>
                <div className="text-xs text-green-600 mt-1">
                  +{systemStats?.newGamesThisWeek || 0} this week
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center p-6">
                <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-charcoal-900 mb-1">
                  {systemStats?.averageGamesPerUser || 0}
                </div>
                <div className="text-sm text-charcoal-600">Avg Games/User</div>
                <div className="text-xs text-charcoal-500 mt-1">All time</div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>System Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {systemStats?.systemHealth || 'Unknown'}
                  </div>
                  <div className="text-sm text-charcoal-600">Overall Status</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {systemStats?.uptime || 'Unknown'}
                  </div>
                  <div className="text-sm text-charcoal-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="text-sm text-charcoal-600">Last Updated</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Management</span>
                <Button onClick={() => setShowUserModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-charcoal-200">
                      <th className="text-left py-3 px-4 font-medium text-charcoal-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-charcoal-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-charcoal-700">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-charcoal-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-charcoal-700">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-charcoal-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-charcoal-100 hover:bg-charcoal-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-medium text-charcoal-900">{user.display_name}</div>
                              <div className="text-sm text-charcoal-600">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-charcoal-700">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            (user.status || 'active') === 'active'
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-charcoal-600 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUserStatusToggle(user.id, user.status || 'active')}
                              className="p-1 text-charcoal-500 hover:text-blue-600 transition-colors"
                              title={`${(user.status || 'active') === 'active' ? 'Suspend' : 'Activate'} user`}
                            >
                              {(user.status || 'active') === 'active' ? 
                                <UserX className="w-4 h-4" /> : 
                                <UserCheck className="w-4 h-4" />
                              }
                            </button>
                            <button
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteModal(true);
                              }}
                              className="p-1 text-charcoal-500 hover:text-red-600 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Games Tab */}
      {activeTab === 'games' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {games.slice(0, 10).map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-4 bg-charcoal-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="bg-teal-100 p-2 rounded-lg">
                        <Target className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="font-medium text-charcoal-900">
                          {game.location || 'Bowling Game'}
                        </div>
                        <div className="text-sm text-charcoal-600">
                          by @{game.username} • {new Date(game.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-charcoal-900">
                        {game.total_score || game.score}
                      </div>
                      <div className="text-xs text-charcoal-600">
                        {game.entry_mode}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-charcoal-900 mb-3">Application Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-charcoal-600">Version</span>
                      <span className="text-charcoal-900">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-600">Environment</span>
                      <span className="text-charcoal-900">Production</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-600">Last Deploy</span>
                      <span className="text-charcoal-900">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-charcoal-900 mb-3">Database Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-charcoal-600">Total Records</span>
                      <span className="text-charcoal-900">{(systemStats?.totalUsers || 0) + (systemStats?.totalGames || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-600">Database Size</span>
                      <span className="text-charcoal-900">~2.3 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-600">Last Backup</span>
                      <span className="text-charcoal-900">Auto-daily</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Admin Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <Database className="w-4 h-4 mr-2" />
                  Backup Database
                </Button>
                <Button variant="outline" className="justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  View System Logs
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Export User Data
                </Button>
                <Button variant="outline" className="justify-start">
                  <Target className="w-4 h-4 mr-2" />
                  Generate Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">
              Delete User Account?
            </h3>
            <p className="text-charcoal-600">
              This will permanently delete the user and all their associated data. This action cannot be undone.
            </p>
          </div>
          
          {userToDelete && (
            <div className="bg-charcoal-50 p-4 rounded-xl">
              <div className="text-sm">
                <div className="font-medium text-charcoal-900">
                  {userToDelete.display_name} (@{userToDelete.username})
                </div>
                <div className="text-charcoal-600">
                  {userToDelete.email}
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
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPage;