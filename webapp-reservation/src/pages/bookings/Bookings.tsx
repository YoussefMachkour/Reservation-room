import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Filter, Plus, Search, Grid3X3, List, Download, RefreshCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { Button } from '../../components/ui/button/Button';
import { Input } from '../../components/ui/input/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { ReservationCard } from '../../components/booking/card/BookingCard';
import { BookingModal } from '../../components/booking/BookingModal';
import { BookingCalendar } from '../../components/booking/calendar/BookingCalendar';
import { useAuth } from '../../contexts/AuthContext';
import { BookingService } from '../../services/booking/bookingService';
import { SpaceService } from '../../services/spaces/spaceService';
import { formatReservationStatus } from '../../utils/bookingHelpers';
import type { Reservation, ReservationStatus, BookingFormData } from '../../types/booking';
import type { Space } from '../../types/space';

type ViewMode = 'all' | 'upcoming' | 'past' | 'active';
type StatusFilter = 'all' | ReservationStatus;
type DisplayMode = 'list' | 'grid' | 'calendar';

export const Bookings: React.FC = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Display and filter states
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedSpaceFilter, setSelectedSpaceFilter] = useState<string>('all');
  
  // Modal states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    past: 0,
    active: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0
  });

  // Load initial data
  useEffect(() => {
    loadReservations();
    loadSpaces();
  }, []);

  // Filter reservations when filters change
  useEffect(() => {
    filterReservations();
    calculateStats();
  }, [reservations, viewMode, statusFilter, searchQuery, selectedMonth, selectedSpaceFilter]);

  const loadReservations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await BookingService.getMyReservations();
      setReservations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reservations');
      console.error('Error loading reservations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpaces = async () => {
    try {
      const data = await SpaceService.getSpaces();
      setSpaces(data);
    } catch (err) {
      console.error('Error loading spaces:', err);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    
    const newStats = {
      total: reservations.length,
      upcoming: reservations.filter(r => new Date(r.start_time) > now && r.status === 'confirmed').length,
      past: reservations.filter(r => new Date(r.end_time) < now).length,
      active: reservations.filter(r => {
        const start = new Date(r.start_time);
        const end = new Date(r.end_time);
        return start <= now && end > now && r.status === 'confirmed';
      }).length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      pending: reservations.filter(r => r.status === 'pending').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length
    };
    
    setStats(newStats);
  };

  const filterReservations = () => {
    let filtered = [...reservations];
    const now = new Date();
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    // Apply view mode filter
    switch (viewMode) {
      case 'upcoming':
        filtered = filtered.filter(r => new Date(r.start_time) > now && r.status === 'confirmed');
        break;
      case 'past':
        filtered = filtered.filter(r => new Date(r.end_time) < now);
        break;
      case 'active':
        filtered = filtered.filter(r => {
          const start = new Date(r.start_time);
          const end = new Date(r.end_time);
          return start <= now && end > now && r.status === 'confirmed';
        });
        break;
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Apply space filter
    if (selectedSpaceFilter !== 'all') {
      filtered = filtered.filter(r => r.space_id === selectedSpaceFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.space?.name.toLowerCase().includes(query) ||
        r.space?.building.toLowerCase().includes(query)
      );
    }

    // Apply month filter for calendar view or when month filter is active
    if (displayMode === 'calendar' || viewMode === 'all') {
      filtered = filtered.filter(r => {
        const startTime = new Date(r.start_time);
        return startTime >= monthStart && startTime <= monthEnd;
      });
    }

    setFilteredReservations(filtered);
  };

  const handleCreateBooking = async (data: BookingFormData) => {
    if (!selectedSpace) return;

    try {
      setBookingLoading(true);
      setBookingError(null);

      const reservationData = {
        space_id: selectedSpace.id,
        start_time: `${data.start_date}T${data.start_time}`,
        end_time: `${data.end_date}T${data.end_time}`,
        participant_count: data.participant_count,
        title: data.title,
        description: data.description,
        is_recurring: data.is_recurring,
        recurrence_pattern: data.recurrence_pattern
      };

      await BookingService.createReservation(reservationData);
      setIsBookingModalOpen(false);
      setSelectedSpace(null);
      await loadReservations();
      
      // Show success message (you can add a toast notification here)
      console.log('Booking created successfully');
    } catch (err: any) {
      setBookingError(err.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleEditReservation = async (data: BookingFormData) => {
    if (!editingReservation) return;

    try {
      setBookingLoading(true);
      setBookingError(null);

      const updateData = {
        start_time: `${data.start_date}T${data.start_time}`,
        end_time: `${data.end_date}T${data.end_time}`,
        participant_count: data.participant_count,
        title: data.title,
        description: data.description
      };

      await BookingService.updateReservation(editingReservation.id, updateData);
      setIsBookingModalOpen(false);
      setEditingReservation(null);
      await loadReservations();
      
      console.log('Booking updated successfully');
    } catch (err: any) {
      setBookingError(err.message || 'Failed to update booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelReservation = async (reservation: Reservation) => {
    const confirmed = window.confirm('Are you sure you want to cancel this reservation?');
    if (!confirmed) return;

    const reason = prompt('Please provide a reason for cancellation (optional):');
    
    try {
      await BookingService.cancelReservation(reservation.id, reason || undefined);
      await loadReservations();
      console.log('Reservation cancelled successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation');
    }
  };

  const handleCheckIn = async (reservation: Reservation) => {
    try {
      await BookingService.checkIn(reservation.id);
      await loadReservations();
      console.log('Checked in successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async (reservation: Reservation) => {
    try {
      await BookingService.checkOut(reservation.id);
      await loadReservations();
      console.log('Checked out successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to check out');
    }
  };

  const openNewBookingModal = () => {
    // For now, we'll use the first available space
    // In a real app, you might want to show a space selector first
    if (spaces.length > 0) {
      setSelectedSpace(spaces[0]);
      setEditingReservation(null);
      setIsBookingModalOpen(true);
      setBookingError(null);
    } else {
      setError('No spaces available for booking');
    }
  };

  const openEditModal = (reservation: Reservation) => {
    if (reservation.space) {
      setSelectedSpace(reservation.space);
      setEditingReservation(reservation);
      setIsBookingModalOpen(true);
      setBookingError(null);
    } else {
      setError('Space information not available for this reservation');
    }
  };

  const closeModal = () => {
    setIsBookingModalOpen(false);
    setSelectedSpace(null);
    setEditingReservation(null);
    setBookingError(null);
  };

  const handleRefresh = () => {
    loadReservations();
    loadSpaces();
  };

  const handleExport = () => {
    // Basic CSV export functionality
    const csvData = filteredReservations.map(r => ({
      Title: r.title,
      Space: r.space?.name || 'Unknown',
      'Start Time': r.start_time,
      'End Time': r.end_time,
      Status: r.status,
      Participants: r.participant_count
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Title,Space,Start Time,End Time,Status,Participants\n"
      + csvData.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Bookings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your space reservations and bookings
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={filteredReservations.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={openNewBookingModal}>
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Bookings
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.active}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Active Now
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.upcoming}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Upcoming
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {stats.past}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Past
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.confirmed}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Confirmed
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.pending}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Pending
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.cancelled}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Cancelled
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="space-y-4">
          {/* View Mode Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'active', label: 'Active', count: stats.active },
              { key: 'upcoming', label: 'Upcoming', count: stats.upcoming },
              { key: 'past', label: 'Past', count: stats.past }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as ViewMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Display Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                View:
              </span>
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
                <button
                  onClick={() => setDisplayMode('list')}
                  className={`px-3 py-1 text-sm rounded-l-lg ${
                    displayMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDisplayMode('grid')}
                  className={`px-3 py-1 text-sm ${
                    displayMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDisplayMode('calendar')}
                  className={`px-3 py-1 text-sm rounded-r-lg ${
                    displayMode === 'calendar'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Month Navigation (for calendar view) */}
            {displayMode === 'calendar' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ←
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0 flex-1 text-center">
                  {format(selectedMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  →
                </button>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={selectedSpaceFilter}
              onChange={(e) => setSelectedSpaceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Spaces</option>
              {spaces.map(space => (
                <option key={space.id} value={space.id}>
                  {space.name} - {space.building}
                </option>
              ))}
            </select>

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              {filteredReservations.length} result{filteredReservations.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {displayMode === 'calendar' ? (
          <BookingCalendar
            reservations={filteredReservations}
            onReservationClick={openEditModal}
            loading={isLoading}
          />
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || statusFilter !== 'all' || selectedSpaceFilter !== 'all' || viewMode !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'You haven\'t made any bookings yet.'}
            </p>
            {(!searchQuery && statusFilter === 'all' && selectedSpaceFilter === 'all' && viewMode === 'all') && (
              <Button onClick={openNewBookingModal}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Booking
              </Button>
            )}
          </div>
        ) : (
          <div className={displayMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredReservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                showSpaceInfo={true}
                onEdit={openEditModal}
                onCancel={handleCancelReservation}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                compact={displayMode === 'grid'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedSpace && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={closeModal}
          space={selectedSpace}
          onSubmit={editingReservation ? handleEditReservation : handleCreateBooking}
          isLoading={bookingLoading}
          initialData={editingReservation ? {
            title: editingReservation.title,
            description: editingReservation.description,
            start_date: format(new Date(editingReservation.start_time), 'yyyy-MM-dd'),
            start_time: format(new Date(editingReservation.start_time), 'HH:mm'),
            end_date: format(new Date(editingReservation.end_time), 'yyyy-MM-dd'),
            end_time: format(new Date(editingReservation.end_time), 'HH:mm'),
            participant_count: editingReservation.participant_count,
            is_recurring: editingReservation.is_recurring,
            recurrence_pattern: editingReservation.recurrence_pattern
          } : undefined}
        />
      )}
    </div>
  );
};