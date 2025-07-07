// src/contexts/AuthContext.js
import React, { createContext, useContext, useState } from 'react';

// Mock API Service (replace with real API in production)
const mockApiService = {
  async login(email, password) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email && password) {
      return {
        success: true,
        data: {
          user: {
            id: 1,
            name: 'John Doe',
            email: email,
            role: 'user'
          },
          access_token: 'mock-token-123'
        }
      };
    }
    return { success: false, message: 'Invalid credentials' };
  },

  async register(name, email, password) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (name && email && password) {
      return {
        success: true,
        data: {
          user: {
            id: 1,
            name: name,
            email: email,
            role: 'user'
          },
          access_token: 'mock-token-123'
        }
      };
    }
    return { success: false, message: 'Registration failed' };
  },

  async logout() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await mockApiService.login(email, password);
      
      if (response.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await mockApiService.register(name, email, password);
      
      if (response.success) {
        setUser(response.data.user);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await mockApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};