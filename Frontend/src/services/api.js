// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = '/api/v1'; // proxy handles the localhost:8080 part

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  // Look for both token names for compatibility
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all possible token storage keys
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

class ApiService {
  // Auth endpoints
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Store token and user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Registration failed' 
      };
    }
  }

  async logout() {
    try {
      const response = await api.post('/auth/logout');
      
      // Clear all stored data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return { success: true };
    } catch (error) {
      // Even if logout fails on server, clear local data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Logout failed' 
      };
    }
  }

  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to fetch profile' 
      };
    }
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', { 
        refresh_token: refreshToken 
      });
      
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Token refresh failed' 
      };
    }
  }

  // Workspace endpoints
  async getWorkspaces(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters to params
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/workspaces?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to fetch workspaces' 
      };
    }
  }

  async getWorkspace(id) {
    try {
      const response = await api.get(`/workspaces/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to fetch workspace' 
      };
    }
  }

  async searchWorkspaces(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      // Add filters to params
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/workspaces/search?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to search workspaces' 
      };
    }
  }

  // Booking endpoints
  async createBooking(workspaceId, startTime, endTime, additionalData = {}) {
    try {
      const bookingData = {
        workspace_id: workspaceId,
        start_time: startTime,
        end_time: endTime,
        ...additionalData
      };

      const response = await api.post('/bookings', bookingData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to create booking' 
      };
    }
  }

  async getUserBookings(status = null) {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await api.get(`/bookings${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to fetch bookings' 
      };
    }
  }

  async getBooking(id) {
    try {
      const response = await api.get(`/bookings/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to fetch booking' 
      };
    }
  }

  async updateBooking(id, updateData) {
    try {
      const response = await api.put(`/bookings/${id}`, updateData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to update booking' 
      };
    }
  }

  async cancelBooking(id) {
    try {
      const response = await api.delete(`/bookings/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to cancel booking' 
      };
    }
  }

  // Community/Events endpoints
  async getEvents() {
    try {
      const response = await api.get('/events');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to fetch events' 
      };
    }
  }

  async joinEvent(eventId) {
    try {
      const response = await api.post(`/events/${eventId}/join`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to join event' 
      };
    }
  }

  async leaveEvent(eventId) {
    try {
      const response = await api.post(`/events/${eventId}/leave`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to leave event' 
      };
    }
  }

  // User management endpoints
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      // Update stored user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to update profile' 
      };
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to change password' 
      };
    }
  }

  // Utility methods
  getStoredUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }

  getStoredToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
  }

  isAuthenticated() {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }

  clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export default new ApiService();