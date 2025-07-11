import { apiClient } from './apiClient';
import { ApiResponse, Space } from '../../types';

export interface SpaceSearchParams {
  query?: string;
  building?: string;
  type?: string;
  capacity?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  page?: number;
  limit?: number;
}

export interface AvailabilityRequest {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

export interface CreateSpaceRequest {
  name: string;
  type: string;
  capacity: number;
  pricePerHour: number;
  pricePerDay: number;
  description: string;
  building: string;
  floor: number;
  room: string;
  amenities: string[];
  workingHours: any; // Define proper type based on your backend
  images?: string[];
}

export interface UpdateSpaceRequest extends Partial<CreateSpaceRequest> {}

export interface SpaceStatistics {
  totalReservations: number;
  occupancyRate: number;
  revenue: number;
  averageRating: number;
  popularTimes: any[];
}

export interface DashboardStatistics {
  totalSpaces: number;
  activeReservations: number;
  totalRevenue: number;
  occupancyRate: number;
  recentReservations: any[];
}

class SpaceService {
  // Public endpoints
  async getSpaces(params?: SpaceSearchParams): Promise<ApiResponse<Space[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }
    const queryString = queryParams.toString();
    return apiClient.get<Space[]>(`/spaces${queryString ? `?${queryString}` : ''}`);
  }

  async getSpace(id: string): Promise<ApiResponse<Space>> {
    return apiClient.get<Space>(`/spaces/${id}`);
  }

  async searchSpaces(params: SpaceSearchParams): Promise<ApiResponse<Space[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    return apiClient.get<Space[]>(`/spaces/search?${queryParams.toString()}`);
  }

  async getBuildings(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/spaces/buildings');
  }

  async getSpacesByBuilding(building: string): Promise<ApiResponse<Space[]>> {
    return apiClient.get<Space[]>(`/spaces/building/${encodeURIComponent(building)}`);
  }

  async getSpacesByType(type: string): Promise<ApiResponse<Space[]>> {
    return apiClient.get<Space[]>(`/spaces/type/${encodeURIComponent(type)}`);
  }

  async getAvailableSpaces(params?: AvailabilityRequest): Promise<ApiResponse<Space[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return apiClient.get<Space[]>(`/spaces/available${queryString ? `?${queryString}` : ''}`);
  }

  async checkSpaceAvailability(id: string, request: AvailabilityRequest): Promise<ApiResponse<boolean>> {
    // Validate input parameters
    if (!id) {
      throw new Error('Space ID is required');
    }
    if (!request.startDate || !request.endDate || !request.startTime || !request.endTime) {
      throw new Error('All date and time fields are required');
    }
    
    // Create full datetime strings with timezone as expected by Go backend
    // Go expects format: "2006-01-02T15:04:05Z07:00"
    const startDateTime = `${request.startDate}T${request.startTime}:00Z`;
    const endDateTime = `${request.endDate}T${request.endTime}:00Z`;
    
    // Use snake_case format as expected by Go backend SpaceAvailabilityRequest struct
    const backendRequest = {
      space_id: id,
      start_time: startDateTime,
      end_time: endDateTime
    };
    
    // Use the correct endpoint pattern from routes: /spaces/:id/availability
    return await apiClient.post<boolean>(`/spaces/${id}/availability`, backendRequest);
  }

  // Protected endpoints
  async batchCheckAvailability(requests: Array<{spaceId: string} & AvailabilityRequest>): Promise<ApiResponse<Array<{spaceId: string; available: boolean}>>> {
    return apiClient.post<Array<{spaceId: string; available: boolean}>>('/spaces/batch-availability', requests);
  }

  // Manager endpoints
  async getMyManagedSpaces(): Promise<ApiResponse<Space[]>> {
    return apiClient.get<Space[]>('/manager/spaces/managed');
  }

  async updateSpaceStatus(id: string, status: string): Promise<ApiResponse<Space>> {
    return apiClient.put<Space>(`/manager/spaces/${id}/status`, { status });
  }

  async getDashboardStatistics(): Promise<ApiResponse<DashboardStatistics>> {
    return apiClient.get<DashboardStatistics>('/manager/stats/dashboard');
  }

  async getSpaceStatistics(id: string): Promise<ApiResponse<SpaceStatistics>> {
    return apiClient.get<SpaceStatistics>(`/manager/stats/spaces/${id}`);
  }

  // Admin endpoints
  async createSpace(data: CreateSpaceRequest): Promise<ApiResponse<Space>> {
    return apiClient.post<Space>('/admin/spaces', data);
  }

  async updateSpace(id: string, data: UpdateSpaceRequest): Promise<ApiResponse<Space>> {
    return apiClient.put<Space>(`/admin/spaces/${id}`, data);
  }

  async deleteSpace(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/admin/spaces/${id}`);
  }

  async assignManager(id: string, managerId: string): Promise<ApiResponse<Space>> {
    return apiClient.post<Space>(`/admin/spaces/${id}/assign-manager`, { managerId });
  }

  async unassignManager(id: string, managerId: string): Promise<ApiResponse<Space>> {
    return apiClient.delete<Space>(`/admin/spaces/${id}/unassign-manager`, { managerId });
  }

  async getSpacesByStatus(status: string): Promise<ApiResponse<Space[]>> {
    return apiClient.get<Space[]>(`/admin/spaces/status/${encodeURIComponent(status)}`);
  }
}

export const spaceService = new SpaceService();
