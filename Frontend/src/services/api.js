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
  const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
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
      return { success: true, ...response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Login failed' 
      };
    }
  }

  async register(name, email, password) {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return { success: true, ...response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Registration failed' 
      };
    }
  }

  // Workspace endpoints
  async getWorkspaces() {
    try {
      const response = await api.get('/workspaces');
      return { success: true, ...response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Failed to fetch workspaces' 
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
        message: error.response?.data?.error || 'Failed to fetch workspace' 
      };
    }
  }

  // Booking endpoints
  async createBooking(workspaceId, startTime, endTime) {
    try {
      const response = await api.post('/bookings', {
        workspace_id: workspaceId,
        start_time: startTime,
        end_time: endTime,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Failed to create booking' 
      };
    }
  }

  async getUserBookings() {
    try {
      const response = await api.get('/bookings');
      return { success: true, ...response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Failed to fetch bookings' 
      };
    }
  }
}

export default new ApiService();