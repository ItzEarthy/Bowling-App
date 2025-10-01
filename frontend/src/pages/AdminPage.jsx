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
  Clock,
  Download,
  Upload,
  FileText,
  Server,
  Palette,
  Globe,
  Lock,
  Bell,
  Eye,
  Save,
  Search,
  Filter,
  MoreVertical,
  Trash,
  RefreshCw
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { userAPI } from '../lib/api';

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
  const [adminSettings, setAdminSettings] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editingSetting, setEditingSetting] = useState(null);
  
  // Form states
  const [newUserData, setNewUserData] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [settingValue, setSettingValue] = useState('');

  // Check admin access and load data when tab changes
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadAdminData();
  }, [user, navigate, activeTab]);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      const promises = [];
      
      if (activeTab === 'overview') {
        promises.push(userAPI.getAdminStats());
      } else if (activeTab === 'users') {
        promises.push(userAPI.getAllUsers());
      } else if (activeTab === 'settings') {
        promises.push(userAPI.getAdminSettings());
      } else if (activeTab === 'logs') {
        promises.push(userAPI.getSystemLogs(1, 50));
      }

      const responses = await Promise.all(promises);

      if (activeTab === 'overview') {
        setSystemStats(responses[0].data.stats);
      } else if (activeTab === 'users') {
        setUsers(responses[0].data.users || []);
      } else if (activeTab === 'settings') {
        setAdminSettings(responses[0].data.settings || []);
      } else if (activeTab === 'logs') {
        setSystemLogs(responses[0].data.logs || []);
      }
    } catch (err) {
      setError('Failed to load admin data');
      console.error('Admin data load error:', err);
    } finally {
      setIsLoading(false);
    }
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

  const handleCreateUser = async () => {
    try {
      await userAPI.createUser(newUserData);
      setShowCreateUserModal(false);
      setNewUserData({
        username: '',
        displayName: '',
        email: '',
        password: '',
        role: 'user'
      });
      loadAdminData(); // Reload users
    } catch (err) {
      setError('Failed to create user');
    }
  };

  const handleUpdateSetting = async () => {
    try {
      await userAPI.updateAdminSetting(editingSetting.setting_key, settingValue);
      setAdminSettings(prev => prev.map(s => 
        s.setting_key === editingSetting.setting_key 
          ? { ...s, setting_value: settingValue }
          : s
      ));
      setShowSettingsModal(false);
      setEditingSetting(null);
    } catch (err) {
      setError('Failed to update setting');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await userAPI.bulkUserOperation('delete', selectedUsers);
      setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
      setShowBulkModal(false);
    } catch (err) {
      setError('Failed to delete users');
    }
  };

  const handleCreateBackup = async () => {
    try {
      const response = await userAPI.createBackup();
      alert(`Backup created: ${response.data.backupPath}`);
    } catch (err) {
      setError('Failed to create backup');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = userFilter === 'all' || 
                         (userFilter === 'admin' && user.role === 'admin') ||
                         (userFilter === 'user' && user.role !== 'admin') ||
                         (userFilter === 'active' && (user.status || 'active') === 'active') ||
                         (userFilter === 'suspended' && (user.status || 'active') === 'suspended');
    
    return matchesSearch && matchesFilter;
  });

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
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-charcoal-900 shadow-sm'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'logs'
              ? 'bg-white text-charcoal-900 shadow-sm'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Logs
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
                  {systemStats?.users?.total_users || 0}
                </div>
                <div className="text-sm text-charcoal-600">Total Users</div>
                <div className="text-xs text-green-600 mt-1">
                  +{systemStats?.users?.new_users_week || 0} this week
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center p-6">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-charcoal-900 mb-1">
                  {systemStats?.games?.completed_games || 0}
                </div>
                <div className="text-sm text-charcoal-600">Completed Games</div>
                <div className="text-xs text-charcoal-500 mt-1">All time</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center p-6">
                <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-charcoal-900 mb-1">
                  {systemStats?.games?.total_games || 0}
                </div>
                <div className="text-sm text-charcoal-600">Total Games</div>
                <div className="text-xs text-green-600 mt-1">
                  +{systemStats?.games?.new_games_week || 0} this week
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center p-6">
                <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-charcoal-900 mb-1">
                  {Math.round(systemStats?.games?.avg_score || 0)}
                </div>
                <div className="text-sm text-charcoal-600">Avg Score</div>
                <div className="text-xs text-charcoal-500 mt-1">All games</div>
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
                    Excellent
                  </div>
                  <div className="text-sm text-charcoal-600">Overall Status</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {Math.floor((systemStats?.uptime || 0) / 3600)}h
                  </div>
                  <div className="text-sm text-charcoal-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {systemStats?.users?.admin_users || 0}
                  </div>
                  <div className="text-sm text-charcoal-600">Admin Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {systemStats?.recentActivity && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemStats.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-charcoal-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'user_registered' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {activity.type === 'user_registered' ? 
                          <Users className="w-4 h-4" /> : 
                          <Target className="w-4 h-4" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-charcoal-900">
                          {activity.type === 'user_registered' ? 'New User' : 'Game Completed'}
                        </div>
                        <div className="text-xs text-charcoal-600">
                          {activity.details}
                        </div>
                      </div>
                      <div className="text-xs text-charcoal-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Management Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-3 items-center flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-500" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="px-3 py-2 border border-charcoal-200 rounded-lg text-sm"
                  >
                    <option value="all">All Users</option>
                    <option value="admin">Admins</option>
                    <option value="user">Regular Users</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  {selectedUsers.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowBulkModal(true)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      Delete Selected ({selectedUsers.length})
                    </Button>
                  )}
                  <Button onClick={() => setShowCreateUserModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-charcoal-200">
                      <th className="text-left py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-charcoal-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-charcoal-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-charcoal-700">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-charcoal-700">Games</th>
                      <th className="text-left py-3 px-4 font-medium text-charcoal-700">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-charcoal-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-charcoal-100 hover:bg-charcoal-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(prev => [...prev, user.id]);
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded"
                          />
                        </td>
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
                        <td className="py-3 px-4 text-charcoal-700">{user.gameCount || 0}</td>
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

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>System Settings</span>
                <Button onClick={handleCreateBackup} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Create Backup
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminSettings.map((setting) => (
                  <div key={setting.setting_key} className="p-4 border border-charcoal-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-charcoal-900">
                        {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSetting(setting);
                          setSettingValue(setting.setting_value);
                          setShowSettingsModal(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-sm text-charcoal-600 mb-2">
                      {setting.description}
                    </div>
                    <div className="font-mono text-sm bg-charcoal-50 p-2 rounded">
                      {setting.setting_value}
                    </div>
                    {setting.updated_at && (
                      <div className="text-xs text-charcoal-500 mt-2">
                        Updated: {new Date(setting.updated_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>System Logs</span>
                <Button onClick={() => loadAdminData()} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemLogs.map((log) => (
                  <div key={log.id} className="flex items-center space-x-4 p-3 bg-charcoal-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-lg ${
                        log.action.includes('delete') ? 'bg-red-100 text-red-600' :
                        log.action.includes('create') ? 'bg-green-100 text-green-600' :
                        log.action.includes('update') ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <Activity className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-charcoal-900">
                          {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        {log.username && (
                          <span className="text-sm text-charcoal-600">
                            by @{log.username}
                          </span>
                        )}
                      </div>
                      {log.details && (
                        <div className="text-sm text-charcoal-600 truncate">
                          {log.details}
                        </div>
                      )}
                      <div className="text-xs text-charcoal-500 mt-1">
                        {new Date(log.created_at).toLocaleString()}
                        {log.ip_address && ` • ${log.ip_address}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Management Modals */}
      {showCreateUserModal && (
        <Modal
          isOpen={showCreateUserModal}
          onClose={() => {
            setShowCreateUserModal(false);
            setNewUser({ username: '', email: '', password: '', display_name: '', role: 'user' });
          }}
          title="Create New User"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Username
              </label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Display Name
              </label>
              <Input
                value={newUser.display_name}
                onChange={(e) => setNewUser(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Enter display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Role
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-charcoal-200 rounded-lg"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateUserModal(false);
                  setNewUser({ username: '', email: '', password: '', display_name: '', role: 'user' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateUser}>
                Create User
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showBulkModal && (
        <Modal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          title="Bulk Delete Users"
          size="sm"
        >
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Trash className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal-900 mb-2">
                Delete {selectedUsers.length} Users?
              </h3>
              <p className="text-charcoal-600">
                This will permanently delete all selected users and their associated data. 
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowBulkModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleBulkUserOperation('delete')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Users
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Settings Modal */}
      {showSettingsModal && editingSetting && (
        <Modal
          isOpen={showSettingsModal}
          onClose={() => {
            setShowSettingsModal(false);
            setEditingSetting(null);
            setSettingValue('');
          }}
          title={`Edit Setting: ${editingSetting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Description
              </label>
              <p className="text-sm text-charcoal-600 bg-charcoal-50 p-2 rounded">
                {editingSetting.description}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Value
              </label>
              {editingSetting.setting_key.includes('enabled') || editingSetting.setting_key.includes('allowed') ? (
                <select
                  value={settingValue}
                  onChange={(e) => setSettingValue(e.target.value)}
                  className="w-full px-3 py-2 border border-charcoal-200 rounded-lg"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : (
                <Input
                  value={settingValue}
                  onChange={(e) => setSettingValue(e.target.value)}
                  placeholder="Enter setting value"
                />
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSettingsModal(false);
                  setEditingSetting(null);
                  setSettingValue('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateSetting}>
                Update Setting
              </Button>
            </div>
          </div>
        </Modal>
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
              onClick={() => handleDeleteUser(userToDelete?.id)}
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