import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User, AuthResult } from '../types';
import { authService } from '../services/auth/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('cohub-token');
        if (token) {
          console.log('Found token, attempting to get current user...');
          const userData = await authService.getCurrentUser();
          if (userData) {
            console.log('User data retrieved successfully:', userData);
            setUser(userData);
          } else {
            console.warn('Failed to get user data, removing token');
            localStorage.removeItem('cohub-token');
            setError('Session expired. Please log in again.');
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        localStorage.removeItem('cohub-token');
        setError('Authentication error. Please log in again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.login(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('cohub-token', result.token || '');
        // Store refresh token if available
        if (result.refreshToken) {
          localStorage.setItem('cohub-refresh-token', result.refreshToken);
        }
      } else {
        setError(result.message || 'Login failed');
      }
      
      setLoading(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.register(firstName, lastName, email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('cohub-token', result.token || '');
        // Store refresh token if available
        if (result.refreshToken) {
          localStorage.setItem('cohub-refresh-token', result.refreshToken);
        }
      } else {
        setError(result.message || 'Registration failed');
      }
      
      setLoading(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('cohub-token');
      localStorage.removeItem('cohub-refresh-token');
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};