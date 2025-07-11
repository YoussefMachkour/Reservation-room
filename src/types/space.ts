// types/space.ts
export interface Equipment {
  name: string;
  quantity: number;
  description?: string;
}

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  capacity: number;
  building: string;
  floor: number;
  room_number: string;
  equipment: Equipment[];
  status: SpaceStatus;
  description: string;
  surface: number;
  photos: string[];
  price_per_hour: number;
  price_per_day: number;
  price_per_month: number;
  manager_id?: string;
  requires_approval: boolean;
  booking_advance_time: number;
  max_booking_duration: number;
  created_at: string;
  updated_at: string;
}

export type SpaceType = 
  | 'meeting_room'
  | 'office'
  | 'auditorium'
  | 'open_space'
  | 'hot_desk'
  | 'conference_room';

export type SpaceStatus = 
  | 'available'
  | 'maintenance'
  | 'out_of_service'
  | 'reserved';

export interface SpaceFilters {
  type?: SpaceType;
  building?: string;
  capacity?: number;
  priceRange?: [number, number];
  equipment?: string[];
  status?: SpaceStatus;
}