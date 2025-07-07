import { apiClient } from './../api/apiClient';
import type { 
  Reservation, 
  CreateReservationRequest, 
  UpdateReservationRequest,
  AvailabilityResponse 
} from '../../types/booking';
// Import mock data for development
import { 
  mockReservations, 
  getReservationsByUserId, 
  getUpcomingReservations, 
  getPastReservations, 
  getReservationsByStatus,
  getSpaceReservations,
  generateMockAvailability 
} from '../../mock/booking';

export class BookingService {
  // Get user's reservations
  static async getUserReservations(userId: string): Promise<Reservation[]> {
    try {
      // For development, use mock data
      if (process.env.NODE_ENV === 'development') {
        return getReservationsByUserId(userId);
      }
      
      const response = await apiClient.get<Reservation[]>(`/reservations/user/${userId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch user reservations');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      throw error;
    }
  }

  // Get all user's reservations (for current user)
  static async getMyReservations(): Promise<Reservation[]> {
    try {
      // For development, use mock data (assuming current user is user-001)
      if (process.env.NODE_ENV === 'development') {
        return getReservationsByUserId('user-001');
      }
      
      const response = await apiClient.get<Reservation[]>('/reservations/my');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch reservations');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching my reservations:', error);
      throw error;
    }
  }

  // Get reservation by ID
  static async getReservation(id: string): Promise<Reservation> {
    try {
      // For development, use mock data
      if (process.env.NODE_ENV === 'development') {
        const reservation = mockReservations.find(r => r.id === id);
        if (!reservation) {
          throw new Error('Reservation not found');
        }
        return reservation;
      }
      
      const response = await apiClient.get<Reservation>(`/reservations/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch reservation');
      }
      
      if (!response.data) {
        throw new Error('Reservation not found');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching reservation:', error);
      throw error;
    }
  }

  // Create new reservation
  static async createReservation(data: CreateReservationRequest): Promise<Reservation> {
    try {
      // For development, simulate API call
      if (process.env.NODE_ENV === 'development') {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create mock reservation
        const newReservation: Reservation = {
          id: `res-${Date.now()}`,
          user_id: 'user-001',
          space_id: data.space_id,
          start_time: data.start_time,
          end_time: data.end_time,
          participant_count: data.participant_count,
          title: data.title,
          description: data.description || '',
          status: 'confirmed',
          is_recurring: data.is_recurring || false,
          recurrence_pattern: data.recurrence_pattern,
          no_show_reported: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        return newReservation;
      }
      
      const response = await apiClient.post<Reservation>('/reservations', data);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create reservation');
      }
      
      if (!response.data) {
        throw new Error('No reservation data returned');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  // Update reservation
  static async updateReservation(id: string, data: UpdateReservationRequest): Promise<Reservation> {
    try {
      // For development, simulate API call
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const existingReservation = mockReservations.find(r => r.id === id);
        if (!existingReservation) {
          throw new Error('Reservation not found');
        }
        
        const updatedReservation: Reservation = {
          ...existingReservation,
          ...data,
          updated_at: new Date().toISOString()
        };
        
        return updatedReservation;
      }
      
      const response = await apiClient.put<Reservation>(`/reservations/${id}`, data);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update reservation');
      }
      
      if (!response.data) {
        throw new Error('No reservation data returned');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  }

  // Cancel reservation
  static async cancelReservation(id: string, reason?: string): Promise<Reservation> {
    try {
      // For development, simulate API call
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const existingReservation = mockReservations.find(r => r.id === id);
        if (!existingReservation) {
          throw new Error('Reservation not found');
        }
        
        const cancelledReservation: Reservation = {
          ...existingReservation,
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        };
        
        return cancelledReservation;
      }
      
      const response = await apiClient.patch<Reservation>(`/reservations/${id}/cancel`, {
        cancellation_reason: reason
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel reservation');
      }
      
      if (!response.data) {
        throw new Error('No reservation data returned');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  }

  // Delete reservation
  static async deleteReservation(id: string): Promise<void> {
    try {
      // For development, simulate API call
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }
      
      const response = await apiClient.delete(`/reservations/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete reservation');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      throw error;
    }
  }

  // Check space availability
  static async checkAvailability(
    spaceId: string, 
    startDate: string, 
    endDate: string
  ): Promise<AvailabilityResponse[]> {
    try {
      // For development, use mock data
      if (process.env.NODE_ENV === 'development') {
        return generateMockAvailability(spaceId, startDate, endDate);
      }
      
      const response = await apiClient.get<AvailabilityResponse[]>(`/spaces/${spaceId}/availability?start_date=${startDate}&end_date=${endDate}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to check availability');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  // Get space reservations for a date range
  static async getSpaceReservations(
    spaceId: string, 
    startDate: string, 
    endDate: string
  ): Promise<Reservation[]> {
    try {
      // For development, use mock data
      if (process.env.NODE_ENV === 'development') {
        return getSpaceReservations(spaceId, startDate, endDate);
      }
      
      const response = await apiClient.get<Reservation[]>(`/spaces/${spaceId}/reservations?start_date=${startDate}&end_date=${endDate}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch space reservations');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching space reservations:', error);
      throw error;
    }
  }

  // Check-in to reservation
  static async checkIn(reservationId: string): Promise<Reservation> {
    try {
      // For development, simulate API call
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const existingReservation = mockReservations.find(r => r.id === reservationId);
        if (!existingReservation) {
          throw new Error('Reservation not found');
        }
        
        const checkedInReservation: Reservation = {
          ...existingReservation,
          check_in_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        return checkedInReservation;
      }
      
      const response = await apiClient.post<Reservation>(`/reservations/${reservationId}/check-in`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to check in');
      }
      
      if (!response.data) {
        throw new Error('No reservation data returned');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  }

  // Check-out from reservation
  static async checkOut(reservationId: string): Promise<Reservation> {
    try {
      // For development, simulate API call
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const existingReservation = mockReservations.find(r => r.id === reservationId);
        if (!existingReservation) {
          throw new Error('Reservation not found');
        }
        
        const checkedOutReservation: Reservation = {
          ...existingReservation,
          check_out_time: new Date().toISOString(),
          status: 'completed',
          updated_at: new Date().toISOString()
        };
        
        return checkedOutReservation;
      }
      
      const response = await apiClient.post<Reservation>(`/reservations/${reservationId}/check-out`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to check out');
      }
      
      if (!response.data) {
        throw new Error('No reservation data returned');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  }

  // Report no-show
  static async reportNoShow(reservationId: string): Promise<Reservation> {
    try {
      // For development, simulate API call
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const existingReservation = mockReservations.find(r => r.id === reservationId);
        if (!existingReservation) {
          throw new Error('Reservation not found');
        }
        
        const noShowReservation: Reservation = {
          ...existingReservation,
          no_show_reported: true,
          status: 'cancelled',
          cancellation_reason: 'No-show reported',
          updated_at: new Date().toISOString()
        };
        
        return noShowReservation;
      }
      
      const response = await apiClient.post<Reservation>(`/reservations/${reservationId}/no-show`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to report no-show');
      }
      
      if (!response.data) {
        throw new Error('No reservation data returned');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error reporting no-show:', error);
      throw error;
    }
  }

  // Get upcoming reservations
  static async getUpcomingReservations(): Promise<Reservation[]> {
    try {
      // For development, use mock data
      if (process.env.NODE_ENV === 'development') {
        return getUpcomingReservations('user-001');
      }
      
      const response = await apiClient.get<Reservation[]>('/reservations/upcoming');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch upcoming reservations');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching upcoming reservations:', error);
      throw error;
    }
  }

  // Get past reservations
  static async getPastReservations(): Promise<Reservation[]> {
    try {
      // For development, use mock data
      if (process.env.NODE_ENV === 'development') {
        return getPastReservations('user-001');
      }
      
      const response = await apiClient.get<Reservation[]>('/reservations/past');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch past reservations');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching past reservations:', error);
      throw error;
    }
  }

  // Get reservations by status
  static async getReservationsByStatus(status: string): Promise<Reservation[]> {
    try {
      // For development, use mock data
      if (process.env.NODE_ENV === 'development') {
        return getReservationsByStatus(status, 'user-001');
      }
      
      const response = await apiClient.get<Reservation[]>(`/reservations?status=${status}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch reservations by status');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching reservations by status:', error);
      throw error;
    }
  }

  // Batch operations
  static async createRecurringReservations(data: CreateReservationRequest): Promise<Reservation[]> {
    try {
      // For development, simulate creating multiple reservations
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const reservations: Reservation[] = [];
        const baseReservation = await this.createReservation(data);
        reservations.push(baseReservation);
        
        // Simulate creating additional recurring instances
        for (let i = 1; i < 5; i++) {
          const recurringReservation: Reservation = {
            ...baseReservation,
            id: `res-${Date.now()}-${i}`,
            recurrence_parent_id: baseReservation.id,
            start_time: new Date(new Date(data.start_time).getTime() + (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
            end_time: new Date(new Date(data.end_time).getTime() + (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
          };
          reservations.push(recurringReservation);
        }
        
        return reservations;
      }
      
      const response = await apiClient.post<Reservation[]>('/reservations/recurring', data);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create recurring reservations');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error creating recurring reservations:', error);
      throw error;
    }
  }

  // Update recurring series
  static async updateRecurringSeries(parentId: string, data: UpdateReservationRequest): Promise<Reservation[]> {
    try {
      // For development, simulate updating series
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const seriesReservations = mockReservations.filter(r => 
          r.id === parentId || r.recurrence_parent_id === parentId
        );
        
        return seriesReservations.map(reservation => ({
          ...reservation,
          ...data,
          updated_at: new Date().toISOString()
        }));
      }
      
      const response = await apiClient.put<Reservation[]>(`/reservations/recurring/${parentId}`, data);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update recurring series');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error updating recurring series:', error);
      throw error;
    }
  }

  // Cancel recurring series
  static async cancelRecurringSeries(parentId: string, reason?: string): Promise<Reservation[]> {
    try {
      // For development, simulate cancelling series
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const seriesReservations = mockReservations.filter(r => 
          r.id === parentId || r.recurrence_parent_id === parentId
        );
        
        return seriesReservations.map(reservation => ({
          ...reservation,
          status: 'cancelled' as const,
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        }));
      }
      
      const response = await apiClient.patch<Reservation[]>(`/reservations/recurring/${parentId}/cancel`, {
        cancellation_reason: reason
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel recurring series');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error cancelling recurring series:', error);
      throw error;
    }
  }

  // Get user's booking statistics
  static async getUserBookingStats(userId?: string): Promise<{
    total: number;
    upcoming: number;
    past: number;
    cancelled: number;
    completed: number;
    thisMonth: number;
    lastMonth: number;
  }> {
    try {
      // For development, calculate from mock data
      if (process.env.NODE_ENV === 'development') {
        const userReservations = userId ? 
          getReservationsByUserId(userId) : 
          getReservationsByUserId('user-001');
        
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        return {
          total: userReservations.length,
          upcoming: userReservations.filter(r => new Date(r.start_time) > now).length,
          past: userReservations.filter(r => new Date(r.end_time) < now).length,
          cancelled: userReservations.filter(r => r.status === 'cancelled').length,
          completed: userReservations.filter(r => r.status === 'completed').length,
          thisMonth: userReservations.filter(r => new Date(r.start_time) >= thisMonthStart).length,
          lastMonth: userReservations.filter(r => {
            const startTime = new Date(r.start_time);
            return startTime >= lastMonthStart && startTime <= lastMonthEnd;
          }).length
        };
      }
      
      const endpoint = userId ? `/users/${userId}/booking-stats` : '/reservations/stats';
      const response = await apiClient.get<{
        total: number;
        upcoming: number;
        past: number;
        cancelled: number;
        completed: number;
        thisMonth: number;
        lastMonth: number;
      }>(endpoint);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch booking statistics');
      }
      
      return response.data || {
        total: 0,
        upcoming: 0,
        past: 0,
        cancelled: 0,
        completed: 0,
        thisMonth: 0,
        lastMonth: 0
      };
    } catch (error) {
      console.error('Error fetching booking statistics:', error);
      throw error;
    }
  }

  // Search reservations
  static async searchReservations(query: string, filters?: {
    status?: string;
    spaceId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Reservation[]> {
    try {
      // For development, simulate search
      if (process.env.NODE_ENV === 'development') {
        let filtered = getReservationsByUserId('user-001');
        
        // Apply text search
        if (query.trim()) {
          const searchQuery = query.toLowerCase();
          filtered = filtered.filter(r =>
            r.title.toLowerCase().includes(searchQuery) ||
            (r.description && r.description.toLowerCase().includes(searchQuery)) ||
            (r.space && r.space.name.toLowerCase().includes(searchQuery))
          );
        }
        
        // Apply filters
        if (filters?.status) {
          filtered = filtered.filter(r => r.status === filters.status);
        }
        
        if (filters?.spaceId) {
          filtered = filtered.filter(r => r.space_id === filters.spaceId);
        }
        
        if (filters?.startDate) {
          filtered = filtered.filter(r => new Date(r.start_time) >= new Date(filters.startDate!));
        }
        
        if (filters?.endDate) {
          filtered = filtered.filter(r => new Date(r.end_time) <= new Date(filters.endDate!));
        }
        
        return filtered;
      }
      
      const params = new URLSearchParams({ q: query });
      if (filters?.status) params.append('status', filters.status);
      if (filters?.spaceId) params.append('space_id', filters.spaceId);
      if (filters?.startDate) params.append('start_date', filters.startDate);
      if (filters?.endDate) params.append('end_date', filters.endDate);
      
      const response = await apiClient.get<Reservation[]>(`/reservations/search?${params.toString()}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to search reservations');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error searching reservations:', error);
      throw error;
    }
  }
}

export default BookingService;