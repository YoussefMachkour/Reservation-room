import { User } from './auth';
import { Space } from './space';

export type ReservationStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'rejected';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number;
  days_of_week?: number[]; // 0=Sunday, 1=Monday, etc.
  end_date?: string;
  max_occurrences?: number;
}

// Import the correct types from their specific files
export type { User } from './auth';
export type { Space } from './space';

export interface Reservation {
  id: string;
  user_id: string;
  space_id: string;
  start_time: string;
  end_time: string;
  participant_count: number;
  title: string;
  description: string;
  status: ReservationStatus;
  is_recurring: boolean;
  recurrence_parent_id?: string;
  recurrence_pattern?: RecurrencePattern;
  approver_id?: string;
  approval_comments?: string;
  cancellation_reason?: string;
  check_in_time?: string;
  check_out_time?: string;
  no_show_reported: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships - using the correct imported types
  user?: User;
  space?: Space;
  approver?: User;
  child_reservations?: Reservation[];
}

export interface CreateReservationRequest {
  space_id: string;
  start_time: string;
  end_time: string;
  participant_count: number;
  title: string;
  description?: string;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
}

export interface UpdateReservationRequest {
  start_time?: string;
  end_time?: string;
  participant_count?: number;
  title?: string;
  description?: string;
  status?: ReservationStatus;
  cancellation_reason?: string;
}

export interface BookingFormData {
  title: string;
  description?: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  participant_count: number;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  reservation?: Reservation;
}

export interface AvailabilityResponse {
  date: string;
  available_slots: TimeSlot[];
  unavailable_slots: TimeSlot[];
}