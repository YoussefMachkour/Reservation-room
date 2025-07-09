import { format, parse, isAfter, isBefore, differenceInMinutes, addDays, addWeeks, addMonths } from 'date-fns';
import type { Reservation, ReservationStatus, RecurrencePattern, RecurrenceType } from '../types/booking';

// Format reservation status for display
export const formatReservationStatus = (status: ReservationStatus): string => {
  const statusMap = {
    confirmed: 'Confirmed',
    pending: 'Pending Approval',
    cancelled: 'Cancelled',
    completed: 'Completed',
    rejected: 'Rejected'
  };
  return statusMap[status] || status;
};

// Get status color for UI
export const getStatusColor = (status: ReservationStatus): string => {
  const colorMap = {
    confirmed: 'text-green-600 dark:text-green-400',
    pending: 'text-yellow-600 dark:text-yellow-400',
    cancelled: 'text-red-600 dark:text-red-400',
    completed: 'text-blue-600 dark:text-blue-400',
    rejected: 'text-red-600 dark:text-red-400'
  };
  return colorMap[status] || 'text-gray-600 dark:text-gray-400';
};

// Get status background color for badges
export const getStatusBgColor = (status: ReservationStatus): string => {
  const bgColorMap = {
    confirmed: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    completed: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    rejected: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
  };
  return bgColorMap[status] || 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
};

// Calculate reservation duration in minutes
export const getReservationDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return differenceInMinutes(end, start);
};

// Format duration for display
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

// Check if reservation is active (currently happening)
export const isReservationActive = (reservation: Reservation): boolean => {
  const now = new Date();
  const start = new Date(reservation.start_time);
  const end = new Date(reservation.end_time);
  
  return reservation.status === 'confirmed' && 
         isAfter(now, start) && 
         isBefore(now, end);
};

// Check if reservation is upcoming
export const isReservationUpcoming = (reservation: Reservation): boolean => {
  const now = new Date();
  const start = new Date(reservation.start_time);
  
  return reservation.status === 'confirmed' && isAfter(start, now);
};

// Check if reservation is in the past
export const isReservationPast = (reservation: Reservation): boolean => {
  const now = new Date();
  const end = new Date(reservation.end_time);
  
  return isAfter(now, end);
};

// Check if reservation can be cancelled
export const canCancelReservation = (reservation: Reservation): boolean => {
  return ['confirmed', 'pending'].includes(reservation.status);
};

// Check if reservation can be modified
export const canModifyReservation = (reservation: Reservation): boolean => {
  const now = new Date();
  const start = new Date(reservation.start_time);
  const thirtyMinutesBefore = new Date(start.getTime() - 30 * 60 * 1000);
  
  return ['confirmed', 'pending'].includes(reservation.status) && 
         isAfter(thirtyMinutesBefore, now);
};

// Check if reservation can be checked into
export const canCheckIn = (reservation: Reservation): boolean => {
  const now = new Date();
  const start = new Date(reservation.start_time);
  const end = new Date(reservation.end_time);
  const fifteenMinutesBefore = new Date(start.getTime() - 15 * 60 * 1000);
  
  return reservation.status === 'confirmed' &&
         !reservation.check_in_time &&
         isAfter(now, fifteenMinutesBefore) &&
         isBefore(now, end);
};

// Check if reservation can be checked out of
export const canCheckOut = (reservation: Reservation): boolean => {
  const now = new Date();
  const end = new Date(reservation.end_time);
  
  return reservation.status === 'confirmed' &&
         Boolean(reservation.check_in_time) &&
         !reservation.check_out_time &&
         isBefore(now, end);
};

// Format date and time for display
export const formatReservationDateTime = (dateTime: string): string => {
  const date = new Date(dateTime);
  return format(date, 'MMM d, yyyy \'at\' h:mm a');
};

// Format date range for display
export const formatDateRange = (startTime: string, endTime: string): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const startDate = format(start, 'MMM d, yyyy');
  const endDate = format(end, 'MMM d, yyyy');
  
  if (startDate === endDate) {
    return `${startDate} from ${format(start, 'h:mm a')} to ${format(end, 'h:mm a')}`;
  }
  
  return `${format(start, 'MMM d, yyyy h:mm a')} - ${format(end, 'MMM d, yyyy h:mm a')}`;
};

