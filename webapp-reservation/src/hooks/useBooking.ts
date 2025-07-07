import { useState, useEffect, useCallback } from 'react';
import { BookingService } from '../services/booking/bookingService';
import type { Reservation, CreateReservationRequest, UpdateReservationRequest, AvailabilityResponse } from '../types/booking';

interface UseBookingOptions {
  autoLoad?: boolean;
  userId?: string;
}

interface UseBookingReturn {
  // State
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadReservations: () => Promise<void>;
  createReservation: (data: CreateReservationRequest) => Promise<Reservation>;
  updateReservation: (id: string, data: UpdateReservationRequest) => Promise<Reservation>;
  cancelReservation: (id: string, reason?: string) => Promise<Reservation>;
  deleteReservation: (id: string) => Promise<void>;
  checkIn: (id: string) => Promise<Reservation>;
  checkOut: (id: string) => Promise<Reservation>;
  
  // Utility functions
  refreshReservations: () => Promise<void>;
  clearError: () => void;
}

export const useBooking = (options: UseBookingOptions = {}): UseBookingReturn => {
  const { autoLoad = true, userId } = options;
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data: Reservation[];
      if (userId) {
        data = await BookingService.getUserReservations(userId);
      } else {
        data = await BookingService.getMyReservations();
      }
      
      setReservations(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reservations');
      console.error('Error loading reservations:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createReservation = useCallback(async (data: CreateReservationRequest): Promise<Reservation> => {
    try {
      setError(null);
      const newReservation = await BookingService.createReservation(data);
      
      // Add to local state
      setReservations(prev => [newReservation, ...prev]);
      
      return newReservation;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create reservation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateReservation = useCallback(async (id: string, data: UpdateReservationRequest): Promise<Reservation> => {
    try {
      setError(null);
      const updatedReservation = await BookingService.updateReservation(id, data);
      
      // Update local state
      setReservations(prev => 
        prev.map(r => r.id === id ? updatedReservation : r)
      );
      
      return updatedReservation;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update reservation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const cancelReservation = useCallback(async (id: string, reason?: string): Promise<Reservation> => {
    try {
      setError(null);
      const cancelledReservation = await BookingService.cancelReservation(id, reason);
      
      // Update local state
      setReservations(prev => 
        prev.map(r => r.id === id ? cancelledReservation : r)
      );
      
      return cancelledReservation;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel reservation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteReservation = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await BookingService.deleteReservation(id);
      
      // Remove from local state
      setReservations(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete reservation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const checkIn = useCallback(async (id: string): Promise<Reservation> => {
    try {
      setError(null);
      const updatedReservation = await BookingService.checkIn(id);
      
      // Update local state
      setReservations(prev => 
        prev.map(r => r.id === id ? updatedReservation : r)
      );
      
      return updatedReservation;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to check in';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const checkOut = useCallback(async (id: string): Promise<Reservation> => {
    try {
      setError(null);
      const updatedReservation = await BookingService.checkOut(id);
      
      // Update local state
      setReservations(prev => 
        prev.map(r => r.id === id ? updatedReservation : r)
      );
      
      return updatedReservation;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to check out';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const refreshReservations = useCallback(async () => {
    await loadReservations();
  }, [loadReservations]);

  // Auto-load reservations on mount
  useEffect(() => {
    if (autoLoad) {
      loadReservations();
    }
  }, [autoLoad, loadReservations]);

  return {
    // State
    reservations,
    loading,
    error,
    
    // Actions
    loadReservations,
    createReservation,
    updateReservation,
    cancelReservation,
    deleteReservation,
    checkIn,
    checkOut,
    
    // Utility functions
    refreshReservations,
    clearError
  };
};

// Additional hook for space availability
interface UseAvailabilityOptions {
  spaceId?: string;
  startDate?: string;
  endDate?: string;
  autoLoad?: boolean;
}

interface UseAvailabilityReturn {
  availability: AvailabilityResponse[];
  loading: boolean;
  error: string | null;
  checkAvailability: (spaceId: string, startDate: string, endDate: string) => Promise<void>;
  clearError: () => void;
}

export const useAvailability = (options: UseAvailabilityOptions = {}): UseAvailabilityReturn => {
  const { spaceId, startDate, endDate, autoLoad = false } = options;
  
  const [availability, setAvailability] = useState<AvailabilityResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkAvailability = useCallback(async (
    spaceId: string, 
    startDate: string, 
    endDate: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await BookingService.checkAvailability(spaceId, startDate, endDate);
      setAvailability(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check availability');
      console.error('Error checking availability:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load availability if all params provided
  useEffect(() => {
    if (autoLoad && spaceId && startDate && endDate) {
      checkAvailability(spaceId, startDate, endDate);
    }
  }, [autoLoad, spaceId, startDate, endDate, checkAvailability]);

  return {
    availability,
    loading,
    error,
    checkAvailability,
    clearError
  };
};

export default useBooking;