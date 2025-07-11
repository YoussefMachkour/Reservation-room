import { apiClient } from './apiClient';
import { ApiResponse } from '../../types';

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalSpaces: number;
  activeSpaces: number;
  totalReservations: number;
  activeReservations: number;
  totalRevenue: number;
  occupancyRate: number;
  popularSpaces: Array<{
    spaceId: string;
    spaceName: string;
    reservationCount: number;
  }>;
  recentActivity: Array<{
    type: 'user_registered' | 'reservation_created' | 'space_created';
    timestamp: string;
    description: string;
  }>;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: {
    user: number;
    manager: number;
    admin: number;
  };
  userRegistrationTrend: Array<{
    date: string;
    count: number;
  }>;
  topActiveUsers: Array<{
    userId: string;
    userName: string;
    reservationCount: number;
    totalSpent: number;
  }>;
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  registeredAt: string;
  isActive: boolean;
}

class StatsService {
  // Admin stats endpoints
  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    return apiClient.get<SystemStats>('/admin/stats');
  }

  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return apiClient.get<UserStats>('/admin/stats/users');
  }

  async getRecentUsers(limit?: number): Promise<ApiResponse<RecentUser[]>> {
    const queryParams = limit ? `?limit=${limit}` : '';
    return apiClient.get<RecentUser[]>(`/admin/stats/recent-users${queryParams}`);
  }
}

export const statsService = new StatsService();
