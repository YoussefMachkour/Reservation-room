// types/space.ts - Complete types file matching backend DTO

export interface Equipment {
  name: string;
  quantity: number;
  description?: string;
}

export interface UserResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
  phone: string;
  profile_picture: string;
  department: string;
  position: string;
  created_at: string;
  updated_at: string;
}

// Main Space interface matching backend DTO exactly
export interface Space {
  id: string;
  name: string;
  type: string;
  capacity: number;
  building: string;
  floor: number;
  room_number: string;
  equipment: Equipment[] | null; // Make this more specific
  status: string;
  description: string;
  surface: number;
  photos: string[] | null;
  price_per_hour: number;
  price_per_day: number;
  price_per_month: number;
  manager_id?: string | null;
  manager?: UserResponse;
  requires_approval: boolean;
  booking_advance_time: number;
  max_booking_duration: number;
  full_location?: string;
  is_available?: boolean;
  created_at: string;
  updated_at: string;
}

// And make sure Equipment interface is properly defined
export interface Equipment {
  name: string;
  quantity: number;
  description?: string;
}

// Type literals for validation and filtering (what the backend actually uses)
export type SpaceType =
  | "meeting_room"
  | "office"
  | "auditorium"
  | "open_space"
  | "hot_desk"
  | "conference_room";

export type SpaceStatus =
  | "available"
  | "maintenance"
  | "out_of_service"
  | "reserved";

// Component-specific interface for UI components that expect arrays
export interface ComponentSpace extends Space {
  equipment: Equipment[]; // Always array for components
  photos: string[]; // Always array for components

  // Derived/computed fields for component compatibility
  available: boolean;
  pricePerHour: number;
  pricePerDay: number;
  images: string[];
  amenities: Equipment[];
}

// Filters interface
export interface SpaceFilters {
  type?: string; // String to match backend
  building?: string;
  capacity?: number;
  priceRange?: [number, number];
  equipment?: string[];
  status?: string; // String to match backend
}

// Space type options for UI
export interface SpaceTypeOption {
  value: string;
  label: string;
  icon: string;
  description?: string;
}

// Pagination interface (from backend DTO)
export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

// API Response interfaces
export interface SpaceListResponse {
  spaces: Space[];
  pagination: PaginationMeta;
}

export interface SpaceDetailsResponse extends Space {
  recent_reservations?: ReservationSummary[];
  upcoming_reservations?: ReservationSummary[];
  statistics?: SpaceStatistics;
}

export interface SpaceAvailabilityResponse {
  space_id: string;
  space_name: string;
  is_available: boolean;
  requested_slot: TimeSlot;
  conflicts?: ReservationConflict[];
  next_available?: TimeSlot;
  suggestions?: AvailabilitySlot[];
}

// Supporting interfaces
export interface TimeSlot {
  start_time: string;
  end_time: string;
}

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

export interface ReservationConflict {
  reservation_id: string;
  title: string;
  start_time: string;
  end_time: string;
  user_name: string;
  status: string;
}

export interface ReservationSummary {
  total_reservations: number;
  status_breakdown: Record<string, number>;
  average_per_day: number;
  peak_days?: string[];
}

export interface SpaceStatistics {
  total_reservations: number;
  reservations_this_week: number;
  reservations_this_month: number;
  utilization_rate: number;
  average_booking_duration: number;
  popular_time_slots: TimeSlotStats[];
  top_users: UserStats[];
}

export interface TimeSlotStats {
  hour: number;
  reservations: number;
}

export interface UserStats {
  user_id: string;
  user_name: string;
  reservations: number;
}

// Search and filter interfaces
export interface SearchFilters {
  types?: string[];
  buildings?: string[];
  floors?: number[];
  min_capacity?: number;
  max_capacity?: number;
  status?: string[];
  sort_by: string;
  sort_order: string;
}

export interface SpaceSearchResponse {
  spaces: Space[];
  filters: SearchFilters;
  pagination: PaginationMeta;
}

// Utility functions
export const mapApiSpaceToComponentSpace = (
  apiSpace: Space
): ComponentSpace => {
  return {
    // Direct mappings
    ...apiSpace,

    // Handle nullable arrays from backend
    equipment: apiSpace.equipment || [],
    photos: apiSpace.photos || [],

    // Derived fields for component compatibility
    available: apiSpace.status === "available",
    pricePerHour: apiSpace.price_per_hour,
    pricePerDay: apiSpace.price_per_day,
    images: apiSpace.photos || [],
    amenities: apiSpace.equipment || [],
  };
};

export const getSpaceTypeDisplay = (type: string): string => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "maintenance":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "out_of_service":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "reserved":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
};

export const matchesSpaceType = (
  spaceType: string,
  filterType?: string
): boolean => {
  if (!filterType) return true;
  return spaceType === filterType;
};

// Constants
export const SPACE_TYPES: SpaceTypeOption[] = [
  {
    value: "meeting_room",
    label: "Meeting Room",
    icon: "👥",
    description: "Small to medium meeting spaces",
  },
  {
    value: "office",
    label: "Office",
    icon: "🏢",
    description: "Private office spaces",
  },
  {
    value: "auditorium",
    label: "Auditorium",
    icon: "🎭",
    description: "Large presentation venues",
  },
  {
    value: "open_space",
    label: "Open Space",
    icon: "🌐",
    description: "Flexible open work areas",
  },
  {
    value: "hot_desk",
    label: "Hot Desk",
    icon: "💻",
    description: "Temporary desk spaces",
  },
  {
    value: "conference_room",
    label: "Conference Room",
    icon: "📊",
    description: "Large meeting rooms",
  },
];

export const SPACE_STATUSES: Array<{
  value: string;
  label: string;
  color: string;
}> = [
  { value: "available", label: "Available", color: "green" },
  { value: "maintenance", label: "Maintenance", color: "yellow" },
  { value: "out_of_service", label: "Out of Service", color: "red" },
  { value: "reserved", label: "Reserved", color: "blue" },
];
