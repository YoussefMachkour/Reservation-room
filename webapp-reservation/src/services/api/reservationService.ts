import { apiClient } from './apiClient';
import { ApiResponse } from '../../types';
import type { Reservation } from '../../types/booking';

export interface CreateReservationRequest {
  spaceId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  notes?: string;
  title?: string;
  participantCount?: number;
}

export interface UpdateReservationRequest {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface ReservationSearchParams {
  status?: string;
  spaceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CalendarParams {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  spaceId?: string;
}

export interface CheckInResponse {
  success: boolean;
  checkedInAt: string;
  qrCode?: string;
}

export interface CheckOutResponse {
  success: boolean;
  checkedOutAt: string;
  duration: number; // in minutes
  cost: number;
}

export interface CheckInStatusResponse {
  isCheckedIn: boolean;
  checkedInAt?: string;
  canCheckIn: boolean;
  canCheckOut: boolean;
}

class ReservationService {
  // Core reservation functionality
  async createReservation(data: CreateReservationRequest): Promise<ApiResponse<Reservation>> {
    // Validate input parameters
    if (!data.spaceId) {
      throw new Error('Space ID is required');
    }
    if (!data.startDate || !data.endDate || !data.startTime || !data.endTime) {
      throw new Error('All date and time fields are required');
    }
    
    // Create full datetime strings with timezone as expected by Go backend
    // Go expects format: "2006-01-02T15:04:05Z07:00"
    const startDateTime = `${data.startDate}T${data.startTime}:00Z`;
    const endDateTime = `${data.endDate}T${data.endTime}:00Z`;
    
    // Use snake_case format as expected by Go backend CreateReservationRequest struct
    const backendRequest = {
      space_id: data.spaceId,
      start_time: startDateTime,
      end_time: endDateTime,
      participant_count: data.participantCount || 1,
      title: data.title || data.notes || 'Reservation',
      description: data.notes || '',
      is_recurring: false
    };
    
    return await apiClient.post<Reservation>('/reservations', backendRequest);
  }

  async getReservation(id: string): Promise<ApiResponse<Reservation>> {
    return apiClient.get<Reservation>(`/reservations/${id}`);
  }

  async updateReservation(id: string, data: UpdateReservationRequest): Promise<ApiResponse<Reservation>> {
    return apiClient.put<Reservation>(`/reservations/${id}`, data);
  }

  async cancelReservation(id: string, reason?: string): Promise<ApiResponse<Reservation>> {
    return apiClient.post<Reservation>(`/reservations/${id}/cancel`, { reason });
  }

  // User's personal reservations
  async getUserReservations(params?: ReservationSearchParams): Promise<ApiResponse<Reservation[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return apiClient.get<Reservation[]>(`/reservations/my${queryString ? `?${queryString}` : ''}`);
  }

  async getUserUpcomingReservations(): Promise<ApiResponse<Reservation[]>> {
    return apiClient.get<Reservation[]>('/reservations/my/upcoming');
  }

  async getUserActiveReservation(): Promise<ApiResponse<Reservation | null>> {
    return apiClient.get<Reservation | null>('/reservations/my/active');
  }

  // Check-in/Check-out functionality
  async checkIn(id: string): Promise<ApiResponse<CheckInResponse>> {
    return apiClient.post<CheckInResponse>(`/reservations/${id}/checkin`);
  }

  async checkOut(id: string): Promise<ApiResponse<CheckOutResponse>> {
    return apiClient.post<CheckOutResponse>(`/reservations/${id}/checkout`);
  }

  async getCheckInStatus(id: string): Promise<ApiResponse<CheckInStatusResponse>> {
    return apiClient.get<CheckInStatusResponse>(`/reservations/${id}/status`);
  }

  // Search and filtering
  async searchReservations(params: ReservationSearchParams): Promise<ApiResponse<Reservation[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    return apiClient.get<Reservation[]>(`/reservations/search?${queryParams.toString()}`);
  }

  async getReservationCalendar(params: CalendarParams): Promise<ApiResponse<Reservation[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    return apiClient.get<Reservation[]>(`/reservations/calendar?${queryParams.toString()}`);
  }

  // Manager endpoints
  async getSpaceReservations(spaceId: string, params?: ReservationSearchParams): Promise<ApiResponse<Reservation[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return apiClient.get<Reservation[]>(`/manager/spaces/${spaceId}/reservations${queryString ? `?${queryString}` : ''}`);
  }

  async getPendingApprovals(): Promise<ApiResponse<Reservation[]>> {
    return apiClient.get<Reservation[]>('/manager/approvals');
  }

  async approveReservation(id: string, notes?: string): Promise<ApiResponse<Reservation>> {
    return apiClient.post<Reservation>(`/manager/approvals/${id}/approve`, { notes });
  }

  async rejectReservation(id: string, reason: string): Promise<ApiResponse<Reservation>> {
    return apiClient.post<Reservation>(`/manager/approvals/${id}/reject`, { reason });
  }

  // Admin endpoints
  async getAllReservations(params?: ReservationSearchParams): Promise<ApiResponse<Reservation[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return apiClient.get<Reservation[]>(`/admin/reservations${queryString ? `?${queryString}` : ''}`);
  }

  async getReservationsByStatus(status: string): Promise<ApiResponse<Reservation[]>> {
    return apiClient.get<Reservation[]>(`/admin/reservations/status/${encodeURIComponent(status)}`);
  }

  async deleteReservation(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/admin/reservations/${id}`);
  }

  async markNoShow(id: string, notes?: string): Promise<ApiResponse<Reservation>> {
    return apiClient.post<Reservation>(`/admin/reservations/${id}/no-show`, { notes });
  }
}

export const reservationService = new ReservationService();
