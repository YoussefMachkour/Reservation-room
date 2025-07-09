import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Star, 
  DollarSign, 
  CalendarDays,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Building,
  Heart,
  Plus
} from 'lucide-react';
import { dashboardHelpers } from '../../utils/dashboardHelpers';
import { DashboardData } from '../../types/dashboard';

// Mock data - replace with actual API calls
const mockDashboardData: DashboardData = {
  user: {
    id: "user_001",
    name: "John Doe",
    email: "john.doe@example.com",
    memberSince: "2023-01-15",
    totalBookings: 24,
    favoriteSpaces: 8,
    totalSpent: 1280,
    role: "user"
  },
  stats: {
    upcomingReservations: 3,
    thisMonthBookings: 6,
    favoriteSpaces: 8,
    totalSpent: 1280,
    completedBookings: 21,
    cancelledBookings: 3
  },
  upcomingReservations: [
    {
      id: "res_001",
      spaceId: "space_001",
      spaceName: "Executive Suite A",
      building: "Main Building",
      date: "2025-07-08",
      startTime: "09:00",
      endTime: "12:00",
      duration: 3,
      status: "confirmed",
      price: 120,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop",
      spaceType: "private_office",
      capacity: 4,
      equipment: ["Video Conferencing", "Whiteboard"],
      bookingDate: "2025-07-01T10:00:00Z"
    },
    {
      id: "res_002",
      spaceId: "space_002",
      spaceName: "Creative Studio",
      building: "Innovation Hub",
      date: "2025-07-10",
      startTime: "14:00",
      endTime: "18:00",
      duration: 4,
      status: "confirmed",
      price: 80,
      image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300&h=200&fit=crop",
      spaceType: "creative_space",
      capacity: 8,
      equipment: ["Drawing Tablets", "Design Software"],
      bookingDate: "2025-07-02T14:00:00Z"
    },
    {
      id: "res_003",
      spaceId: "space_003",
      spaceName: "Meeting Room B",
      building: "Main Building",
      date: "2025-07-12",
      startTime: "10:00",
      endTime: "11:30",
      duration: 1.5,
      status: "pending",
      price: 45,
      image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=300&h=200&fit=crop",
      spaceType: "meeting_room",
      capacity: 6,
      equipment: ["Smart TV", "Video Call Setup"],
      bookingDate: "2025-07-05T16:00:00Z"
    }
  ],
  recentActivity: [
    {
      id: "act_001",
      type: "booking_confirmed",
      message: "Booking confirmed for Executive Suite A",
      timestamp: "2025-07-07T10:30:00Z",
      spaceName: "Executive Suite A"
    },
    {
      id: "act_002",
      type: "favorite_added",
      message: "Added Creative Studio to favorites",
      timestamp: "2025-07-06T15:20:00Z",
      spaceName: "Creative Studio"
    },
    {
      id: "act_003",
      type: "booking_completed",
      message: "Completed booking at Open Workspace",
      timestamp: "2025-07-05T18:00:00Z",
      spaceName: "Open Workspace"
    },
    {
      id: "act_004",
      type: "booking_cancelled",
      message: "Cancelled booking for Conference Room C",
      timestamp: "2025-07-04T09:15:00Z",
      spaceName: "Conference Room C"
    }
  ],
  favoriteSpaces: [
    {
      id: "space_001",
      name: "Executive Suite A",
      building: "Main Building",
      floor: 5,
      type: "private_office",
      pricePerHour: 40,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop",
      rating: 4.8,
      totalReviews: 127,
      capacity: 4,
      equipment: ["Video Conferencing", "Whiteboard"],
      availability: "available",
      addedToFavoritesDate: "2025-06-15T10:30:00Z"
    },
    {
      id: "space_002",
      name: "Creative Studio",
      building: "Innovation Hub",
      floor: 3,
      type: "creative_space",
      pricePerHour: 20,
      image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300&h=200&fit=crop",
      rating: 4.9,
      totalReviews: 93,
      capacity: 8,
      equipment: ["Drawing Tablets", "Design Software"],
      availability: "available",
      addedToFavoritesDate: "2025-06-20T14:15:00Z"
    },
    {
      id: "space_003",
      name: "Meeting Room B",
      building: "Main Building",
      floor: 2,
      type: "meeting_room",
      pricePerHour: 30,
      image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=300&h=200&fit=crop",
      rating: 4.7,
      totalReviews: 56,
      capacity: 6,
      equipment: ["Smart TV", "Video Call Setup"],
      availability: "available",
      addedToFavoritesDate: "2025-05-30T16:45:00Z"
    }
  ],
  monthlyBookings: [
    { month: 'Jan', bookings: 4, hours: 16, spent: 320, year: 2025 },
    { month: 'Feb', bookings: 6, hours: 24, spent: 480, year: 2025 },
    { month: 'Mar', bookings: 3, hours: 12, spent: 240, year: 2025 },
    { month: 'Apr', bookings: 8, hours: 32, spent: 640, year: 2025 },
    { month: 'May', bookings: 5, hours: 20, spent: 400, year: 2025 },
    { month: 'Jun', bookings: 7, hours: 28, spent: 560, year: 2025 },
    { month: 'Jul', bookings: 6, hours: 24, spent: 480, year: 2025 }
  ],
  quickActions: [
    {
      id: "action_001",
      title: "Book a Space",
      description: "Find and reserve your ideal workspace",
      icon: "calendar-plus",
      action: "navigate",
      href: "/spaces",
      color: "blue"
    }
  ]
};

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      setLoading(true);
      // Replace with actual API call
      setTimeout(() => {
        setDashboardData(mockDashboardData);
        setLoading(false);
      }, 1000);
    };

    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    const iconName = dashboardHelpers.getActivityIcon(type);
    const colorClass = dashboardHelpers.getActivityIconColor(type);
    
    const IconComponent = (() => {
      switch (iconName) {
        case 'CheckCircle':
          return CheckCircle;
        case 'XCircle':
          return XCircle;
        case 'Heart':
          return Heart;
        case 'CheckCircle2':
          return CheckCircle;
        default:
          return AlertCircle;
      }
    })();

    return <IconComponent className={`w-4 h-4 ${colorClass}`} />;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {dashboardData.user.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your bookings today.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          New Booking
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.stats.upcomingReservations}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.stats.thisMonthBookings}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CalendarDays className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Favorites</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.stats.favoriteSpaces}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardHelpers.formatPrice(dashboardData.stats.totalSpent)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Reservations */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming Reservations
              </h2>
              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData.upcomingReservations.map((reservation) => (
              <div key={reservation.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <img
                  src={reservation.image}
                  alt={reservation.spaceName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {reservation.spaceName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {reservation.building}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {dashboardHelpers.formatDate(reservation.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {dashboardHelpers.formatTimeRange(reservation.startTime, reservation.endTime)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={dashboardHelpers.getStatusBadgeClass(reservation.status)}>
                        {reservation.status}
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {dashboardHelpers.formatPrice(reservation.price)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {dashboardHelpers.formatDate(activity.timestamp, 'relative')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Favorite Spaces */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Favorite Spaces
            </h2>
            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1">
              Browse All Spaces
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.favoriteSpaces.map((space) => (
              <div key={space.id} className="group cursor-pointer">
                <div className="relative bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden transition-transform group-hover:scale-105">
                  <img
                    src={space.image}
                    alt={space.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Heart className="w-5 h-5 text-red-500 fill-current" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {space.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <Building className="w-4 h-4" />
                      {space.building}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {dashboardHelpers.formatPrice(space.pricePerHour)}/hr
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {space.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Booking Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Booking Trends
          </h2>
        </div>
        <div className="p-6">
          <div className="flex items-end justify-between h-48 gap-4">
            {dashboardData.monthlyBookings.map((data, index) => {
              const maxBookings = dashboardHelpers.getChartMaxValue(dashboardData.monthlyBookings, 'bookings');
              const height = dashboardHelpers.calculateChartHeight(data.bookings, maxBookings, 180);
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-blue-200 dark:bg-blue-800 rounded-t-lg transition-all hover:bg-blue-300 dark:hover:bg-blue-700"
                    style={{ height: `${height}px` }}
                  ></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {data.month}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {data.bookings}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;