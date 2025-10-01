import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

/**
 * Login Page Component
 * Clean Retro themed login form with validation
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear auth error
    if (error) {
      clearError();
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.emailOrUsername) {
      errors.emailOrUsername = 'Email or username is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    const result = await login(formData);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" variant="elevated">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-3xl font-bold text-charcoal-900 font-heading">
            Welcome Back
          </h1>
          <p className="text-charcoal-600 mt-2">
            Sign in to track your bowling progress
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Global Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Email or Username Field */}
          <Input
            label="Email or Username"
            type="text"
            name="emailOrUsername"
            value={formData.emailOrUsername}
            onChange={handleChange}
            error={validationErrors.emailOrUsername}
            required
            placeholder="your@email.com or username"
          />

          {/* Password Field */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={validationErrors.password}
              required
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-charcoal-500 hover:text-charcoal-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t border-cream-200">
            <p className="text-charcoal-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;