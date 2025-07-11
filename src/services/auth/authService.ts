import { User, AuthResult } from '../../types';
import { authService as apiAuthService } from '../api/authService';

class AuthService {
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await apiAuthService.login({ email, password });
      
      if (response.success && response.data) {
        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
          refreshToken: response.data.refreshToken,
        };
      }
      
      return {
        success: false,
        message: response.message || 'Invalid credentials',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async register(firstName: string, lastName: string, email: string, password: string): Promise<AuthResult> {
    try {
      const response = await apiAuthService.register({ firstName, lastName, email, password });
      
      if (response.success && response.data) {
        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
          refreshToken: response.data.refreshToken,
        };
      }
      
      return {
        success: false,
        message: response.message || 'Registration failed',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('cohub-token');
      if (!token) {
        console.log('No token found');
        return null;
      }

      console.log('Attempting to get profile with token...');
      const response = await apiAuthService.getProfile();
      
      if (response.success && response.data) {
        console.log('Profile retrieved successfully:', response.data);
        return response.data;
      }
      
      console.error('Failed to get profile:', response.message);
      
      // If it's a server error, we might want to keep the token for retry
      if (response.message?.includes('internal_server_error') || response.message?.includes('500')) {
        console.warn('Server error detected, keeping token for potential retry');
        // Don't clear token for server errors - user might want to retry
        return null;
      }
      
      // For auth errors (401, 403), clear the token
      if (response.message?.includes('Unauthorized') || response.message?.includes('401') || response.message?.includes('403')) {
        console.warn('Auth error detected, clearing token');
        localStorage.removeItem('cohub-token');
      }
      
      return null;
    } catch (error: any) {
      console.error('Get current user error:', error);
      
      // Check if it's a network error or server error
      if (error.message?.includes('500') || error.message?.includes('internal_server_error') || 
          error.message?.includes('Network Error') || error.message?.includes('fetch')) {
        console.warn('Network/Server error, keeping token for retry');
        return null;
      }
      
      // For other errors, clear token
      localStorage.removeItem('cohub-token');
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      // For now, just simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Uncomment when API is ready:
      // await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error, as we want to clear local storage anyway
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const currentToken = localStorage.getItem('cohub-token');
      if (!currentToken) return null;
      
      // For now, we don't have a refresh token in localStorage, so we'll skip this
      // In a real implementation, you'd store and retrieve the refresh token
      const refreshToken = localStorage.getItem('cohub-refresh-token');
      if (!refreshToken) return null;
      
      const response = await apiAuthService.refreshToken({ refreshToken });
      
      if (response.success && response.data) {
        localStorage.setItem('cohub-token', response.data.token);
        localStorage.setItem('cohub-refresh-token', response.data.refreshToken);
        return response.data.token;
      }
      
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }
}

export const authService = new AuthService();