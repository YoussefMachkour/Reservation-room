import { addDays, addHours, subDays, format } from 'date-fns';
import type { Reservation, RecurrencePattern } from '../types/booking';
import { mockSpaces } from './space';
import { mockUsers } from './user';

// Helper function to create dates
const createDateTime = (daysOffset: number, hour: number, minute: number = 0) => {
  const date = addDays(new Date(), daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

// Sample recurrence patterns
const weeklyPattern: RecurrencePattern = {
  type: 'weekly',
  interval: 1,
  days_of_week: [1, 3, 5], // Monday, Wednesday, Friday
  end_date: addDays(new Date(), 60).toISOString(),
  max_occurrences: 12
};

const dailyPattern: RecurrencePattern = {
  type: 'daily',
  interval: 1,
  end_date: addDays(new Date(), 14).toISOString(),
  max_occurrences: 10
};

const monthlyPattern: RecurrencePattern = {
  type: 'monthly',
  interval: 1,
  end_date: addDays(new Date(), 180).toISOString(),
  max_occurrences: 6
};

export const mockReservations: Reservation[] = [
  // Upcoming confirmed reservations
  {
    id: 'res-001',
    user_id: 'user-001',
    space_id: 'space-001',
    start_time: createDateTime(2, 9, 0), // Tomorrow 9 AM
    end_time: createDateTime(2, 11, 0), // Tomorrow 11 AM
    participant_count: 5,
    title: 'Team Sprint Planning',
    description: 'Planning session for the upcoming sprint. We will review user stories, estimate effort, and assign tasks.',
    status: 'confirmed',
    is_recurring: false,
    no_show_reported: false,
    created_at: subDays(new Date(), 3).toISOString(),
    updated_at: subDays(new Date(), 3).toISOString(),
    user: mockUsers[0],
    space: mockSpaces[0]
  },
  {
    id: 'res-002',
    user_id: 'user-001',
    space_id: 'space-003',
    start_time: createDateTime(5, 14, 0), // 5 days from now 2 PM
    end_time: createDateTime(5, 16, 0), // 5 days from now 4 PM
    participant_count: 12,
    title: 'Client Presentation',
    description: 'Quarterly business review presentation for our key client.',
    status: 'confirmed',
    is_recurring: false,
    no_show_reported: false,
    created_at: subDays(new Date(), 5).toISOString(),
    updated_at: subDays(new Date(), 2).toISOString(),
    user: mockUsers[0],
    space: mockSpaces[2]
  },
  
  // Recurring weekly team standup
  {
    id: 'res-003',
    user_id: 'user-001',
    space_id: 'space-002',
    start_time: createDateTime(1, 10, 0), // Tomorrow 10 AM
    end_time: createDateTime(1, 10, 30), // Tomorrow 10:30 AM
    participant_count: 8,
    title: 'Weekly Team Standup',
    description: 'Daily standup meeting to sync on progress and blockers.',
    status: 'confirmed',
    is_recurring: true,
    recurrence_pattern: weeklyPattern,
    no_show_reported: false,
    created_at: subDays(new Date(), 14).toISOString(),
    updated_at: subDays(new Date(), 14).toISOString(),
    user: mockUsers[0],
    space: mockSpaces[1]
  },

  // Pending approval reservation
  {
    id: 'res-004',
    user_id: 'user-001',
    space_id: 'space-004',
    start_time: createDateTime(7, 9, 0), // Next week 9 AM
    end_time: createDateTime(7, 17, 0), // Next week 5 PM
    participant_count: 25,
    title: 'Company All-Hands Meeting',
    description: 'Quarterly all-hands meeting with guest speakers and team updates.',
    status: 'pending',
    is_recurring: false,
    no_show_reported: false,
    created_at: subDays(new Date(), 1).toISOString(),
    updated_at: subDays(new Date(), 1).toISOString(),
    user: mockUsers[0],
    space: mockSpaces[3]
  },

  // Active reservation (happening now)
  {
    id: 'res-005',
    user_id: 'user-001',
    space_id: 'space-005',
    start_time: addHours(new Date(), -1).toISOString(), // Started 1 hour ago
    end_time: addHours(new Date(), 1).toISOString(), // Ends in 1 hour
    participant_count: 3,
    title: 'Design Review Session',
    description: 'Review of new UI designs and user experience flows.',
    status: 'confirmed',
    is_recurring: false,
    check_in_time: addHours(new Date(), -0.5).toISOString(), // Checked in 30 min ago
    no_show_reported: false,
    created_at: subDays(new Date(), 2).toISOString(),
    updated_at: subDays(new Date(), 2).toISOString(),
    user: mockUsers[0],
    space: mockSpaces[4]
  },

  // Past completed reservation
  {
    id: 'res-006',
    user_id: 'user-001',
    space_id: 'space-001',
    start_time: createDateTime(-2, 13, 0), // 2 days ago 1 PM
    end_time: createDateTime(-2, 15, 0), // 2 days ago 3 PM
    participant_count: 6,
    title: 'Project Retrospective',
    description: 'Team retrospective to discuss what went well and areas for improvement.',
    status: 'completed',
    is_recurring: false,
    check_in_time: createDateTime(-2, 12, 55), // Checked in 5 min early
    check_out_time: createDateTime(-2, 15, 5), // Checked out 5 min late
    no_show_reported: false,
    created_at: subDays(new Date(), 5).toISOString(),
    updated_at: createDateTime(-2, 15, 5),
    user: mockUsers[0],
    space: mockSpaces[0]
  },

  // Cancelled reservation
  {
    id: 'res-007',
    user_id: 'user-001',
    space_id: 'space-002',
    start_time: createDateTime(-1, 16, 0), // Yesterday 4 PM
    end_time: createDateTime(-1, 17, 0), // Yesterday 5 PM
    participant_count: 4,
    title: 'Budget Planning Meeting',
    description: 'Q4 budget planning and resource allocation discussion.',
    status: 'cancelled',
    is_recurring: false,
    cancellation_reason: 'Key stakeholder unavailable, rescheduling for next week.',
    no_show_reported: false,
    created_at: subDays(new Date(), 7).toISOString(),
    updated_at: createDateTime(-1, 10, 0), // Cancelled morning of
    user: mockUsers[0],
    space: mockSpaces[1]
  },

  // Monthly recurring training session
  {
    id: 'res-008',
    user_id: 'user-001',
    space_id: 'space-006',
    start_time: createDateTime(15, 10, 0), // 15 days from now 10 AM
    end_time: createDateTime(15, 12, 0), // 15 days from now 12 PM
    participant_count: 15,
    title: 'Monthly Security Training',
    description: 'Mandatory security awareness training for all team members.',
    status: 'confirmed',
    is_recurring: true,
    recurrence_pattern: monthlyPattern,
    no_show_reported: false,
    created_at: subDays(new Date(), 30).toISOString(),
    updated_at: subDays(new Date(), 30).toISOString(),
    user: mockUsers[0],
    space: mockSpaces[5]
  },

  // Rejected reservation
  {
    id: 'res-009',
    user_id: 'user-001',
    space_id: 'space-004',
    start_time: createDateTime(10, 18, 0), // 10 days from now 6 PM
    end_time: createDateTime(10, 22, 0), // 10 days from now 10 PM
    participant_count: 50,
    title: 'Holiday Party Planning',
    description: 'Planning meeting for the annual holiday party.',
    status: 'rejected',
    is_recurring: false,
    approval_comments: 'Space not available for evening events. Please select a different time or venue.',
    approver_id: 'user-003',
    no_show_reported: false,
    created_at: subDays(new Date(), 3).toISOString(),
    updated_at: subDays(new Date(), 1).toISOString(),
    user: mockUsers[0],
    space: mockSpaces[3],
    approver: mockUsers[2]
  },

  // Another user's reservation (for testing multi-user scenarios)
  {
    id: 'res-010',
    user_id: 'user-002',
    space_id: 'space-001',
    start_time: createDateTime(3, 11, 0), // 3 days from now 11 AM
    end_time: createDateTime(3, 12, 0), // 3 days from now 12 PM
    participant_count: 2,
    title: 'One-on-One Meeting',
    description: 'Weekly one-on-one meeting with direct report.',
    status: 'confirmed',
    is_recurring: true,
    recurrence_pattern: {
      type: 'weekly',
      interval: 1,
      days_of_week: [3], // Wednesday
      end_date: addDays(new Date(), 90).toISOString(),
      max_occurrences: 12
    },
    no_show_reported: false,
    created_at: subDays(new Date(), 7).toISOString(),
    updated_at: subDays(new Date(), 7).toISOString(),
    user: mockUsers[1],
    space: mockSpaces[0]
  },

  // Daily recurring booking for hot desk
  {
    id: 'res-011',
    user_id: 'user-001',
    space_id: 'space-007',
    start_time: createDateTime(1, 8, 0), // Tomorrow 8 AM
    end_time: createDateTime(1, 17, 0), // Tomorrow 5 PM
    participant_count: 1,
    title: 'Daily Workstation',
    description: 'Reserved hot desk for daily work.',
    status: 'confirmed',
    is_recurring: true,
    recurrence_pattern: dailyPattern,
    no_show_reported: false,
    created_at: subDays(new Date(), 10).toISOString(),
    updated_at: subDays(new Date(), 10).toISOString(),
    user: mockUsers[0],
    space: mockSpaces[6]
  },

  // Weekend workshop
  {
    id: 'res-012',
    user_id: 'user-001',
    space_id: 'space-008',
    start_time: createDateTime(6, 9, 0), // This Saturday 9 AM
    end_time: createDateTime(6, 17, 0), // This Saturday 5 PM
    participant_count: 20,
    title: 'Innovation Workshop',
    description: 'Full-day workshop on innovation methodologies and creative problem solving.',
    status: 'confirmed',
    is_recurring: false,
    no_show_reported: false,
    created_at: subDays(new Date(), 14).toISOString(),
    updated_at: subDays(new Date(), 14).toISOString(),
    user: mockUsers[0],
    space: mockSpaces[7]
  }
];

// Filter reservations by user ID
export const getReservationsByUserId = (userId: string): Reservation[] => {
  return mockReservations.filter(reservation => reservation.user_id === userId);
};

// Get upcoming reservations
export const getUpcomingReservations = (userId?: string): Reservation[] => {
  const now = new Date();
  let reservations = mockReservations;
  
  if (userId) {
    reservations = getReservationsByUserId(userId);
  }
  
  return reservations.filter(reservation => 
    new Date(reservation.start_time) > now && 
    reservation.status === 'confirmed'
  );
};

// Get active reservations
export const getActiveReservations = (userId?: string): Reservation[] => {
  const now = new Date();
  let reservations = mockReservations;
  
  if (userId) {
    reservations = getReservationsByUserId(userId);
  }
  
  return reservations.filter(reservation => {
    const start = new Date(reservation.start_time);
    const end = new Date(reservation.end_time);
    return start <= now && end > now && reservation.status === 'confirmed';
  });
};

// Get past reservations
export const getPastReservations = (userId?: string): Reservation[] => {
  const now = new Date();
  let reservations = mockReservations;
  
  if (userId) {
    reservations = getReservationsByUserId(userId);
  }
  
  return reservations.filter(reservation => 
    new Date(reservation.end_time) < now
  );
};

// Get reservations by status
export const getReservationsByStatus = (status: string, userId?: string): Reservation[] => {
  let reservations = mockReservations;
  
  if (userId) {
    reservations = getReservationsByUserId(userId);
  }
  
  return reservations.filter(reservation => reservation.status === status);
};

// Get space reservations for a date range
export const getSpaceReservations = (
  spaceId: string, 
  startDate: string, 
  endDate: string
): Reservation[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return mockReservations.filter(reservation => {
    const reservationStart = new Date(reservation.start_time);
    const reservationEnd = new Date(reservation.end_time);
    
    return reservation.space_id === spaceId &&
           reservationStart <= end &&
           reservationEnd >= start;
  });
};

// Generate availability mock data
export const generateMockAvailability = (spaceId: string, startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const availability = [];
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayReservations = getSpaceReservations(spaceId, dateStr, dateStr);
    
    // Generate time slots (8 AM to 8 PM, 1-hour slots)
    const availableSlots = [];
    const unavailableSlots = [];
    
    for (let hour = 8; hour < 20; hour++) {
      const slotStart = `${dateStr}T${hour.toString().padStart(2, '0')}:00:00`;
      const slotEnd = `${dateStr}T${(hour + 1).toString().padStart(2, '0')}:00:00`;
      
      const hasConflict = dayReservations.some(reservation => {
        const resStart = new Date(reservation.start_time);
        const resEnd = new Date(reservation.end_time);
        const slotStartTime = new Date(slotStart);
        const slotEndTime = new Date(slotEnd);
        
        return resStart < slotEndTime && resEnd > slotStartTime;
      });
      
      if (hasConflict) {
        unavailableSlots.push({
          start: slotStart,
          end: slotEnd,
          available: false,
          reservation: dayReservations.find(r => {
            const resStart = new Date(r.start_time);
            const resEnd = new Date(r.end_time);
            const slotStartTime = new Date(slotStart);
            const slotEndTime = new Date(slotEnd);
            return resStart < slotEndTime && resEnd > slotStartTime;
          })
        });
      } else {
        availableSlots.push({
          start: slotStart,
          end: slotEnd,
          available: true
        });
      }
    }
    
    availability.push({
      date: dateStr,
      available_slots: availableSlots,
      unavailable_slots: unavailableSlots
    });
  }
  
  return availability;
};

export default mockReservations;