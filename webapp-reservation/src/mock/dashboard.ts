import { DashboardData } from "@/types/dashboard";

// mockData/dashboardData.ts
export const mockDashboardData: DashboardData = {
  user: {
    id: "user_12345",
    name: "Alexandra Chen",
    email: "alex.chen@techstartup.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
    memberSince: "2023-03-15T00:00:00Z",
    totalBookings: 47,
    favoriteSpaces: 12,
    totalSpent: 3240,
    role: "premium"
  },
  
  stats: {
    upcomingReservations: 4,
    thisMonthBookings: 8,
    favoriteSpaces: 12,
    totalSpent: 3240,
    completedBookings: 43,
    cancelledBookings: 4
  },
  
  upcomingReservations: [
    {
      id: "res_001",
      spaceId: "space_101",
      spaceName: "Executive Suite A",
      building: "Innovation Tower",
      floor: 12,
      date: "2025-07-08",
      startTime: "09:00",
      endTime: "12:00",
      duration: 3,
      status: "confirmed",
      price: 180,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop",
      spaceType: "private_office",
      capacity: 4,
      equipment: ["4K Monitor", "Video Conferencing", "Whiteboard", "Coffee Machine"],
      bookingDate: "2025-07-01T14:30:00Z"
    },
    {
      id: "res_002",
      spaceId: "space_205",
      spaceName: "Creative Studio Pro",
      building: "Design Hub",
      floor: 3,
      date: "2025-07-08",
      startTime: "14:00",
      endTime: "18:00",
      duration: 4,
      status: "confirmed",
      price: 160,
      image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=250&fit=crop",
      spaceType: "creative_space",
      capacity: 8,
      equipment: ["Drawing Tablets", "Design Software", "Large Display", "Sound System"],
      bookingDate: "2025-07-02T09:15:00Z"
    },
    {
      id: "res_003",
      spaceId: "space_150",
      spaceName: "Board Room Alpha",
      building: "Main Building",
      floor: 15,
      date: "2025-07-10",
      startTime: "10:00",
      endTime: "11:30",
      duration: 1.5,
      status: "pending",
      price: 90,
      image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=400&h=250&fit=crop",
      spaceType: "conference_room",
      capacity: 12,
      equipment: ["Video Wall", "Conference Phone", "Wireless Presentation", "Climate Control"],
      bookingDate: "2025-07-07T16:45:00Z"
    },
    {
      id: "res_004",
      spaceId: "space_078",
      spaceName: "Focus Pod 7",
      building: "Innovation Tower",
      floor: 5,
      date: "2025-07-11",
      startTime: "13:00",
      endTime: "15:00",
      duration: 2,
      status: "confirmed",
      price: 40,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=250&fit=crop",
      spaceType: "phone_booth",
      capacity: 1,
      equipment: ["Noise Cancellation", "USB Charging", "Adjustable Lighting"],
      bookingDate: "2025-07-06T11:20:00Z"
    }
  ],
  
  recentActivity: [
    {
      id: "act_001",
      type: "booking_confirmed",
      message: "Booking confirmed for Executive Suite A",
      timestamp: "2025-07-07T16:45:00Z",
      spaceId: "space_101",
      spaceName: "Executive Suite A",
      metadata: {
        price: 180,
        duration: 3
      }
    },
    {
      id: "act_002",
      type: "favorite_added",
      message: "Added Focus Pod 7 to your favorites",
      timestamp: "2025-07-07T14:20:00Z",
      spaceId: "space_078",
      spaceName: "Focus Pod 7"
    },
    {
      id: "act_003",
      type: "check_out",
      message: "Checked out from Creative Studio Pro",
      timestamp: "2025-07-06T18:15:00Z",
      spaceId: "space_205",
      spaceName: "Creative Studio Pro",
      metadata: {
        duration: 4
      }
    },
    {
      id: "act_004",
      type: "payment_completed",
      message: "Payment completed for Team Room B",
      timestamp: "2025-07-06T10:30:00Z",
      spaceId: "space_142",
      spaceName: "Team Room B",
      metadata: {
        price: 120
      }
    },
    {
      id: "act_005",
      type: "booking_modified",
      message: "Modified booking time for Meeting Room C",
      timestamp: "2025-07-05T15:45:00Z",
      spaceId: "space_089",
      spaceName: "Meeting Room C",
      metadata: {
        oldDate: "2025-07-09T14:00:00Z",
        newDate: "2025-07-09T16:00:00Z"
      }
    },
    {
      id: "act_006",
      type: "booking_completed",
      message: "Successfully completed 4-hour session at Open Workspace",
      timestamp: "2025-07-05T17:00:00Z",
      spaceId: "space_023",
      spaceName: "Open Workspace",
      metadata: {
        duration: 4,
        price: 80
      }
    },
    {
      id: "act_007",
      type: "booking_cancelled",
      message: "Cancelled booking for Conference Room Delta",
      timestamp: "2025-07-04T09:15:00Z",
      spaceId: "space_167",
      spaceName: "Conference Room Delta",
      metadata: {
        price: 200
      }
    }
  ],
  
  favoriteSpaces: [
    {
      id: "space_101",
      name: "Executive Suite A",
      building: "Innovation Tower",
      floor: 12,
      type: "private_office",
      pricePerHour: 60,
      pricePerDay: 400,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop",
      rating: 4.9,
      totalReviews: 127,
      capacity: 4,
      equipment: ["4K Monitor", "Video Conferencing", "Whiteboard", "Coffee Machine", "Printer"],
      availability: "available",
      isPopular: true,
      addedToFavoritesDate: "2025-06-15T10:30:00Z"
    },
    {
      id: "space_205",
      name: "Creative Studio Pro",
      building: "Design Hub",
      floor: 3,
      type: "creative_space",
      pricePerHour: 40,
      pricePerDay: 280,
      image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=250&fit=crop",
      rating: 4.8,
      totalReviews: 93,
      capacity: 8,
      equipment: ["Drawing Tablets", "Design Software", "Large Display", "Sound System"],
      availability: "available",
      isPopular: true,
      addedToFavoritesDate: "2025-06-20T14:15:00Z"
    },
    {
      id: "space_078",
      name: "Focus Pod 7",
      building: "Innovation Tower",
      floor: 5,
      type: "phone_booth",
      pricePerHour: 20,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=250&fit=crop",
      rating: 4.7,
      totalReviews: 56,
      capacity: 1,
      equipment: ["Noise Cancellation", "USB Charging", "Adjustable Lighting"],
      availability: "available",
      addedToFavoritesDate: "2025-07-07T14:20:00Z"
    },
    {
      id: "space_150",
      name: "Board Room Alpha",
      building: "Main Building",
      floor: 15,
      type: "conference_room",
      pricePerHour: 80,
      pricePerDay: 600,
      image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=400&h=250&fit=crop",
      rating: 4.9,
      totalReviews: 78,
      capacity: 12,
      equipment: ["Video Wall", "Conference Phone", "Wireless Presentation", "Climate Control"],
      availability: "busy",
      isPopular: true,
      addedToFavoritesDate: "2025-05-30T16:45:00Z"
    },
    {
      id: "space_089",
      name: "Meeting Room C",
      building: "Innovation Tower",
      floor: 8,
      type: "meeting_room",
      pricePerHour: 35,
      pricePerDay: 250,
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop",
      rating: 4.6,
      totalReviews: 41,
      capacity: 6,
      equipment: ["Smart TV", "Video Call Setup", "Whiteboard", "Fast WiFi"],
      availability: "available",
      addedToFavoritesDate: "2025-06-10T11:30:00Z"
    },
    {
      id: "space_023",
      name: "Open Workspace",
      building: "Main Building",
      floor: 2,
      type: "hot_desk",
      pricePerHour: 15,
      pricePerDay: 100,
      image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=250&fit=crop",
      rating: 4.5,
      totalReviews: 234,
      capacity: 20,
      equipment: ["Standing Desks", "Monitor Access", "Power Outlets", "Communal Kitchen"],
      availability: "available",
      addedToFavoritesDate: "2025-04-22T09:15:00Z"
    }
  ],
  
  monthlyBookings: [
    { month: "Jan", bookings: 6, hours: 24, spent: 480, year: 2025 },
    { month: "Feb", bookings: 8, hours: 32, spent: 640, year: 2025 },
    { month: "Mar", bookings: 5, hours: 20, spent: 400, year: 2025 },
    { month: "Apr", bookings: 10, hours: 40, spent: 800, year: 2025 },
    { month: "May", bookings: 7, hours: 28, spent: 560, year: 2025 },
    { month: "Jun", bookings: 9, hours: 36, spent: 720, year: 2025 },
    { month: "Jul", bookings: 8, hours: 32, spent: 640, year: 2025 }
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
    },
    {
      id: "action_002",
      title: "Extend Current Booking",
      description: "Add more time to your active session",
      icon: "clock",
      action: "extend_booking",
      color: "green"
    },
    {
      id: "action_003",
      title: "Browse Favorites",
      description: "Quick access to your saved spaces",
      icon: "heart",
      action: "navigate",
      href: "/favorites",
      color: "purple"
    },
    {
      id: "action_004",
      title: "View Reports",
      description: "See your usage analytics and spending",
      icon: "bar-chart-3",
      action: "navigate",
      href: "/reports",
      color: "orange"
    }
  ]
};

// Alternative user profiles for testing different scenarios
export const alternativeUserProfiles = {
  newUser: {
    user: {
      id: "user_67890",
      name: "Jordan Smith",
      email: "jordan.smith@company.com",
      memberSince: "2025-06-20T00:00:00Z",
      totalBookings: 3,
      favoriteSpaces: 2,
      totalSpent: 120,
      role: "user" as const
    },
    stats: {
      upcomingReservations: 1,
      thisMonthBookings: 2,
      favoriteSpaces: 2,
      totalSpent: 120,
      completedBookings: 1,
      cancelledBookings: 0
    }
  },
  
  powerUser: {
    user: {
      id: "user_54321",
      name: "Sarah Martinez",
      email: "sarah.martinez@enterprise.com",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      memberSince: "2022-01-10T00:00:00Z",
      totalBookings: 186,
      favoriteSpaces: 25,
      totalSpent: 12450,
      role: "business" as const
    },
    stats: {
      upcomingReservations: 7,
      thisMonthBookings: 15,
      favoriteSpaces: 25,
      totalSpent: 12450,
      completedBookings: 179,
      cancelledBookings: 7
    }
  }
};
