// src/services/dashboardService.ts
// Service layer for dashboard API calls

import {
  DashboardData,
  UpcomingReservation,
  RecentActivity,
  FavoriteSpace,
} from "../types/dashboard";
import { mockDashboardData } from "../mock/dashboard";

interface ExtendBookingResponse {
  success: boolean;
  message: string;
  updatedReservation?: UpcomingReservation;
}

interface CancelBookingResponse {
  success: boolean;
  message: string;
  refundAmount?: number;
}

interface UserActivityOptions {
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export const dashboardService = {
  // Get complete dashboard data
  getDashboardData: async (): Promise<DashboardData> => {
    try {
      // Replace with actual API call when backend is ready
      // const response = await apiClient.get('/api/v1/dashboard');
      // return response.data;

      // Mock API delay to simulate real network request
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return mockDashboardData;
    } catch (error) {
      console.error("Dashboard service error:", error);
      throw new Error("Failed to fetch dashboard data");
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      // const response = await apiClient.get('/api/v1/dashboard/stats');
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockDashboardData.stats;
    } catch (error) {
      console.error("User stats service error:", error);
      throw new Error("Failed to fetch user statistics");
    }
  },

  // Get reservations for a specific date range
  getReservations: async (
    startDate: string,
    endDate: string
  ): Promise<UpcomingReservation[]> => {
    try {
      // const response = await apiClient.get(`/api/v1/reservations?start=${startDate}&end=${endDate}`);
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockDashboardData.upcomingReservations.filter(
        (reservation) =>
          reservation.date >= startDate && reservation.date <= endDate
      );
    } catch (error) {
      console.error("Reservations service error:", error);
      throw new Error("Failed to fetch reservations");
    }
  },

  // Get upcoming reservations
  getUpcomingReservations: async (
    limit?: number
  ): Promise<UpcomingReservation[]> => {
    try {
      // const response = await apiClient.get(`/api/v1/reservations/upcoming${queryParam}`);
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 400));
      const upcoming = mockDashboardData.upcomingReservations.filter(
        (reservation) =>
          new Date(`${reservation.date}T${reservation.startTime}`) > new Date()
      );

      return limit ? upcoming.slice(0, limit) : upcoming;
    } catch (error) {
      console.error("Upcoming reservations service error:", error);
      throw new Error("Failed to fetch upcoming reservations");
    }
  },

  // Extend a booking
  extendBooking: async (
    reservationId: string,
    additionalHours: number
  ): Promise<ExtendBookingResponse> => {
    try {
      // const response = await apiClient.patch(`/api/v1/reservations/${reservationId}/extend`, {
      //   additionalHours
      // });
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock response
      return {
        success: true,
        message: `Booking extended by ${additionalHours} hour${
          additionalHours > 1 ? "s" : ""
        }`,
        updatedReservation: mockDashboardData.upcomingReservations.find(
          (r) => r.id === reservationId
        ),
      };
    } catch (error) {
      console.error("Extend booking service error:", error);
      throw new Error("Failed to extend booking");
    }
  },

  // Cancel a booking
  cancelBooking: async (
    reservationId: string
  ): Promise<CancelBookingResponse> => {
    try {
      // const response = await apiClient.delete(`/api/v1/reservations/${reservationId}`);
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 600));

      const reservation = mockDashboardData.upcomingReservations.find(
        (r) => r.id === reservationId
      );
      const refundAmount = reservation ? reservation.price * 0.8 : 0; // 80% refund

      return {
        success: true,
        message: "Booking cancelled successfully",
        refundAmount,
      };
    } catch (error) {
      console.error("Cancel booking service error:", error);
      throw new Error("Failed to cancel booking");
    }
  },

  // Modify a booking
  modifyBooking: async (
    reservationId: string,
    updates: Partial<UpcomingReservation>
  ) => {
    try {
      // const response = await apiClient.patch(`/api/v1/reservations/${reservationId}`, updates);
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 700));
      return {
        success: true,
        message: "Booking modified successfully",
        updatedReservation: { ...updates, id: reservationId },
      };
    } catch (error) {
      console.error("Modify booking service error:", error);
      throw new Error("Failed to modify booking");
    }
  },

  // Get user activity
  getUserActivity: async (
    options: UserActivityOptions = {}
  ): Promise<RecentActivity[]> => {
    try {
      const { limit = 10, type, startDate, endDate } = options;

      let query = `limit=${limit}`;
      if (type) query += `&type=${type}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      // const response = await apiClient.get(`/api/v1/user/activity?${query}`);
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 400));

      let activities = [...mockDashboardData.recentActivity];

      // Apply filters
      if (type) {
        activities = activities.filter((activity) => activity.type === type);
      }

      if (startDate || endDate) {
        activities = activities.filter((activity) => {
          const activityDate = new Date(activity.timestamp);
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
          return activityDate >= start && activityDate <= end;
        });
      }

      return activities.slice(0, limit);
    } catch (error) {
      console.error("User activity service error:", error);
      throw new Error("Failed to fetch user activity");
    }
  },

  // Get favorite spaces
  getFavoriteSpaces: async (): Promise<FavoriteSpace[]> => {
    try {
      // const response = await apiClient.get('/api/v1/user/favorites');
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 600));
      return mockDashboardData.favoriteSpaces;
    } catch (error) {
      console.error("Favorite spaces service error:", error);
      throw new Error("Failed to fetch favorite spaces");
    }
  },

  // Add space to favorites
  addToFavorites: async () => {
    try {
      // const response = await apiClient.post(`/api/v1/user/favorites/${spaceId}`);
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        message: "Space added to favorites",
      };
    } catch (error) {
      console.error("Add to favorites service error:", error);
      throw new Error("Failed to add space to favorites");
    }
  },

  // Remove space from favorites
  removeFromFavorites: async () => {
    try {
      // const response = await apiClient.delete(`/api/v1/user/favorites/${spaceId}`);
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        message: "Space removed from favorites",
      };
    } catch (error) {
      console.error("Remove from favorites service error:", error);
      throw new Error("Failed to remove space from favorites");
    }
  },

  // Get monthly booking statistics
  getMonthlyStats: async (year: number = new Date().getFullYear()) => {
    try {
      // const response = await apiClient.get(`/api/v1/dashboard/monthly-stats?year=${year}`);
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockDashboardData.monthlyBookings.filter(
        (data) => data.year === year
      );
    } catch (error) {
      console.error("Monthly stats service error:", error);
      throw new Error("Failed to fetch monthly statistics");
    }
  },

  // Check in to a reservation
  checkIn: async () => {
    try {
      // const response = await apiClient.post(`/api/v1/reservations/${reservationId}/checkin`);
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 400));
      return {
        success: true,
        message: "Successfully checked in",
        checkedInAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Check-in service error:", error);
      throw new Error("Failed to check in");
    }
  },

  // Check out from a reservation
  checkOut: async () => {
    try {
      // const response = await apiClient.post(`/api/v1/reservations/${reservationId}/checkout`);
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 400));
      return {
        success: true,
        message: "Successfully checked out",
        checkedOutAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Check-out service error:", error);
      throw new Error("Failed to check out");
    }
  },

  // Get quick actions based on user context
  getQuickActions: async () => {
    try {
      // const response = await apiClient.get('/api/v1/dashboard/quick-actions');
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 200));
      return mockDashboardData.quickActions;
    } catch (error) {
      console.error("Quick actions service error:", error);
      throw new Error("Failed to fetch quick actions");
    }
  },

  // Get dashboard insights/recommendations
  getDashboardInsights: async () => {
    try {
      // const response = await apiClient.get('/api/v1/dashboard/insights');
      // return response.data;

      await new Promise((resolve) => setTimeout(resolve, 600));

      // Mock insights based on user data
      return {
        recommendations: [
          {
            type: "cost_saving",
            title: "Save 15% on bookings",
            description:
              "Book creative spaces during off-peak hours (2-4 PM) for better rates",
            action: "View Off-Peak Spaces",
            priority: "medium",
          },
          {
            type: "usage_pattern",
            title: "Your peak productivity time",
            description:
              "You book most spaces between 9-11 AM. Consider extending these sessions.",
            action: "Book Morning Slots",
            priority: "low",
          },
          {
            type: "new_feature",
            title: "Try our new Focus Pods",
            description: "Perfect for your frequent 2-hour booking pattern",
            action: "Explore Focus Pods",
            priority: "high",
          },
        ],
        metrics: {
          utilizationRate: 85,
          avgSessionLength: 3.2,
          favoriteSpaceUsage: 67,
          costEfficiency: "good",
        },
      };
    } catch (error) {
      console.error("Dashboard insights service error:", error);
      throw new Error("Failed to fetch dashboard insights");
    }
  },
};
