// src/utils/dashboardHelpers.ts
// Pure utility functions for dashboard data manipulation

import { MonthlyBookingData } from '../types/dashboard';

export const dashboardHelpers = {
  // Date and time utilities
  formatDate: (dateString: string, format: 'short' | 'long' | 'relative' = 'short') => {
    const date = new Date(dateString);
    const now = new Date();
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
      case 'long':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric',
          month: 'long', 
          day: 'numeric' 
        });
      case 'relative':
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  },

  formatTimeRange: (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  },

  calculateDuration: (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
  },

  // Status and badge utilities
  getStatusBadgeClass: (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'confirmed':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      case 'checked_in':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`;
    }
  },

  getAvailabilityBadgeClass: (availability: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (availability) {
      case 'available':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'busy':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case 'maintenance':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`;
    }
  },

  // Activity icon utilities
  getActivityIcon: (type: string) => {
    const iconMap: Record<string, string> = {
      'booking_confirmed': 'CheckCircle',
      'booking_cancelled': 'XCircle',
      'favorite_added': 'Heart',
      'favorite_removed': 'HeartOff',
      'booking_completed': 'CheckCircle2',
      'booking_modified': 'Edit',
      'check_in': 'LogIn',
      'check_out': 'LogOut',
      'payment_completed': 'CreditCard'
    };
    return iconMap[type] || 'AlertCircle';
  },

  getActivityIconColor: (type: string) => {
    const colorMap: Record<string, string> = {
      'booking_confirmed': 'text-green-500',
      'booking_cancelled': 'text-red-500',
      'favorite_added': 'text-red-500',
      'favorite_removed': 'text-gray-500',
      'booking_completed': 'text-blue-500',
      'booking_modified': 'text-yellow-500',
      'check_in': 'text-purple-500',
      'check_out': 'text-orange-500',
      'payment_completed': 'text-green-600'
    };
    return colorMap[type] || 'text-gray-500';
  },

  // Price formatting
  formatPrice: (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  },

  // Space type utilities
  getSpaceTypeEmoji: (spaceType: string) => {
    const emojiMap: Record<string, string> = {
      'private_office': '🏢',
      'meeting_room': '🤝',
      'hot_desk': '💻',
      'creative_space': '🎨',
      'conference_room': '📊',
      'phone_booth': '📞'
    };
    return emojiMap[spaceType] || '🏠';
  },

  getSpaceTypeLabel: (spaceType: string) => {
    const labelMap: Record<string, string> = {
      'private_office': 'Private Office',
      'meeting_room': 'Meeting Room',
      'hot_desk': 'Hot Desk',
      'creative_space': 'Creative Space',
      'conference_room': 'Conference Room',
      'phone_booth': 'Phone Booth'
    };
    return labelMap[spaceType] || 'Unknown Space';
  },

  // Chart utilities
  getChartMaxValue: (data: MonthlyBookingData[], key: 'bookings' | 'hours' | 'spent') => {
    return Math.max(...data.map(item => item[key]));
  },

  calculateChartHeight: (value: number, maxValue: number, maxHeight: number = 200) => {
    return Math.max((value / maxValue) * maxHeight, 8); // Minimum 8px height
  },

  // Additional utility functions
  getTimeUntilBooking: (date: string, startTime: string) => {
    const bookingDateTime = new Date(`${date}T${startTime}`);
    const now = new Date();
    const diffMs = bookingDateTime.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Started';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
    
    if (diffHours > 0) {
      return `in ${diffHours}h ${diffMinutes}m`;
    }
    
    return `in ${diffMinutes}m`;
  },

  getTrendPercentage: (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  },

  isBookingToday: (date: string) => {
    const bookingDate = new Date(date);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  },

  isBookingUpcoming: (date: string, startTime: string) => {
    const bookingDateTime = new Date(`${date}T${startTime}`);
    const now = new Date();
    return bookingDateTime > now;
  },

  sortReservationsByDate: (reservations: any[]) => {
    return [...reservations].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });
  },

  groupReservationsByDate: (reservations: any[]) => {
    return reservations.reduce((groups, reservation) => {
      const date = reservation.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(reservation);
      return groups;
    }, {} as Record<string, any[]>);
  }
};