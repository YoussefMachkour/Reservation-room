import { User, AuthResult } from '../../types';
import { apiClient } from '../api/apiClient';

interface LoginResponse {
  user: User;
  token: string;
}

interface RegisterResponse {
  user: User;
  token: string;
}

class AuthService {
  async login(email: string, password: string): Promise<AuthResult & { token?: string }> {
    try {
      // For now, simulate API call with mock data
      // Replace this with actual API call when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      if (email === 'admin@cohub.com') {
        const mockUser: User = {
          id: '1',
          name: 'Admin User',
          email: email,
          role: 'admin',
          avatar: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        return { 
          success: true, 
          user: mockUser, 
          token: 'mock-admin-token-' + Date.now() 
        };
      } else if (email.includes('@')) {
        const mockUser: User = {
          id: '2',
          name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email: email,
          role: 'user',
          avatar: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        return { 
          success: true, 
          user: mockUser, 
          token: 'mock-user-token-' + Date.now() 
        };
      }
      
      return { success: false, message: 'Invalid credentials' };
      
      // Uncomment when API is ready:
      // const response = await apiClient.post<LoginResponse>('/auth/login', {
      //   email,
      //   password,
      // });
      // 
      // return {
      //   success: true,
      //   user: response.data.user,
      //   token: response.data.token,
      // };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async register(name: string, email: string, password: string): Promise<AuthResult & { token?: string }> {
    try {
      // For now, simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful registration
      const mockUser: User = {
        id: Date.now().toString(),
        name: name,
        email: email,
        role: 'user',
        avatar: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      return { 
        success: true, 
        user: mockUser, 
        token: 'mock-token-' + Date.now() 
      };
      
      // Uncomment when API is ready:
      // const response = await apiClient.post<RegisterResponse>('/auth/register', {
      //   name,
      //   email,
      //   password,
      // });
      // 
      // return {
      //   success: true,
      //   user: response.data.user,
      //   token: response.data.token,
      // };
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
      if (!token) return null;

      // Mock user data based on token
      if (token.includes('admin')) {
        return {
          id: '1',
          name: 'Admin User',
          email: 'admin@cohub.com',
          role: 'admin',
          avatar: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        return {
          id: '2',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          avatar: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      // Uncomment when API is ready:
      // const response = await apiClient.get<User>('/auth/me');
      // return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
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
      // Mock token refresh
      const currentToken = localStorage.getItem('cohub-token');
      if (!currentToken) return null;
      
      const newToken = currentToken.replace(/\d+$/, Date.now().toString());
      localStorage.setItem('cohub-token', newToken);
      return newToken;
      
      // Uncomment when API is ready:
      // const response = await apiClient.post<{ token: string }>('/auth/refresh');
      // return response.data.token;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }
}

export const authService = new AuthService();