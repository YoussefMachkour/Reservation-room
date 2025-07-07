import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Clock, 
  Calendar,
  Star,
  Wifi,
  Monitor,
  Coffee,
  Car,
  Share2,
  Heart,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Button } from '../../components/ui/button/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { BookingModal } from '../../components/booking/BookingModal';
import { QuickBookingCard } from '../../components/booking/card/QuickBookingCard';
import { BookingCalendar } from '../../components/booking/calendar/BookingCalendar';
import { useAuth } from '../../contexts/AuthContext';
import { BookingService } from '../../services/booking/bookingService';
import { SpaceService } from '../../services/spaces/spaceService';
import { getSpaceTypeLabel, getSpaceStatusLabel, getSpaceStatusColor } from '../../utils/bookingHelpers';
import type { Space } from '../../types/space';
import type { Reservation, BookingFormData } from '../../types/booking';

export const SpaceBooking: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [space, setSpace] = useState<Space | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  // UI states
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Load space data
  useEffect(() => {
    if (spaceId) {
      loadSpace();
      loadUpcomingReservations();
    }
  }, [spaceId]);

  // Check if space is favorited
  useEffect(() => {
    if (space) {
      const favorites = JSON.parse(localStorage.getItem('space-favorites') || '[]');
      setIsFavorite(favorites.includes(space.id));
    }
  }, [space]);

  const loadSpace = async () => {
    if (!spaceId) return;

    try {
      setIsLoading(true);
      setError(null);
      const spaceData = await SpaceService.getSpace(spaceId);
      setSpace(spaceData);
    } catch (err: any) {
      setError(err.message || 'Failed to load space');
      console.error('Error loading space:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUpcomingReservations = async () => {
    if (!spaceId) return;

    try {
      const startDate = format(new Date(), 'yyyy-MM-dd');
      const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      const reservationsData = await BookingService.getSpaceReservations(spaceId, startDate, endDate);
      setReservations(reservationsData);
    } catch (err) {
      console.error('Error loading reservations:', err);
    }
  };

  const handleQuickBooking = async (data: {
    start_time: string;
    end_time: string;
    participant_count: number;
  }) => {
    if (!space || !user) return;

    try {
      setBookingLoading(true);
      setBookingError(null);

      const reservationData = {
        space_id: space.id,
        start_time: data.start_time,
        end_time: data.end_time,
        participant_count: data.participant_count,
        title: `${space.name} Booking`,
        description: `Quick booking for ${space.name}`
      };

      await BookingService.createReservation(reservationData);
      setBookingSuccess(true);
      await loadUpcomingReservations();
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setBookingSuccess(false), 3000);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAdvancedBooking = async (data: BookingFormData) => {
    if (!space) return;

    try {
      setBookingLoading(true);
      setBookingError(null);

      const reservationData = {
        space_id: space.id,
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
      setBookingSuccess(true);
      await loadUpcomingReservations();
      
      setTimeout(() => setBookingSuccess(false), 3000);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const toggleFavorite = () => {
    if (!space) return;
    
    const favorites = JSON.parse(localStorage.getItem('space-favorites') || '[]');
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter((id: string) => id !== space.id);
    } else {
      newFavorites = [...favorites, space.id];
    }
    
    localStorage.setItem('space-favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    if (!space) return;
    
    const shareData = {
      title: space.name,
      text: `Check out ${space.name} - ${space.description}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const getEquipmentIcon = (equipmentName: string) => {
    const name = equipmentName.toLowerCase();
    if (name.includes('wifi') || name.includes('internet')) return <Wifi className="w-4 h-4" />;
    if (name.includes('monitor') || name.includes('screen') || name.includes('display')) return <Monitor className="w-4 h-4" />;
    if (name.includes('coffee') || name.includes('kitchen')) return <Coffee className="w-4 h-4" />;
    if (name.includes('parking')) return <Car className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Space not found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The requested space could not be found.
        </p>
        <Button onClick={() => navigate('/spaces')}>
          Back to Spaces
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {space.name}
            </h1>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              space.status === 'available' 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {getSpaceStatusLabel(space.status)}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {getSpaceTypeLabel(space.type)} • {space.building} - Floor {space.floor} - Room {space.room_number}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFavorite}
            className={isFavorite ? 'text-red-500' : ''}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      
      {bookingSuccess && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-green-800 dark:text-green-200 font-medium">
              Booking created successfully!
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="relative">
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
              {space.photos && space.photos.length > 0 ? (
                <img
                  src={space.photos[currentImageIndex]}
                  alt={space.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
            
            {space.photos && space.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-2">
                  {space.photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Space Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Space Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Capacity</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {space.capacity} people
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Size</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {space.surface} m²
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Max Duration</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {space.max_booking_duration ? `${space.max_booking_duration / 60}h` : 'No limit'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {showFullDescription || space.description.length <= 200
                  ? space.description
                  : `${space.description.substring(0, 200)}...`}
              </p>
              {space.description.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-blue-600 dark:text-blue-400 text-sm mt-2 hover:underline"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>

          {/* Equipment & Amenities */}
          {space.equipment && space.equipment.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Equipment & Amenities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {space.equipment.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {getEquipmentIcon(item.name)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.name}
                        {item.quantity > 1 && ` (${item.quantity})`}
                      </p>
                      {item.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${space.price_per_hour}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">per hour</p>
              </div>
              <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${space.price_per_day}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">per day</p>
              </div>
              <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${space.price_per_month}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">per month</p>
              </div>
            </div>
          </div>

          {/* Booking Rules */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Booking Information
            </h2>
            <div className="space-y-3">
              {space.requires_approval && (
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-600 dark:text-gray-400">
                    This space requires manager approval before your booking is confirmed.
                  </p>
                </div>
              )}
              
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-600 dark:text-gray-400">
                  Book at least {space.booking_advance_time} minutes in advance.
                </p>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-600 dark:text-gray-400">
                  Free cancellation up to 30 minutes before your booking starts.
                </p>
              </div>
            </div>
          </div>

          {/* Availability Calendar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Availability
            </h2>
            <BookingCalendar
              reservations={reservations}
              loading={false}
              compact={true}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <QuickBookingCard
            space={space}
            onBookNow={handleQuickBooking}
            onOpenFullForm={() => setIsBookingModalOpen(true)}
            isLoading={bookingLoading}
          />
        </div>
      </div>

      {/* Advanced Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        space={space}
        onSubmit={handleAdvancedBooking}
        isLoading={bookingLoading}
      />
    </div>
  );
};