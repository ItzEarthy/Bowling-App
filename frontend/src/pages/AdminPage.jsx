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
  RefreshCw,
  User,
  Mail,
  EyeOff,
  Camera,
  LogOut
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { userAPI, gameAPI, friendAPI } from '../lib/api';

/**
 * Admin Portal Component
 * Comprehensive administrative dashboard with user management, system overview, and data management
 */
const AdminPage = () => {
  const navigate = useNavigate();
  const { user: currentUser, updateUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
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
  
  // Game management states
  const [gameSearchTerm, setGameSearchTerm] = useState('');
  const [gameUserFilter, setGameUserFilter] = useState('all');
  const [gameDateFilter, setGameDateFilter] = useState('all');
  const [gameScoreFilter, setGameScoreFilter] = useState('all');
  const [selectedGames, setSelectedGames] = useState([]);
  const [showGameDeleteModal, setShowGameDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editingSetting, setEditingSetting] = useState(null);
  const [editUserData, setEditUserData] = useState({
    username: '',
    displayName: '',
    email: ''
  });
  
  // Form states
  const [newUserData, setNewUserData] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [settingValue, setSettingValue] = useState('');

  // Admin Profile States
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileSubTab, setProfileSubTab] = useState('info');
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  
  const [profileData, setProfileData] = useState({
    username: '',
    displayName: '',
    email: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Check admin access and load data when tab changes
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    if (activeTab === 'profile') {
      loadProfileData();
    } else {
      loadAdminData();
    }
  }, [navigate, activeTab]); // Removed currentUser from dependencies to prevent infinite loop

  // Initialize profile data when user changes
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        username: currentUser.username || '',
        displayName: currentUser.displayName || currentUser.display_name || '',
        email: currentUser.email || ''
      });
    }
  }, [currentUser]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getAdminProfile();
      const userData = response.data.user;
      
      setProfileData({
        username: userData.username || '',
        displayName: userData.displayName || '',
        email: userData.email || ''
      });
      
      // Update auth store with fresh data
      updateUser(userData);
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Profile data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      const promises = [];
      
      if (activeTab === 'overview') {
        promises.push(userAPI.getAdminStats());
      } else if (activeTab === 'users') {
        promises.push(userAPI.getAllUsers());
      } else if (activeTab === 'games') {
        promises.push(gameAPI.getGames());
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
      } else if (activeTab === 'games') {
        setGames(responses[0].data.games || []);
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

  const handleToggleAdminRole = async (targetUser) => {
    if (targetUser.id === currentUser.id) {
      setError('Cannot change your own admin status');
      return;
    }
    
    try {
      const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
      await userAPI.updateUserStatus(targetUser.id, targetUser.status || 'active', newRole);
      setUsers(prev => prev.map(u => 
        u.id === targetUser.id ? { ...u, role: newRole } : u
      ));
      setSuccess(`${targetUser.username} is now ${newRole === 'admin' ? 'an admin' : 'a regular user'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  const handleForceLogout = async (targetUser) => {
    try {
      // This would typically invalidate the user's session on the backend
      await userAPI.forceLogout(targetUser.id);
      setSuccess(`${targetUser.username} has been logged out`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to force logout: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  const handleEditUser = (targetUser) => {
    setSelectedUser(targetUser);
    setEditUserData({
      username: targetUser.username,
      displayName: targetUser.display_name,
      email: targetUser.email || ''
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      await userAPI.updateUser(selectedUser.id, editUserData);
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id ? { ...u, ...editUserData, display_name: editUserData.displayName } : u
      ));
      setShowEditUserModal(false);
      setSelectedUser(null);
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update user: ' + (err.response?.data?.error || 'Unknown error'));
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
          ? { ...s, setting_value: settingValue, updated_at: new Date().toISOString() }
          : s
      ));
      setShowSettingsModal(false);
      setEditingSetting(null);
      setSettingValue('');
      setSuccess('Setting updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update setting');
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

  // Profile management functions
  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      
      setProfilePicture(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  };

  const handleProfilePictureClick = () => {
    document.getElementById('admin-profile-picture-input').click();
  };

  const validateProfile = () => {
    if (!profileData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!profileData.displayName.trim()) {
      setError('Display name is required');
      return false;
    }
    if (!profileData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword) {
      setError('Current password is required');
      return false;
    }
    if (!passwordData.newPassword) {
      setError('New password is required');
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    setIsSaving(true);
    setError(null);
    try {
      const response = await userAPI.updateAdminProfile({
        username: profileData.username,
        displayName: profileData.displayName,
        email: profileData.email
      });

      // Update the auth store with new user data
      updateUser(response.data.user);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setIsSaving(true);
    setError(null);
    try {
      await userAPI.changeAdminPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteGame = async (gameId) => {
    try {
      await gameAPI.deleteGame(gameId);
      setGames(prev => prev.filter(g => g.id !== gameId));
      setShowGameDeleteModal(false);
      setGameToDelete(null);
      setSuccess('Game deleted successfully');
    } catch (err) {
      setError('Failed to delete game');
    }
  };

  const handleBulkDeleteGames = async () => {
    try {
      await Promise.all(selectedGames.map(gameId => gameAPI.deleteGame(gameId)));
      setGames(prev => prev.filter(g => !selectedGames.includes(g.id)));
      setSelectedGames([]);
      setSuccess(`${selectedGames.length} games deleted successfully`);
    } catch (err) {
      setError('Failed to delete games');
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

  const filteredGames = games.filter(game => {
    // Search filter
    const matchesSearch = !gameSearchTerm || 
                         game.user_display_name?.toLowerCase().includes(gameSearchTerm.toLowerCase()) ||
                         game.user_username?.toLowerCase().includes(gameSearchTerm.toLowerCase()) ||
                         game.location?.toLowerCase().includes(gameSearchTerm.toLowerCase());
    
    // User filter (if we want to filter by a specific user)
    const matchesUser = gameUserFilter === 'all' || game.user_id === parseInt(gameUserFilter);
    
    // Date filter
    const now = new Date();
    const gameDate = new Date(game.played_at || game.created_at);
    let matchesDate = true;
    
    if (gameDateFilter === 'today') {
      matchesDate = gameDate.toDateString() === now.toDateString();
    } else if (gameDateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = gameDate >= weekAgo;
    } else if (gameDateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = gameDate >= monthAgo;
    }
    
    // Score filter
    let matchesScore = true;
    if (gameScoreFilter === 'high') {
      matchesScore = game.total_score >= 200;
    } else if (gameScoreFilter === 'medium') {
      matchesScore = game.total_score >= 150 && game.total_score < 200;
    } else if (gameScoreFilter === 'low') {
      matchesScore = game.total_score < 150;
    }
    
    return matchesSearch && matchesUser && matchesDate && matchesScore;
  });

  if (!currentUser || currentUser.role !== 'admin') {
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

  // Render header and navigation even while loading so the app chrome stays visible.
  return (
    <div>
      <PageHeader 
        title="Admin Portal"
        subtitle="System administration and user management"
        icon={<Shield className="w-8 h-8" />}
        action={
          <Button onClick={handleLogout} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        }
      />

      {/* Show a local spinner in the content area when loading instead of returning early */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {/* Tab Navigation - Responsive, No Scrolling, Wraps to New Line */}
      <nav className="w-full mb-6 bg-charcoal-100 rounded-lg">
        <div className="flex flex-wrap gap-1 p-1 min-w-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-shrink-0 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-white text-charcoal-900 shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-shrink-0 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-white text-charcoal-900 shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Users</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-shrink-0 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white text-charcoal-900 shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <User className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`flex-shrink-0 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'games'
                ? 'bg-white text-charcoal-900 shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Target className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Games</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-shrink-0 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-white text-charcoal-900 shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-shrink-0 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-white text-charcoal-900 shadow-sm'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Logs</span>
          </button>
        </div>
      </nav>

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
                            {user.profile_picture || user.profilePicture ? (
                              <img 
                                src={user.profile_picture || user.profilePicture} 
                                alt={user.display_name}
                                className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
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
                              onClick={() => handleToggleAdminRole(user)}
                              className="p-1 text-charcoal-500 hover:text-purple-600 transition-colors"
                              title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                              disabled={user.id === currentUser?.id}
                            >
                              <Shield className={`w-4 h-4 ${user.role === 'admin' ? 'fill-purple-600' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleForceLogout(user)}
                              className="p-1 text-charcoal-500 hover:text-orange-600 transition-colors"
                              title="Force logout"
                            >
                              <LogOut className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-1 text-charcoal-500 hover:text-blue-600 transition-colors"
                              title="Edit user data"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
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

      {/* My Profile Tab */}
      {activeTab === 'profile' && (
        <div>
          {/* Profile Sub-Tab Navigation */}
          <div className="flex space-x-1 bg-charcoal-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setProfileSubTab('info')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                profileSubTab === 'info'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profile Info
            </button>
            <button
              onClick={() => setProfileSubTab('password')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                profileSubTab === 'password'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Change Password
            </button>
            <button
              onClick={() => setProfileSubTab('games')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                profileSubTab === 'games'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              My Games
            </button>
          </div>

          {/* Profile Info Sub-Tab */}
          {profileSubTab === 'info' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    {profilePicturePreview ? (
                      <img 
                        src={profilePicturePreview} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-charcoal-200"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {profileData.displayName.charAt(0).toUpperCase() || 'A'}
                      </div>
                    )}
                    <button 
                      onClick={handleProfilePictureClick}
                      className="absolute -bottom-2 -right-2 bg-white border-2 border-charcoal-200 rounded-full p-2 hover:bg-charcoal-50 transition-colors"
                      title="Change profile picture"
                    >
                      <Camera className="w-4 h-4 text-charcoal-600" />
                    </button>
                    {/* Hidden file input */}
                    <input
                      id="admin-profile-picture-input"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-charcoal-900">{profileData.displayName}</h3>
                    <p className="text-charcoal-600">@{profileData.username}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-600 font-medium">Administrator</span>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Username
                    </label>
                    <Input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => handleProfileChange('username', e.target.value)}
                      placeholder="Enter username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Display Name
                    </label>
                    <Input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => handleProfileChange('displayName', e.target.value)}
                      placeholder="Enter display name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-6"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Password Sub-Tab */}
          {profileSubTab === 'password' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Change Password</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-charcoal-500 hover:text-charcoal-700"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-charcoal-500 hover:text-charcoal-700"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-charcoal-500 hover:text-charcoal-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• At least 6 characters long</li>
                    <li>• Must be different from your current password</li>
                  </ul>
                </div>

                {/* Change Password Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    className="px-6"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Games Sub-Tab */}
          {profileSubTab === 'games' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>My Games</span>
                  </div>
                  <Button onClick={() => navigate('/game-setup')} variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Game
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-charcoal-400 mx-auto mb-4" />
                  <p className="text-charcoal-600 font-medium">Access All Game Features</p>
                  <p className="text-charcoal-500 text-sm mb-4">
                    As an admin, you have access to all user features including game tracking
                  </p>
                  <div className="space-y-2">
                    <Button onClick={() => navigate('/dashboard')} variant="outline" className="mr-2">
                      View Dashboard
                    </Button>
                    <Button onClick={() => navigate('/game-log')} variant="outline" className="mr-2">
                      Game History
                    </Button>
                    <Button onClick={() => navigate('/stats')} variant="outline">
                      View Stats
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Games Tab */}
      {activeTab === 'games' && (
        <div className="space-y-6">
          {/* Game Management Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-500" />
                    <Input
                      placeholder="Search games by user, location..."
                      value={gameSearchTerm}
                      onChange={(e) => setGameSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  {selectedGames.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleBulkDeleteGames}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      Delete Selected ({selectedGames.length})
                    </Button>
                  )}
                </div>
                
                {/* Filter Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={gameDateFilter}
                    onChange={(e) => setGameDateFilter(e.target.value)}
                    className="px-3 py-2 border border-charcoal-200 rounded-lg text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                  
                  <select
                    value={gameScoreFilter}
                    onChange={(e) => setGameScoreFilter(e.target.value)}
                    className="px-3 py-2 border border-charcoal-200 rounded-lg text-sm"
                  >
                    <option value="all">All Scores</option>
                    <option value="high">High (200+)</option>
                    <option value="medium">Medium (150-199)</option>
                    <option value="low">Low (&lt;150)</option>
                  </select>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGameSearchTerm('');
                      setGameUserFilter('all');
                      setGameDateFilter('all');
                      setGameScoreFilter('all');
                      setSelectedGames([]);
                    }}
                    className="whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Games List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Games ({filteredGames.length})</span>
                <div className="text-sm font-normal text-charcoal-600">
                  Showing {filteredGames.length} of {games.length} total games
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredGames.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-charcoal-400 mx-auto mb-4" />
                  <p className="text-charcoal-600 font-medium">No Games Found</p>
                  <p className="text-charcoal-500 text-sm">
                    {games.length === 0 ? 'No games have been played yet' : 'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-charcoal-200">
                        <th className="text-left py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedGames.length === filteredGames.length && filteredGames.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGames(filteredGames.map(g => g.id));
                              } else {
                                setSelectedGames([]);
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-charcoal-700">Player</th>
                        <th className="text-left py-3 px-4 font-medium text-charcoal-700">Score</th>
                        <th className="text-left py-3 px-4 font-medium text-charcoal-700">Location</th>
                        <th className="text-left py-3 px-4 font-medium text-charcoal-700">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-charcoal-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGames.map((game) => (
                        <tr key={game.id} className="border-b border-charcoal-100 hover:bg-charcoal-50">
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedGames.includes(game.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGames(prev => [...prev, game.id]);
                                } else {
                                  setSelectedGames(prev => prev.filter(id => id !== game.id));
                                }
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {game.user_display_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div className="font-medium text-charcoal-900">{game.user_display_name || 'Unknown User'}</div>
                                <div className="text-sm text-charcoal-600">@{game.user_username || 'unknown'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span className={`text-lg font-bold ${
                                game.total_score >= 200 ? 'text-green-600' :
                                game.total_score >= 150 ? 'text-blue-600' :
                                'text-charcoal-900'
                              }`}>
                                {game.total_score}
                              </span>
                              {game.total_score >= 200 && (
                                <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded">
                                  High
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-charcoal-700">
                            {game.location || 'Not specified'}
                          </td>
                          <td className="py-3 px-4 text-charcoal-600 text-sm">
                            <div>{new Date(game.played_at || game.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-charcoal-500">
                              {new Date(game.played_at || game.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => navigate(`/game/${game.id}`)}
                                className="p-1 text-charcoal-500 hover:text-blue-600 transition-colors"
                                title="View game details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setGameToDelete(game);
                                  setShowGameDeleteModal(true);
                                }}
                                className="p-1 text-charcoal-500 hover:text-red-600 transition-colors"
                                title="Delete game"
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
              )}
            </CardContent>
          </Card>

          {/* Game Statistics Summary */}
          {games.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="text-center p-6">
                  <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-charcoal-900 mb-1">
                    {games.length}
                  </div>
                  <div className="text-sm text-charcoal-600">Total Games</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center p-6">
                  <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-charcoal-900 mb-1">
                    {Math.round(games.reduce((sum, g) => sum + g.total_score, 0) / games.length) || 0}
                  </div>
                  <div className="text-sm text-charcoal-600">Avg Score</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center p-6">
                  <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-charcoal-900 mb-1">
                    {Math.max(...games.map(g => g.total_score), 0)}
                  </div>
                  <div className="text-sm text-charcoal-600">High Score</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center p-6">
                  <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
                    <Activity className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="text-3xl font-bold text-charcoal-900 mb-1">
                    {games.filter(g => g.total_score >= 200).length}
                  </div>
                  <div className="text-sm text-charcoal-600">200+ Games</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Settings Info Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-charcoal-900">System Configuration</h3>
                  <p className="text-sm text-charcoal-600">
                    Configure system-wide settings and behavior. Changes take effect immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>System Settings</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                    {adminSettings.length} Settings
                  </span>
                </div>
                <Button onClick={handleCreateBackup} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Create Backup
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {adminSettings.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-charcoal-400 mx-auto mb-4" />
                  <p className="text-charcoal-600 font-medium">No Settings Found</p>
                  <p className="text-charcoal-500 text-sm">
                    System settings will appear here once configured
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adminSettings.map((setting) => (
                    <div key={setting.setting_key} className="p-5 border border-charcoal-200 rounded-xl hover:border-charcoal-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-charcoal-900 mb-1">
                            {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-charcoal-600">
                            {setting.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingSetting(setting);
                            setSettingValue(setting.setting_value);
                            setShowSettingsModal(true);
                          }}
                          className="ml-3"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                      
                      <div className="bg-charcoal-50 p-3 rounded-lg border border-charcoal-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-charcoal-500 font-medium uppercase tracking-wide">
                            Current Value
                          </span>
                          {(setting.setting_value === 'true' || setting.setting_value === 'false') && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              setting.setting_value === 'true' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {setting.setting_value === 'true' ? 'Enabled' : 'Disabled'}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-sm text-charcoal-900 mt-2 break-all">
                          {setting.setting_value}
                        </div>
                      </div>
                      
                      {setting.updated_at && (
                        <div className="flex items-center space-x-1 text-xs text-charcoal-500 mt-3">
                          <Clock className="w-3 h-3" />
                          <span>Last updated: {new Date(setting.updated_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Logs Info Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-charcoal-900">System Activity Logs</h3>
                    <p className="text-sm text-charcoal-600">
                      Track administrative actions and system events in real-time
                    </p>
                  </div>
                </div>
                <Button onClick={() => loadAdminData()} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Recent Activity</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded">
                  {systemLogs.length} Logs
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemLogs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-charcoal-400 mx-auto mb-4" />
                  <p className="text-charcoal-600 font-medium">No Logs Found</p>
                  <p className="text-charcoal-500 text-sm">
                    System activity logs will appear here as admin actions are performed
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {systemLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-4 p-4 bg-charcoal-50 rounded-xl hover:bg-charcoal-100 transition-colors border border-charcoal-100">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-lg ${
                          log.action.includes('delete') ? 'bg-red-100 text-red-600' :
                          log.action.includes('create') ? 'bg-green-100 text-green-600' :
                          log.action.includes('update') ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <Activity className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-charcoal-900">
                            {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          {log.username && (
                            <span className="text-sm text-charcoal-600">
                              by <span className="font-medium">@{log.username}</span>
                            </span>
                          )}
                        </div>
                        {log.details && (
                          <div className="text-sm text-charcoal-700 mb-2">
                            {log.details}
                          </div>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-charcoal-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                          {log.ip_address && (
                            <div className="flex items-center space-x-1">
                              <Globe className="w-3 h-3" />
                              <span>{log.ip_address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            setNewUserData({ username: '', displayName: '', email: '', password: '', role: 'user' });
          }}
          title="Create New User"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Username
              </label>
              <Input
                value={newUserData.username}
                onChange={(e) => setNewUserData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Display Name
              </label>
              <Input
                value={newUserData.displayName}
                onChange={(e) => setNewUserData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Enter display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Role
              </label>
              <select
                value={newUserData.role}
                onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value }))}
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
                  setNewUserData({ username: '', displayName: '', email: '', password: '', role: 'user' });
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

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <Modal
          isOpen={showEditUserModal}
          onClose={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
            setEditUserData({
              username: '',
              displayName: '',
              email: ''
            });
          }}
          title="Edit User"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Username
              </label>
              <Input
                value={editUserData.username}
                onChange={(e) => setEditUserData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Display Name
              </label>
              <Input
                value={editUserData.displayName}
                onChange={(e) => setEditUserData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Enter display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditUserModal(false);
                  setSelectedUser(null);
                  setEditUserData({
                    username: '',
                    displayName: '',
                    email: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>
                Update User
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Game Confirmation Modal */}
      <Modal
        isOpen={showGameDeleteModal}
        onClose={() => setShowGameDeleteModal(false)}
        title="Delete Game"
        size="sm"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">
              Delete Game?
            </h3>
            <p className="text-charcoal-600">
              This will permanently delete this game and all associated data. This action cannot be undone.
            </p>
          </div>
          
          {gameToDelete && (
            <div className="bg-charcoal-50 p-4 rounded-xl">
              <div className="text-sm space-y-1">
                <div className="font-medium text-charcoal-900">
                  {gameToDelete.user_display_name} - Score: {gameToDelete.total_score}
                </div>
                <div className="text-charcoal-600">
                  {new Date(gameToDelete.played_at || gameToDelete.created_at).toLocaleString()}
                </div>
                {gameToDelete.location && (
                  <div className="text-charcoal-600">
                    Location: {gameToDelete.location}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowGameDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDeleteGame(gameToDelete?.id)}
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

export default AdminPage;