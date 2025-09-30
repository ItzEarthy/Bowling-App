import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Lock } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';

/**
 * Settings Page Component
 * User profile settings and account management
 */
const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <PageHeader 
        title="Settings"
        subtitle="Manage your account and preferences"
      />
      
      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-charcoal-900 font-heading">
                  {user?.displayName}
                </h2>
                <p className="text-charcoal-600">@{user?.username}</p>
                <p className="text-charcoal-500 text-sm">{user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <User className="w-5 h-5 mr-3" />
                Edit Profile
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Lock className="w-5 h-5 mr-3" />
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-charcoal-900 font-heading mb-4">
              Account
            </h3>
            
            <Button 
              variant="danger" 
              onClick={handleLogout}
              className="w-full justify-start"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-charcoal-900 font-heading mb-4">
              About
            </h3>
            
            <div className="space-y-2 text-sm text-charcoal-600">
              <div className="flex justify-between">
                <span>Version</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Build</span>
                <span>Production</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;