// src/hooks/useDashboard.ts
// Custom hook for dashboard data and logic

import { useState, useEffect, useMemo } from 'react';
import { DashboardData, UpcomingReservation, MonthlyBookingData } from '../types/dashboard';
import { dashboardService } from '../services/dashboardService';

interface UseDashboardReturn {
  dashboardData: DashboardData | null;
  computedData: ComputedDashboardData | null;
  loading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
  extendBooking: (reservationId: string, additionalHours: number) => Promise<void>;
  cancelBooking: (reservationId: string) => Promise<void>;
}

interface ComputedDashboardData {
  todaysReservations: UpcomingReservation[];
  thisWeekActivity: any[];
  availableFavorites: any[];
  totalUpcomingCost: number;
  averageBookingDuration: number;
  mostUsedSpaceType: string | null;
  bookingTrend: 'increasing' | 'decreasing' | 'stable';
  monthlySpendingTrend: number;
  upcomingThisWeek: UpcomingReservation[];
  favoriteSpaceTypes: Record<string, number>;
  peakBookingHours: { hour: number; count: number }[];
}

export const useDashboard = (): UseDashboardReturn => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Computed values
  const computedData = useMemo(() => {
    if (!dashboardData) return null;

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // Today's reservations
    const todaysReservations = dashboardData.upcomingReservations.filter(
      reservation => reservation.date === today
    );

    // This week's activity
    const thisWeekActivity = dashboardData.recentActivity.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= weekAgo;
    });

    // Available favorites
    const availableFavorites = dashboardData.favoriteSpaces.filter(
      space => space.availability === 'available'
    );

    // Total upcoming cost
    const totalUpcomingCost = dashboardData.upcomingReservations.reduce(
      (total, reservation) => total + reservation.price, 0
    );

    // Average booking duration
    const averageBookingDuration = dashboardData.upcomingReservations.length > 0
      ? dashboardData.upcomingReservations.reduce(
          (total, reservation) => total + reservation.duration, 0
        ) / dashboardData.upcomingReservations.length
      : 0;

    // Most used space type
    const mostUsedSpaceType = getMostUsedSpaceType(dashboardData.upcomingReservations);

    // Booking trend
    const bookingTrend = getBookingTrend(dashboardData.monthlyBookings);

    // Monthly spending trend (percentage change from last month)
    const monthlySpendingTrend = getMonthlySpendingTrend(dashboardData.monthlyBookings);

    // Upcoming this week
    const upcomingThisWeek = dashboardData.upcomingReservations.filter(reservation => {
      const reservationDate = new Date(reservation.date);
      return reservationDate <= weekFromNow;
    });

    // Favorite space types distribution
    const favoriteSpaceTypes = dashboardData.favoriteSpaces.reduce((acc, space) => {
      acc[space.type] = (acc[space.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Peak booking hours analysis
    const peakBookingHours = getPeakBookingHours(dashboardData.upcomingReservations);

    return {
      todaysReservations,
      thisWeekActivity,
      availableFavorites,
      totalUpcomingCost,
      averageBookingDuration,
      mostUsedSpaceType,
      bookingTrend,
      monthlySpendingTrend,
      upcomingThisWeek,
      favoriteSpaceTypes,
      peakBookingHours
    };
  }, [dashboardData]);

  // Helper functions for computed data
  const getMostUsedSpaceType = (reservations: UpcomingReservation[]): string | null => {
    if (reservations.length === 0) return null;
    
    const typeCounts = reservations.reduce((acc, reservation) => {
      acc[reservation.spaceType] = (acc[reservation.spaceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostUsed = Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0]] > typeCounts[b[0]] ? a : b
    );
    
    return mostUsed?.[0] || null;
  };

  const getBookingTrend = (monthlyData: MonthlyBookingData[]): 'increasing' | 'decreasing' | 'stable' => {
    if (monthlyData.length < 2) return 'stable';
    
    const lastMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
    
    if (lastMonth.bookings > previousMonth.bookings) return 'increasing';
    if (lastMonth.bookings < previousMonth.bookings) return 'decreasing';
    return 'stable';
  };

  const getMonthlySpendingTrend = (monthlyData: MonthlyBookingData[]): number => {
    if (monthlyData.length < 2) return 0;
    
    const lastMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
    
    if (previousMonth.spent === 0) return 0;
    
    return Math.round(((lastMonth.spent - previousMonth.spent) / previousMonth.spent) * 100);
  };

  const getPeakBookingHours = (reservations: UpcomingReservation[]): { hour: number; count: number }[] => {
    const hourCounts = reservations.reduce((acc, reservation) => {
      const hour = parseInt(reservation.startTime.split(':')[0]);
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 peak hours
  };

  // Action handlers
  const refreshDashboard = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh dashboard');
    } finally {
      setLoading(false);
    }
  };

  const extendBooking = async (reservationId: string, additionalHours: number): Promise<void> => {
    try {
      await dashboardService.extendBooking(reservationId, additionalHours);
      await refreshDashboard(); // Refresh data after extending
    } catch (err) {
      throw new Error('Failed to extend booking');
    }
  };

  const cancelBooking = async (reservationId: string): Promise<void> => {
    try {
      await dashboardService.cancelBooking(reservationId);
      await refreshDashboard(); // Refresh data after canceling
    } catch (err) {
      throw new Error('Failed to cancel booking');
    }
  };

  return {
    dashboardData,
    computedData,
    loading,
    error,
    refreshDashboard,
    extendBooking,
    cancelBooking
  };
};