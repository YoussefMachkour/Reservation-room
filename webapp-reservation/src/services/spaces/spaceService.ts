import { apiClient } from "../api/apiClient";
import type { Space, SpaceFilters } from "../../types/space";

// Updated mock data to match backend DTO structure
const mockSpaces: Space[] = [
  {
    id: "space-001",
    name: "Conference Room Alpha",
    type: "meeting_room",
    capacity: 12,
    building: "Building A",
    floor: 2,
    room_number: "201",
    equipment: [
      { name: "Projector", quantity: 1, description: "4K projector" },
      { name: "Whiteboard", quantity: 2 },
      { name: "Video Conference", quantity: 1, description: "Zoom setup" },
    ],
    status: "available",
    description:
      "Large conference room with modern AV equipment perfect for team meetings and presentations.",
    surface: 45.5,
    photos: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600",
    ],
    price_per_hour: 50,
    price_per_day: 350,
    price_per_month: 8000,
    manager_id: "user-002",
    requires_approval: false,
    booking_advance_time: 30,
    max_booking_duration: 480,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "space-002",
    name: "Meeting Room Beta",
    type: "meeting_room",
    capacity: 6,
    building: "Building A",
    floor: 1,
    room_number: "105",
    equipment: [
      { name: "TV Display", quantity: 1, description: '55" smart TV' },
      { name: "Whiteboard", quantity: 1 },
    ],
    status: "available",
    description:
      "Cozy meeting room perfect for small team discussions and one-on-ones.",
    surface: 25.0,
    photos: [
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600",
    ],
    price_per_hour: 30,
    price_per_day: 200,
    price_per_month: 4500,
    requires_approval: false,
    booking_advance_time: 15,
    max_booking_duration: 240,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "space-003",
    name: "Auditorium Main",
    type: "auditorium",
    capacity: 100,
    building: "Building B",
    floor: 1,
    room_number: "AUD-01",
    equipment: [
      {
        name: "Sound System",
        quantity: 1,
        description: "Professional audio system",
      },
      { name: "Stage Lighting", quantity: 1 },
      { name: "Microphones", quantity: 4, description: "Wireless microphones" },
      { name: "Projector", quantity: 2, description: "4K projectors" },
    ],
    status: "available",
    description:
      "Large auditorium perfect for presentations, seminars, and company events.",
    surface: 200.0,
    photos: [
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=600",
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&h=600",
    ],
    price_per_hour: 150,
    price_per_day: 1000,
    price_per_month: 20000,
    requires_approval: true,
    booking_advance_time: 60,
    max_booking_duration: 600,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "space-004",
    name: "Hot Desk Station 1",
    type: "hot_desk",
    capacity: 1,
    building: "Building A",
    floor: 3,
    room_number: "301-A",
    equipment: [
      { name: "Monitor", quantity: 2, description: '27" dual monitors' },
      { name: "Desk Lamp", quantity: 1 },
      { name: "Ergonomic Chair", quantity: 1 },
    ],
    status: "available",
    description:
      "Modern hot desk with dual monitors in an open workspace environment.",
    surface: 6.0,
    photos: [
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600",
    ],
    price_per_hour: 15,
    price_per_day: 80,
    price_per_month: 1500,
    requires_approval: false,
    booking_advance_time: 0,
    max_booking_duration: 480,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "space-005",
    name: "Private Office Suite",
    type: "office",
    capacity: 4,
    building: "Building C",
    floor: 2,
    room_number: "205",
    equipment: [
      { name: "Desk", quantity: 4 },
      { name: "Office Chair", quantity: 4 },
      { name: "Filing Cabinet", quantity: 2 },
      { name: "Phone System", quantity: 1 },
    ],
    status: "available",
    description:
      "Private office suite with multiple workstations, perfect for small teams needing dedicated space.",
    surface: 80.0,
    photos: [
      "https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800&h=600",
    ],
    price_per_hour: 75,
    price_per_day: 500,
    price_per_month: 12000,
    requires_approval: true,
    booking_advance_time: 120,
    max_booking_duration: 960,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "space-006",
    name: "Open Workspace Area",
    type: "open_space",
    capacity: 20,
    building: "Building A",
    floor: 3,
    room_number: "300",
    equipment: [
      { name: "Standing Desks", quantity: 10 },
      { name: "Whiteboards", quantity: 3 },
      { name: "Coffee Station", quantity: 1 },
    ],
    status: "available",
    description:
      "Large open workspace perfect for collaborative work and team activities.",
    surface: 150.0,
    photos: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600",
    ],
    price_per_hour: 100,
    price_per_day: 600,
    price_per_month: 15000,
    requires_approval: false,
    booking_advance_time: 60,
    max_booking_duration: 480,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "space-007",
    name: "Executive Conference Room",
    type: "conference_room",
    capacity: 16,
    building: "Building B",
    floor: 5,
    room_number: "501",
    equipment: [
      {
        name: "Conference Table",
        quantity: 1,
        description: "Large mahogany table",
      },
      { name: "Executive Chairs", quantity: 16 },
      {
        name: "Video Conference System",
        quantity: 1,
        description: "High-end system",
      },
      { name: "Smart Board", quantity: 1 },
    ],
    status: "maintenance",
    description:
      "Premium executive conference room with high-end furnishings and technology.",
    surface: 60.0,
    photos: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600",
    ],
    price_per_hour: 200,
    price_per_day: 1200,
    price_per_month: 25000,
    requires_approval: true,
    booking_advance_time: 240,
    max_booking_duration: 480,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

