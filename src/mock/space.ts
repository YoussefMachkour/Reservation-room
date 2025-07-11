// mockData/spaces.ts
import { Space } from '../types/space';

export const mockSpaces: Space[] = [
  {
    id: '1',
    name: 'Executive Conference Room',
    type: 'conference_room',
    capacity: 12,
    building: 'Main Building',
    floor: 3,
    room_number: '301',
    equipment: [
      { name: 'Projector', quantity: 1, description: '4K Ultra HD' },
      { name: 'Whiteboard', quantity: 2 },
      { name: 'Conference Phone', quantity: 1 },
      { name: 'Flipchart', quantity: 1 }
    ],
    status: 'available',
    description: 'Premium conference room with state-of-the-art AV equipment, perfect for executive meetings and presentations.',
    surface: 45.5,
    photos: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800'
    ],
    price_per_hour: 50,
    price_per_day: 300,
    price_per_month: 6000,
    requires_approval: true,
    booking_advance_time: 60,
    max_booking_duration: 480,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Creative Studio',
    type: 'open_space',
    capacity: 8,
    building: 'Creative Hub',
    floor: 2,
    room_number: '205',
    equipment: [
      { name: 'Standing Desks', quantity: 4 },
      { name: 'Monitors', quantity: 8, description: '27-inch 4K' },
      { name: 'Drawing Tablets', quantity: 4 },
      { name: 'Printer', quantity: 1, description: 'Color A3' }
    ],
    status: 'available',
    description: 'Modern creative workspace with flexible seating and professional design tools.',
    surface: 60.0,
    photos: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800'
    ],
    price_per_hour: 35,
    price_per_day: 200,
    price_per_month: 4000,
    requires_approval: false,
    booking_advance_time: 30,
    max_booking_duration: 600,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '3',
    name: 'Hot Desk Area A',
    type: 'hot_desk',
    capacity: 1,
    building: 'Main Building',
    floor: 1,
    room_number: '105',
    equipment: [
      { name: 'Desk', quantity: 1 },
      { name: 'Monitor', quantity: 1, description: '24-inch Full HD' },
      { name: 'Ergonomic Chair', quantity: 1 }
    ],
    status: 'available',
    description: 'Flexible hot desk with monitor and ergonomic seating in a vibrant co-working area.',
    surface: 4.0,
    photos: [
      'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800'
    ],
    price_per_hour: 15,
    price_per_day: 80,
    price_per_month: 1200,
    requires_approval: false,
    booking_advance_time: 15,
    max_booking_duration: 480,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '4',
    name: 'Innovation Lab',
    type: 'meeting_room',
    capacity: 6,
    building: 'Tech Center',
    floor: 1,
    room_number: '110',
    equipment: [
      { name: 'Interactive Whiteboard', quantity: 1 },
      { name: 'VR Headsets', quantity: 4 },
      { name: '3D Printer', quantity: 1 },
      { name: 'Laptop Stations', quantity: 6 }
    ],
    status: 'available',
    description: 'High-tech meeting room equipped with the latest technology for innovation sessions.',
    surface: 35.0,
    photos: [
      'https://images.unsplash.com/photo-1497366672149-e5e4b4d34eb3?w=800'
    ],
    price_per_hour: 40,
    price_per_day: 250,
    price_per_month: 5000,
    requires_approval: false,
    booking_advance_time: 30,
    max_booking_duration: 360,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '5',
    name: 'Grand Auditorium',
    type: 'auditorium',
    capacity: 150,
    building: 'Main Building',
    floor: 0,
    room_number: 'A001',
    equipment: [
      { name: 'Professional Sound System', quantity: 1 },
      { name: 'Stage Lighting', quantity: 1 },
      { name: 'Microphones', quantity: 6 },
      { name: 'Large Screen', quantity: 1, description: '100-inch 4K' }
    ],
    status: 'maintenance',
    description: 'Large auditorium perfect for conferences, presentations, and events.',
    surface: 200.0,
    photos: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ],
    price_per_hour: 150,
    price_per_day: 1000,
    price_per_month: 20000,
    requires_approval: true,
    booking_advance_time: 120,
    max_booking_duration: 720,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '6',
    name: 'Quiet Office Suite',
    type: 'office',
    capacity: 4,
    building: 'Business Center',
    floor: 2,
    room_number: '210',
    equipment: [
      { name: 'Desks', quantity: 4 },
      { name: 'Office Chairs', quantity: 4 },
      { name: 'Filing Cabinet', quantity: 2 },
      { name: 'Phone System', quantity: 1 }
    ],
    status: 'available',
    description: 'Private office suite ideal for focused work and client meetings.',
    surface: 25.0,
    photos: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800'
    ],
    price_per_hour: 30,
    price_per_day: 180,
    price_per_month: 3600,
    requires_approval: false,
    booking_advance_time: 30,
    max_booking_duration: 480,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }
];

export const mockBuildings = [
  'Main Building',
  'Creative Hub',
  'Tech Center',
  'Business Center'
];