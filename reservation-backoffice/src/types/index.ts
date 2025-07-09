// User types
export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'manager' | 'staff'
  avatar?: string
  createdAt: string
}

// Member types (for coworking space members)
export interface Member {
  id: string
  name: string
  email: string
  phone: string
  membershipType: 'Premium' | 'Basic' | 'Enterprise'
  status: 'active' | 'expired' | 'suspended'
  avatar?: string
  joinDate: string
  lastActive: string
  totalBookings: number
  monthlySpend: number
  address: string
  company: string
  notes?: string
}

// Space types (for coworking spaces)
export interface Space {
  id: string
  name: string
  type: 'Meeting Room' | 'Private Office' | 'Hot Desk' | 'Coworking Space'
  location: string
  capacity: number
  pricePerHour?: number
  pricePerDay?: number
  pricePerMonth?: number
  status: 'Available' | 'Occupied' | 'Disabled'
  amenities: string[]
  description?: string
  createdAt: string
  images?: string[] // Change from 'image' to 'images'
}

// Reservation types
export interface Reservation {
  id: string
  memberName: string
  memberEmail: string
  memberPhone: string
  spaceName: string
  spaceId: string
  date: string
  startTime: string
  endTime: string
  duration: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  createdAt: string
  updatedAt: string
}

// Message types
export interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  type: 'text' | 'booking_confirmation' | 'membership_renewal' | 'cancellation'
  isRead: boolean
}

// Payment types
export interface Payment {
  id: string
  invoiceId: string
  memberName: string
  memberEmail: string
  description: string
  amount: number
  currency: string
  status: 'Completed' | 'Pending' | 'Failed'
  method: 'Visa' | 'PayPal' | 'Mastercard' | 'Bank Transfer'
  date: string
  createdAt: string
}

// Dashboard stats
export interface DashboardStats {
  newBookings: number
  occupancyRate: number
  activeMembers: number
  revenue: number
  bookingGrowth: number
  occupancyGrowth: number
  memberGrowth: number
}

// Analytics data
export interface AnalyticsData {
  totalRevenue: number
  spaceUtilization: number
  memberGrowth: number
  avgBookingDuration: number
  revenueGrowth: number
  utilizationGrowth: number
  memberGrowthCount: number
}

// Popular spaces data
export interface PopularSpace {
  name: string
  utilizationRate: number
}

// Chart data types
export interface ChartData {
  name: string
  value: number
  date?: string
}

// Quick action types
export interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  action: () => void
}

// Recent activity types
export interface RecentActivity {
  id: string
  type: 'booking' | 'membership' | 'cancellation' | 'payment'
  description: string
  timestamp: string
  user: string
}

// Table types for restaurant
export interface Table {
  id: string
  number: string
  capacity: number
  location: string
  isAvailable: boolean
}