export class SpaceService {
  // Get all spaces - Updated return type
  static async getSpaces(
    filters?: SpaceFilters
  ): Promise<{ success: boolean; data?: Space[]; message?: string }> {
    try {
      // For development, use mock data
      if (process.env.NODE_ENV === "development") {
        let spaces = [...mockSpaces];

        // Apply filters if provided
        if (filters) {
          spaces = this.applyFilters(spaces, filters);
        }

        return { success: true, data: spaces };
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.type) params.append("type", filters.type);
      if (filters?.building) params.append("building", filters.building);
      if (filters?.capacity)
        params.append("capacity", filters.capacity.toString());
      if (filters?.status) params.append("status", filters.status);
      if (filters?.priceRange) {
        params.append("min_price", filters.priceRange[0].toString());
        params.append("max_price", filters.priceRange[1].toString());
      }
      if (filters?.equipment) {
        filters.equipment.forEach((eq) => params.append("equipment", eq));
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/spaces?${queryString}` : "/spaces";

      const response = await apiClient.get<{ data: Space[] }>(endpoint);

      if (!response.success) {
        return {
          success: false,
          message: response.message || "Failed to fetch spaces",
        };
      }

      return { success: true, data: response.data?.data || [] };
    } catch (error) {
      console.error("Error fetching spaces:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get buildings - Add this method that your component expects
  static async getBuildings(): Promise<{
    success: boolean;
    data?: string[];
    message?: string;
  }> {
    try {
      // For development, extract unique buildings from mock data
      if (process.env.NODE_ENV === "development") {
        const buildings = Array.from(
          new Set(mockSpaces.map((space) => space.building))
        );
        return { success: true, data: buildings };
      }

      const response = await apiClient.get<{ data: string[] }>(
        "/spaces/buildings"
      );

      if (!response.success) {
        return {
          success: false,
          message: response.message || "Failed to fetch buildings",
        };
      }

      return { success: true, data: response.data?.data || [] };
    } catch (error) {
      console.error("Error fetching buildings:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get space by ID - Updated return type
  static async getSpace(
    id: string
  ): Promise<{ success: boolean; data?: Space; message?: string }> {
    try {
      // For development, use mock data
      if (process.env.NODE_ENV === "development") {
        const space = mockSpaces.find((s) => s.id === id);
        if (!space) {
          return { success: false, message: "Space not found" };
        }
        return { success: true, data: space };
      }

      const response = await apiClient.get<{ data: Space }>(`/spaces/${id}`);

      if (!response.success) {
        return {
          success: false,
          message: response.message || "Failed to fetch space",
        };
      }

      if (!response.data?.data) {
        return { success: false, message: "Space not found" };
      }

      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("Error fetching space:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Create new space (admin/manager only)
  static async createSpace(
    data: Omit<Space, "id" | "created_at" | "updated_at">
  ): Promise<Space> {
    try {
      // For development, simulate creation
      if (process.env.NODE_ENV === "development") {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newSpace: Space = {
          ...data,
          id: `space-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return newSpace;
      }

      const response = await apiClient.post<Space>("/spaces", data);

      if (!response.success) {
        throw new Error(response.message || "Failed to create space");
      }

      if (!response.data) {
        throw new Error("No space data returned");
      }

      return response.data;
    } catch (error) {
      console.error("Error creating space:", error);
      throw error;
    }
  }