// Generate time slots for booking
export const generateTimeSlots = (
  startHour: number = 8, 
  endHour: number = 20, 
  interval: number = 30
): string[] => {
  const slots: string[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  
  return slots;
};

// Validate booking times
export const validateBookingTimes = (
  startTime: string, 
  endTime: string, 
  maxDuration: number = 480 // 8 hours in minutes
): { valid: boolean; error?: string } => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();
  
  // Check if start time is in the past
  if (isBefore(start, now)) {
    return { valid: false, error: 'Start time cannot be in the past' };
  }
  
  // Check if end time is after start time
  if (!isAfter(end, start)) {
    return { valid: false, error: 'End time must be after start time' };
  }
  
  // Check duration
  const duration = differenceInMinutes(end, start);
  if (duration > maxDuration) {
    return { valid: false, error: `Booking duration cannot exceed ${formatDuration(maxDuration)}` };
  }
  
  if (duration < 15) {
    return { valid: false, error: 'Minimum booking duration is 15 minutes' };
  }
  
  return { valid: true };
};

// Calculate next occurrence for recurring reservations
export const calculateNextOccurrence = (
  startTime: string, 
  pattern: RecurrencePattern
): string => {
  const start = new Date(startTime);
  
  switch (pattern.type) {
    case 'daily':
      return addDays(start, pattern.interval).toISOString();
    case 'weekly':
      return addWeeks(start, pattern.interval).toISOString();
    case 'monthly':
      return addMonths(start, pattern.interval).toISOString();
    default:
      return startTime;
  }
};

// Format recurrence pattern for display
export const formatRecurrencePattern = (pattern: RecurrencePattern): string => {
  if (pattern.type === 'none') return 'Does not repeat';
  
  const intervalText = pattern.interval === 1 ? '' : `every ${pattern.interval} `;
  
  switch (pattern.type) {
    case 'daily':
      return `Repeats ${intervalText}day${pattern.interval > 1 ? 's' : ''}`;
    case 'weekly':
      return `Repeats ${intervalText}week${pattern.interval > 1 ? 's' : ''}`;
    case 'monthly':
      return `Repeats ${intervalText}month${pattern.interval > 1 ? 's' : ''}`;
    default:
      return 'Does not repeat';
  }
};

// Get day names for weekly recurrence
export const getDayNames = (daysOfWeek: number[]): string[] => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return daysOfWeek.map(day => dayNames[day]);
};

// Check if two reservations conflict
export const doReservationsConflict = (
  reservation1: { start_time: string; end_time: string; space_id: string },
  reservation2: { start_time: string; end_time: string; space_id: string }
): boolean => {
  if (reservation1.space_id !== reservation2.space_id) {
    return false;
  }
  
  const start1 = new Date(reservation1.start_time);
  const end1 = new Date(reservation1.end_time);
  const start2 = new Date(reservation2.start_time);
  const end2 = new Date(reservation2.end_time);
  
  return isBefore(start1, end2) && isBefore(start2, end1);
};

// Additional utility functions for better type safety

// Safe boolean check for reservation properties
export const safeBoolean = (value: string | boolean | undefined): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

// Check if reservation is recurring with type safety
export const isRecurringReservation = (reservation: Reservation): boolean => {
  return safeBoolean(reservation.is_recurring);
};

// Check if no-show was reported with type safety
export const isNoShowReported = (reservation: Reservation): boolean => {
  return safeBoolean(reservation.no_show_reported);
};

// Get reservation recurrence pattern safely
export const getRecurrencePattern = (reservation: Reservation): RecurrencePattern | null => {
  if (!isRecurringReservation(reservation) || !reservation.recurrence_pattern) {
    return null;
  }
  
  // Handle case where recurrence_pattern might be a string (JSON)
  if (typeof reservation.recurrence_pattern === 'string') {
    try {
      return JSON.parse(reservation.recurrence_pattern);
    } catch {
      return null;
    }
  }
  
  return reservation.recurrence_pattern;
};

// Calculate total cost for a reservation
export const calculateReservationCost = (
  reservation: Reservation,
  space?: { pricePerHour?: number; pricePerDay?: number; pricePerMonth?: number }
): number => {
  if (!space?.pricePerHour) return 0;
  
  const duration = getReservationDuration(reservation.start_time, reservation.end_time);
  const hours = duration / 60;
  
  return hours * space.pricePerHour;
};

