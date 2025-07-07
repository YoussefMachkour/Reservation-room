// src/types/dashboard.ts
// TypeScript type definitions for dashboard

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  memberSince: string;
  totalBookings: number;
  favoriteSpaces: number;
  totalSpent: number;
  role: 'user' | 'premium' | 'business';
  preferences?: {
    notifications: boolean;
    defaultView: 'grid' | 'list';
    timezone: string;
  };
}

export interface DashboardStats {
  upcomingReservations: number;
  thisMonthBookings: number;
  favoriteSpaces: number;
  totalSpent: number;
  completedBookings: number;
  cancelledBookings: number;
  averageSessionDuration?: number;
  totalHoursBooked?: number;
}

export type ReservationStatus = 
  | 'confirmed' 
  | 'pending' 
  | 'cancelled' 
  | 'checked_in' 
  | 'completed' 
  | 'no_show';

export type SpaceType = 
  | 'private_office' 
  | 'meeting_room' 
  | 'hot_desk' 
  | 'creative_space' 
  | 'conference_room' 
  | 'phone_booth'
  | 'event_space'
  | 'workshop_room';

export interface UpcomingReservation {
  id: string;
  spaceId: string;
  spaceName: string;
  building: string;
  floor?: number;
  room?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in hours
  status: ReservationStatus;
  price: number;
  currency?: string;
  image: string;
  spaceType: SpaceType;
  capacity: number;
  equipment: string[];
  bookingDate: string;
  notes?: string;
  attendees?: number;
  isRecurring?: boolean;
  canModify?: boolean;
  canCancel?: boolean;
  checkInCode?: string;
}

export type ActivityType = 
  | 'booking_confirmed' 
  | 'booking_cancelled' 
  | 'favorite_added' 
  | 'favorite_removed' 
  | 'booking_completed' 
  | 'booking_modified' 
  | 'check_in' 
  | 'check_out' 
  | 'payment_completed'
  | 'payment_failed'
  | 'review_submitted'
  | 'space_rated'
  | 'profile_updated';

export interface RecentActivity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  spaceId?: string;
  spaceName?: string;
  metadata?: {
    price?: number;
    duration?: number;
    oldDate?: string;
    newDate?: string;
    rating?: number;
    attendees?: number;
    [key: string]: any;
  };
  isRead?: boolean;
}

export type SpaceAvailability = 'available' | 'busy' | 'maintenance' | 'unavailable';

export interface FavoriteSpace {
  id: string;
  name: string;
  building: string;
  floor: number;
  room?: string;
  type: SpaceType;
  pricePerHour: number;
  pricePerDay?: number;
  pricePerMonth?: number;
  image: string;
  images?: string[];
  rating: number;
  totalReviews: number;
  capacity: number;
  equipment: string[];
  availability: SpaceAvailability;
  isPopular?: boolean;
  addedToFavoritesDate: string;
  lastBookedDate?: string;
  bookingCount?: number;
  description?: string;
  amenities?: string[];
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface MonthlyBookingData {
  month: string;
  bookings: number;
  hours: number;
  spent: number;
  year: number;
  averagePrice?: number;
  mostUsedSpaceType?: SpaceType;
}

export type QuickActionColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: 'navigate' | 'modal' | 'external' | 'extend_booking' | 'quick_book';
  href?: string;
  color: QuickActionColor;
  enabled?: boolean;
  badge?: string | number;
  metadata?: {
    spaceId?: string;
    reservationId?: string;
    [key: string]: any;
  };
}

export interface DashboardInsight {
  type: 'cost_saving' | 'usage_pattern' | 'new_feature' | 'recommendation' | 'alert';
  title: string;
  description: string;
  action?: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  dismissible?: boolean;
  expiresAt?: string;
}

export interface DashboardMetrics {
  utilizationRate: number; // percentage
  avgSessionLength: number; // hours
  favoriteSpaceUsage: number; // percentage
  costEfficiency: 'poor' | 'fair' | 'good' | 'excellent';
  punctualityScore?: number; // percentage
  cancellationRate?: number; // percentage
}

export interface DashboardData {
  user: DashboardUser;
  stats: DashboardStats;
  upcomingReservations: UpcomingReservation[];
  recentActivity: RecentActivity[];
  favoriteSpaces: FavoriteSpace[];
  monthlyBookings: MonthlyBookingData[];
  quickActions: QuickAction[];
  insights?: DashboardInsight[];
  metrics?: DashboardMetrics;
  notifications?: DashboardNotification[];
}

export interface DashboardNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high';
  persistent?: boolean;
}

// Computed data interfaces
export interface BookingTrendData {
  trend: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
  comparison: 'month' | 'quarter' | 'year';
}

export interface SpaceUsagePattern {
  spaceType: SpaceType;
  usageCount: number;
  totalHours: number;
  averagePrice: number;
  percentage: number;
}

export interface TimeSlotUsage {
  hour: number;
  count: number;
  label: string; // e.g., "9 AM", "2 PM"
  percentage: number;
}

export interface DashboardFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  spaceTypes?: SpaceType[];
  buildings?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  status?: ReservationStatus[];
}

// API Response types
export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  message?: string;
  timestamp: string;
}

export interface BookingActionResponse {
  success: boolean;
  message: string;
  data?: {
    reservationId: string;
    updatedReservation?: UpcomingReservation;
    refundAmount?: number;
    newEndTime?: string;
  };
}

// Hook return types
export interface UseDashboardReturn {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
  extendBooking: (reservationId: string, additionalHours: number) => Promise<void>;
  cancelBooking: (reservationId: string) => Promise<void>;
  checkIn: (reservationId: string) => Promise<void>;
  checkOut: (reservationId: string) => Promise<void>;
}

// Error types
export interface DashboardError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Configuration types
export interface DashboardConfig {
  refreshInterval: number; // milliseconds
  maxRecentActivities: number;
  defaultDateRange: number; // days
  enableAutoRefresh: boolean;
  enableNotifications: boolean;
  chartColors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
  };
}