  // Update space
  static async updateSpace(id: string, data: Partial<Space>): Promise<Space> {
    try {
      // For development, simulate update
      if (process.env.NODE_ENV === "development") {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const existingSpace = mockSpaces.find((s) => s.id === id);
        if (!existingSpace) {
          throw new Error("Space not found");
        }

        const updatedSpace: Space = {
          ...existingSpace,
          ...data,
          updated_at: new Date().toISOString(),
        };

        return updatedSpace;
      }

      const response = await apiClient.put<Space>(`/spaces/${id}`, data);

      if (!response.success) {
        throw new Error(response.message || "Failed to update space");
      }

      if (!response.data) {
        throw new Error("No space data returned");
      }

      return response.data;
    } catch (error) {
      console.error("Error updating space:", error);
      throw error;
    }
  }

  // Delete space
  static async deleteSpace(id: string): Promise<void> {
    try {
      // For development, simulate deletion
      if (process.env.NODE_ENV === "development") {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
      }

      const response = await apiClient.delete(`/spaces/${id}`);

      if (!response.success) {
        throw new Error(response.message || "Failed to delete space");
      }
    } catch (error) {
      console.error("Error deleting space:", error);
      throw error;
    }
  }

  // Search spaces
  static async searchSpaces(
    query: string,
    filters?: SpaceFilters
  ): Promise<Space[]> {
    try {
      // For development, simulate search
      if (process.env.NODE_ENV === "development") {
        let spaces = [...mockSpaces];

        // Apply text search
        if (query.trim()) {
          const searchTerm = query.toLowerCase();
          spaces = spaces.filter((space) => {
            // Basic text search
            const matchesBasic =
              space.name.toLowerCase().includes(searchTerm) ||
              space.description.toLowerCase().includes(searchTerm) ||
              space.building.toLowerCase().includes(searchTerm) ||
              space.type.toLowerCase().includes(searchTerm);

            // Equipment search - equipment is always Equipment[] or null
            const matchesEquipment = space.equipment
              ? space.equipment.some((eq) =>
                  eq.name.toLowerCase().includes(searchTerm)
                )
              : false;

            return matchesBasic || matchesEquipment;
          });
        }

        // Apply additional filters
        if (filters) {
          spaces = this.applyFilters(spaces, filters);
        }

        return spaces;
      }

      const params = new URLSearchParams({ q: query });
      if (filters?.type) params.append("type", filters.type);
      if (filters?.building) params.append("building", filters.building);
      if (filters?.capacity)
        params.append("capacity", filters.capacity.toString());
      if (filters?.status) params.append("status", filters.status);

      const response = await apiClient.get<Space[]>(
        `/spaces/search?${params.toString()}`
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to search spaces");
      }

      return response.data || [];
    } catch (error) {
      console.error("Error searching spaces:", error);
      throw error;
    }
  }

