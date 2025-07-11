import { LucideIcon } from 'lucide-react';

// User & Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  refreshToken?: string;
}

// Theme Types
export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface FormErrors {
  [key: string]: string;
}

// Space Types
export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  capacity: number;
  pricePerHour: number;
  pricePerDay: number;
  rating: number;
  reviewCount: number;
  amenities: Amenity[];
  available: boolean;
  imageUrl?: string;
  images: string[];
  description: string;
  location: SpaceLocation;
  workingHours: WorkingHours;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpaceType {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: 'technology' | 'comfort' | 'food' | 'meeting' | 'other';
}

export interface SpaceLocation {
  floor: number;
  room: string;
  building?: string;
  area?: string;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
}

// Booking Types
export interface Booking {
  id: string;
  userId: string;
  spaceId: string;
  spaceName: string;
  spaceType: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // in hours
  totalPrice: number;
  status: BookingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';

export interface BookingFormData {
  spaceId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  hoursThisMonth: number;
  totalSpent: number;
  favoriteSpaces: number;
}

// Filter Types
export interface SpaceFilters {
  type?: string;
  building?: string;
  capacity?: number;
  minPrice?: number;
  maxPrice?: number;
  priceRange?: [number, number];
  amenities?: string[];
  availability?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  rating?: number;
}

// Navigation Types
export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: FormErrors;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export interface ErrorProps {
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

// Admin Types (for future use)
export interface AdminStats {
  totalUsers: number;
  totalSpaces: number;
  totalBookings: number;
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  occupancyRate: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}