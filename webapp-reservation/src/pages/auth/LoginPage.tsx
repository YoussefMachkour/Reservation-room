import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LoginFormData, FormErrors } from '../../types';
import { Input } from '../../components/ui/input/Input';
import { Button } from '../../components/ui/button/Button';
import { ErrorMessage } from '../../components/ui/ErrorMessage';

export const LoginPage: React.FC = () => {
  const { isDark } = useTheme();
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({ 
    email: '', 
    password: '' 
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    clearError();
    
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    
    const result = await login(formData.email, formData.password);
    if (!result.success) {
      setFormErrors({ submit: result.message || 'Login failed' });
    }
  };

  const handleChange = (field: keyof LoginFormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isDark ? 'bg-blue-900' : 'bg-blue-100'
          }`}>
            <span className="text-2xl font-bold text-blue-600">C</span>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome to CoHub
          </h1>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Sign in to access your workspace
          </p>
        </div>

        {/* Demo Credentials */}
        <div className={`mb-6 p-4 rounded-lg border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-blue-800'
          }`}>
            Demo Credentials:
          </p>
          <div className={`text-xs space-y-1 ${
            isDark ? 'text-gray-400' : 'text-blue-600'
          }`}>
            <p>Admin: admin@cohub.com / password</p>
            <p>User: user@example.com / password</p>
          </div>
        </div>

        {/* Error Messages */}
        <ErrorMessage error={error} />
        <ErrorMessage error={formErrors.submit} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={formErrors.email}
            placeholder="Enter your email"
            leftIcon={Mail}
            required
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            error={formErrors.password}
            placeholder="Enter your password"
            leftIcon={Lock}
            rightIcon={showPassword ? EyeOff : Eye}
            onRightIconClick={() => setShowPassword(!showPassword)}
            required
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`ml-2 text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};