  // Get available spaces for a time period
  static async getAvailableSpaces(
    startTime: string,
    endTime: string,
    capacity?: number
  ): Promise<Space[]> {
    try {
      // For development, return all available spaces
      if (process.env.NODE_ENV === "development") {
        let spaces = mockSpaces.filter((s) => s.status === "available");

        if (capacity) {
          spaces = spaces.filter((s) => s.capacity >= capacity);
        }

        return spaces;
      }

      const params = new URLSearchParams({
        start_time: startTime,
        end_time: endTime,
      });

      if (capacity) {
        params.append("capacity", capacity.toString());
      }

      const response = await apiClient.get<Space[]>(
        `/spaces/available?${params.toString()}`
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch available spaces");
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching available spaces:", error);
      throw error;
    }
  }

  // Get spaces by building
  static async getSpacesByBuilding(building: string): Promise<Space[]> {
    try {
      const filters: SpaceFilters = { building };
      const result = await this.getSpaces(filters);
      return result.data || [];
    } catch (error) {
      console.error("Error fetching spaces by building:", error);
      throw error;
    }
  }

  // Get spaces by type
  static async getSpacesByType(type: string): Promise<Space[]> {
    try {
      const filters: SpaceFilters = { type };
      const result = await this.getSpaces(filters);
      return result.data || [];
    } catch (error) {
      console.error("Error fetching spaces by type:", error);
      throw error;
    }
  }

  // Get space statistics
  static async getSpaceStats(): Promise<{
    total: number;
    available: number;
    maintenance: number;
    out_of_service: number;
    reserved: number;
    by_type: Record<string, number>;
    by_building: Record<string, number>;
  }> {
    try {
      // For development, calculate from mock data
      if (process.env.NODE_ENV === "development") {
        const stats = {
          total: mockSpaces.length,
          available: mockSpaces.filter((s) => s.status === "available").length,
          maintenance: mockSpaces.filter((s) => s.status === "maintenance")
            .length,
          out_of_service: mockSpaces.filter(
            (s) => s.status === "out_of_service"
          ).length,
          reserved: mockSpaces.filter((s) => s.status === "reserved").length,
          by_type: {} as Record<string, number>,
          by_building: {} as Record<string, number>,
        };

        // Calculate by type
        mockSpaces.forEach((space) => {
          stats.by_type[space.type] = (stats.by_type[space.type] || 0) + 1;
        });

        // Calculate by building
        mockSpaces.forEach((space) => {
          stats.by_building[space.building] =
            (stats.by_building[space.building] || 0) + 1;
        });

        return stats;
      }

      const response = await apiClient.get<any>("/spaces/stats");

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch space statistics");
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching space statistics:", error);
      throw error;
    }
  }

  // Helper method to apply filters (used in development mode)
  private static applyFilters(spaces: Space[], filters: SpaceFilters): Space[] {
    let filtered = [...spaces];

    if (filters.type) {
      filtered = filtered.filter((s) => s.type === filters.type);
    }

    if (filters.building) {
      filtered = filtered.filter((s) =>
        s.building.toLowerCase().includes(filters.building!.toLowerCase())
      );
    }

    if (filters.capacity) {
      filtered = filtered.filter((s) => s.capacity >= filters.capacity!);
    }

    if (filters.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      filtered = filtered.filter(
        (s) => s.price_per_hour >= min && s.price_per_hour <= max
      );
    }

    if (filters.equipment && filters.equipment.length > 0) {
      filtered = filtered.filter(
        (s) =>
          s.equipment &&
          s.equipment.some((spaceEq) =>
            filters.equipment!.some((filterEq) =>
              spaceEq.name.toLowerCase().includes(filterEq.toLowerCase())
            )
          )
      );
    }

    return filtered;
  }
}

// Create a default export that matches your component's import
export const spaceService = SpaceService;

// Helper functions for working with spaces
export const getSpaceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    meeting_room: "Meeting Room",
    office: "Office",
    auditorium: "Auditorium",
    open_space: "Open Space",
    hot_desk: "Hot Desk",
    conference_room: "Conference Room",
  };
  return labels[type] || type;
};

export const getSpaceStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    available: "Available",
    maintenance: "Under Maintenance",
    out_of_service: "Out of Service",
    reserved: "Reserved",
  };
  return labels[status] || status;
};

export const getSpaceStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    available: "text-green-600 dark:text-green-400",
    maintenance: "text-yellow-600 dark:text-yellow-400",
    out_of_service: "text-red-600 dark:text-red-400",
    reserved: "text-blue-600 dark:text-blue-400",
  };
  return colors[status] || "text-gray-600 dark:text-gray-400";
};

export const isSpaceAvailable = (space: Space): boolean => {
  return space.status === "available";
};

export const canBookSpace = (space: Space): boolean => {
  if (!isSpaceAvailable(space)) return false;

  // If space requires approval and user is not admin/manager, they can still book but it will be pending
  return true;
};

export const getSpaceCapacityLabel = (capacity: number): string => {
  if (capacity === 1) return "1 person";
  if (capacity <= 10) return `${capacity} people`;
  if (capacity <= 50) return `${capacity} people (medium)`;
  return `${capacity} people (large)`;
};

export default SpaceService;
