import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  Eye, 
  EyeOff, 
  Shield,
  Camera,
  Edit3,
  Trash2,
  Settings,
  LogOut
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { userAPI } from '../lib/api';

/**
 * Profile Page Component
 * Allows users to view and edit their profile information
 */
const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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

  const [activeTab, setActiveTab] = useState('profile'); // profile, password, account

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        displayName: user.displayName || user.display_name || '',
        email: user.email || ''
      });
      // Set existing profile picture if available
      if (user.profilePicture || user.profile_picture) {
        setProfilePicturePreview(user.profilePicture || user.profile_picture);
      }
    }
  }, [user]);

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
      
      // Note: We don't validate file size on client side anymore
      // since backend will handle compression for files >10MB
      
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
    document.getElementById('profile-picture-input').click();
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
      const response = await userAPI.updateProfile({
        username: profileData.username,
        displayName: profileData.displayName,
        email: profileData.email,
        profilePicture: profilePicture ? profilePicturePreview : undefined
      });

      // Update the auth store with new user data
      updateUser(response.data.user);
      setSuccess('Profile updated successfully!');
      
      // Clear the file input state after successful save
      setProfilePicture(null);
      
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
      await userAPI.changePassword({
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

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!window.confirm('This will permanently delete all your games, statistics, and data. Are you absolutely sure?')) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await userAPI.deleteAccount();
      logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Render header even while loading so navigation remains visible
  return (
    <div>
      <PageHeader 
        title="Profile Settings"
        subtitle="Manage your account information and preferences"
        action={
          <Button onClick={handleLogout} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-charcoal-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'profile'
              ? 'bg-white text-charcoal-900 shadow-sm'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'password'
              ? 'bg-white text-charcoal-900 shadow-sm'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <Lock className="w-4 h-4 inline mr-2" />
          Password
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'account'
              ? 'bg-white text-charcoal-900 shadow-sm'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Account
        </button>
      </div>

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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
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
                    {profileData.displayName.charAt(0).toUpperCase() || 'U'}
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
                  id="profile-picture-input"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-charcoal-900">{profileData.displayName}</h3>
                <p className="text-charcoal-600">@{profileData.username}</p>
                {user?.role === 'admin' && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">Administrator</span>
                  </div>
                )}
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

      {/* Password Tab */}
      {activeTab === 'password' && (
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

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-charcoal-700">Member Since</label>
                  <p className="text-charcoal-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-charcoal-700">Account Type</label>
                  <p className="text-charcoal-900 capitalize">
                    {user?.role || 'User'}
                    {user?.role === 'admin' && (
                      <Shield className="w-4 h-4 inline ml-2 text-blue-600" />
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                <span>Danger Zone</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-red-900 font-medium mb-2">Delete Account</h4>
                <p className="text-red-700 text-sm mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button
                  onClick={handleDeleteAccount}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;