// Get human-readable time until reservation
export const getTimeUntilReservation = (reservation: Reservation): string => {
  const now = new Date();
  const start = new Date(reservation.start_time);
  const diffMinutes = differenceInMinutes(start, now);
  
  if (diffMinutes < 0) return 'Started';
  if (diffMinutes < 60) return `${diffMinutes} minutes`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours`;
  return `${Math.floor(diffMinutes / 1440)} days`;
};

// Validate participant count
export const validateParticipantCount = (
  count: number,
  spaceCapacity: number
): { valid: boolean; error?: string } => {
  if (count < 1) {
    return { valid: false, error: 'At least 1 participant is required' };
  }
  
  if (count > spaceCapacity) {
    return { valid: false, error: `Maximum capacity is ${spaceCapacity} people` };
  }
  
  return { valid: true };
};

// Check if reservation is within business hours
export const isWithinBusinessHours = (
  startTime: string,
  endTime: string,
  businessHours: { start: number; end: number } = { start: 8, end: 18 }
): boolean => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const startHour = start.getHours();
  const endHour = end.getHours();
  
  return startHour >= businessHours.start && endHour <= businessHours.end;
};

// Sort reservations by start time
export const sortReservationsByTime = (reservations: Reservation[]): Reservation[] => {
  return [...reservations].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
};

// Group reservations by date
export const groupReservationsByDate = (reservations: Reservation[]): Record<string, Reservation[]> => {
  return reservations.reduce((groups, reservation) => {
    const date = format(new Date(reservation.start_time), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(reservation);
    return groups;
  }, {} as Record<string, Reservation[]>);
};

// Filter reservations by date range
export const filterReservationsByDateRange = (
  reservations: Reservation[],
  startDate: string,
  endDate: string
): Reservation[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return reservations.filter(reservation => {
    const reservationStart = new Date(reservation.start_time);
    return reservationStart >= start && reservationStart <= end;
  });
};

// Space utility functions that were missing

// Get space type label for display
export const getSpaceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    meeting_room: 'Meeting Room',
    office: 'Office',
    auditorium: 'Auditorium',
    open_space: 'Open Space',
    hot_desk: 'Hot Desk',
    conference_room: 'Conference Room'
  };
  return labels[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Get space status label for display
export const getSpaceStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    available: 'Available',
    maintenance: 'Under Maintenance',
    out_of_service: 'Out of Service',
    reserved: 'Reserved'
  };
  return labels[status] || status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Get space status color for UI
export const getSpaceStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    available: 'text-green-600 dark:text-green-400',
    maintenance: 'text-yellow-600 dark:text-yellow-400',
    out_of_service: 'text-red-600 dark:text-red-400',
    reserved: 'text-blue-600 dark:text-blue-400'
  };
  return colors[status] || 'text-gray-600 dark:text-gray-400';
};

// Check if space is available for booking
export const isSpaceAvailable = (status: string): boolean => {
  return status === 'available';
};

// Get space capacity label
export const getSpaceCapacityLabel = (capacity: number): string => {
  if (capacity === 1) return '1 person';
  if (capacity <= 10) return `${capacity} people`;
  if (capacity <= 50) return `${capacity} people (medium)`;
  return `${capacity} people (large)`;
};

// Check if user can book a space
export const canBookSpace = (status: string, _userRole?: string): boolean => {
  if (!isSpaceAvailable(status)) return false;
  
  // If space requires approval and user is not admin/manager, they can still book but it will be pending
  return true;
};

// Format price for display
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
};

// Calculate price per person
export const calculatePricePerPerson = (price: number, capacity: number): number => {
  return capacity > 0 ? price / capacity : 0;
};

// Get equipment icon name (for UI components that need icon mapping)
export const getEquipmentIconName = (equipmentName: string): string => {
  const name = equipmentName.toLowerCase();
  if (name.includes('wifi') || name.includes('internet')) return 'wifi';
  if (name.includes('monitor') || name.includes('screen') || name.includes('display')) return 'monitor';
  if (name.includes('coffee') || name.includes('kitchen')) return 'coffee';
  if (name.includes('parking')) return 'car';
  if (name.includes('projector')) return 'projector';
  if (name.includes('whiteboard')) return 'edit';
  if (name.includes('phone')) return 'phone';
  if (name.includes('camera') || name.includes('video')) return 'video';
  return 'check-circle';
};

// Check if space has specific equipment
export const hasEquipment = (space: { equipment?: Array<{ name: string }> }, equipmentName: string): boolean => {
  if (!space.equipment) return false;
  return space.equipment.some(eq => 
    eq.name.toLowerCase().includes(equipmentName.toLowerCase())
  );
};

// Get total equipment count
export const getTotalEquipmentCount = (equipment: Array<{ quantity: number }>): number => {
  return equipment.reduce((total, item) => total + item.quantity, 0);
};

// Format surface area
export const formatSurfaceArea = (surface: number): string => {
  return `${surface} m²`;
};

// Calculate space utilization rate (if you have booking data)
export const calculateUtilizationRate = (
  reservations: Reservation[],
  totalHours: number = 24 * 7 // Default: hours in a week
): number => {
  const bookedHours = reservations.reduce((total, reservation) => {
    const duration = getReservationDuration(reservation.start_time, reservation.end_time);
    return total + (duration / 60); // Convert minutes to hours
  }, 0);
  
  return totalHours > 0 ? (bookedHours / totalHours) * 100 : 0;
};