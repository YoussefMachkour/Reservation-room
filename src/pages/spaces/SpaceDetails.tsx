// pages/SpaceDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Calendar,
  Share2,
  Heart,
  Wifi,
  Car,
  Coffee,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { parseISO, addMinutes, isAfter, format } from 'date-fns';
import { Space } from '../../types';
import { spaceService } from '../../services/api';
import { reservationService } from '../../services/api';
import { QuickBookingCard } from '../../components/booking/card/QuickBookingCard';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/toast/Toast';

// Extended space interface for component usage
interface ComponentSpace extends Space {
  building: string;
  floor: number;
  room_number: string;
  equipment: any[];
  status: string;
  price_per_hour: number;
  price_per_day: number;
  photos: string[];
  surface?: number;
  max_booking_duration: number;
  booking_advance_time: number;
  requires_approval: boolean;
}

export const SpaceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, showError, showSuccess, removeToast } = useToast();
  const [space, setSpace] = useState<ComponentSpace | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [isAvailableNow, setIsAvailableNow] = useState<boolean | null>(null);

  // Mapping function to convert API Space to ComponentSpace
  const mapApiSpaceToComponentSpace = (apiSpace: any): ComponentSpace => {
    // Handle the case where type might be a string from the API
    const spaceType = typeof apiSpace.type === 'string' 
      ? { 
          id: apiSpace.type, 
          name: apiSpace.type.charAt(0).toUpperCase() + apiSpace.type.slice(1), 
          slug: apiSpace.type,
          description: '',
          icon: ''
        }
      : apiSpace.type;

    return {
      ...apiSpace,
      type: spaceType,
      location: {
        building: apiSpace.building || 'Unknown Building',
        floor: apiSpace.floor || 1,
        room: apiSpace.room_number || 'N/A'
      },
      building: apiSpace.building || 'Unknown Building',
      floor: apiSpace.floor || 1,
      room_number: apiSpace.room_number || 'N/A',
      equipment: apiSpace.equipment || [],
      status: apiSpace.status || (apiSpace.available ? 'available' : 'unavailable'),
      price_per_hour: apiSpace.price_per_hour || 0,
      price_per_day: apiSpace.price_per_day || 0,
      pricePerHour: apiSpace.price_per_hour || 0,
      pricePerDay: apiSpace.price_per_day || 0,
      photos: apiSpace.photos || [],
      images: apiSpace.photos || [],
      amenities: apiSpace.equipment || [],
      available: apiSpace.status === 'available',
      surface: apiSpace.surface,
      max_booking_duration: apiSpace.max_booking_duration || 480,
      booking_advance_time: apiSpace.booking_advance_time || 15,
      requires_approval: apiSpace.requires_approval || false,
      rating: 0, // Default values for missing API fields
      reviewCount: 0,
      imageUrl: apiSpace.photos?.[0],
      workingHours: {},
      createdAt: new Date(apiSpace.created_at || Date.now()),
      updatedAt: new Date(apiSpace.updated_at || Date.now()),
    };
  };

  useEffect(() => {
    const fetchSpace = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await spaceService.getSpace(id);
        if (response.success && response.data) {
          const mappedSpace = mapApiSpaceToComponentSpace(response.data);
          setSpace(mappedSpace);
          
          // Load favorites from localStorage
          const savedFavorites = localStorage.getItem("favoriteSpaces");
          if (savedFavorites) {
            const favorites = JSON.parse(savedFavorites);
            setIsFavorited(favorites.includes(id));
          }
        } else {
          const errorMsg = response.message || 'Space not found';
          setError(errorMsg);
          showError(errorMsg);
        }
      } catch (error) {
        console.error("Error loading space:", error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to load space';
        setError(errorMsg);
        showError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchSpace();
  }, [id]);

  const getSpaceTypeDisplay = (type: any) => {
    if (typeof type === 'string') {
      return type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
    return type?.name || 'Unknown Type';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'out_of_service': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'reserved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getEquipmentIcon = (equipmentName: string) => {
    const name = equipmentName.toLowerCase();
    if (name.includes('wifi') || name.includes('internet') || name.includes('network')) return <Wifi className="w-5 h-5" />;
    if (name.includes('coffee') || name.includes('kitchen') || name.includes('beverage')) return <Coffee className="w-5 h-5" />;
    if (name.includes('parking') || name.includes('car')) return <Car className="w-5 h-5" />;
    if (name.includes('security') || name.includes('access') || name.includes('keycard')) return <Shield className="w-5 h-5" />;
    if (name.includes('projector') || name.includes('screen') || name.includes('tv')) return <Calendar className="w-5 h-5" />;
    if (name.includes('phone') || name.includes('conference') || name.includes('call')) return <Clock className="w-5 h-5" />;
    if (name.includes('whiteboard') || name.includes('board') || name.includes('marker')) return <MapPin className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  const handleQuickBook = async (bookingData: {
    start_time: string;
    end_time: string;
    participant_count: number;
  }) => {
    if (!space) return;

    // Check if user is authenticated
    const token = localStorage.getItem('cohub-token');
    if (!token) {
      showError('Please log in to make a reservation');
      // Redirect to login with return URL
      navigate('/auth/login', { 
        state: { 
          returnTo: `/spaces/${space.id}`,
          message: 'Please log in to make a reservation'
        }
      });
      return;
    }

    setBookingLoading(true);
    try {
      console.log('Original booking data from QuickBookingCard:', bookingData);
      
      // Parse the user's selected date/time using date-fns
      // The bookingData comes in format: "2025-07-11T09:00:00"
      const startDateTime = parseISO(bookingData.start_time);
      const endDateTime = parseISO(bookingData.end_time);
      
      console.log('Parsed user selection:', {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        start_time: bookingData.start_time,
        end_time: bookingData.end_time
      });
      
      // Validate that the booking is in the future
      const now = new Date();
      if (!isAfter(startDateTime, now)) {
        // If the selected time is in the past, add a small offset to make it valid
        const adjustedStart = addMinutes(now, 5); // 5 minutes from now
        const duration = endDateTime.getTime() - startDateTime.getTime();
        const adjustedEnd = new Date(adjustedStart.getTime() + duration);
        
        console.log('Adjusted times for future booking:', {
          original: {
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString()
          },
          adjusted: {
            start: adjustedStart.toISOString(),
            end: adjustedEnd.toISOString()
          }
        });
        
        // Use adjusted times
        const reservationData = {
          spaceId: space.id,
          startDate: format(adjustedStart, 'yyyy-MM-dd'),
          endDate: format(adjustedEnd, 'yyyy-MM-dd'),
          startTime: format(adjustedStart, 'HH:mm'),
          endTime: format(adjustedEnd, 'HH:mm'),
          participantCount: bookingData.participant_count,
          title: `Quick booking for ${bookingData.participant_count} people`,
          notes: `Quick booking for ${bookingData.participant_count} people`
        };
        
        console.log('Sending adjusted reservation data:', reservationData);
        
        const response = await reservationService.createReservation(reservationData);
        
        if (response.success) {
          showSuccess('Booking created successfully! (Time was adjusted to be in the future)');
          navigate('/bookings', { 
            state: { 
              message: 'Booking created successfully! (Time was adjusted to be in the future)',
              reservationId: response.data?.id
            }
          });
        } else {
          showError(response.message || 'Failed to create reservation');
          throw new Error(response.message || 'Failed to create reservation');
        }
      } else {
        // Use the user's exact selected times
        const reservationData = {
          spaceId: space.id,
          startDate: format(startDateTime, 'yyyy-MM-dd'),
          endDate: format(endDateTime, 'yyyy-MM-dd'),
          startTime: format(startDateTime, 'HH:mm'),
          endTime: format(endDateTime, 'HH:mm'),
          participantCount: bookingData.participant_count,
          title: `Quick booking for ${bookingData.participant_count} people`,
          notes: `Quick booking for ${bookingData.participant_count} people`
        };

        console.log('Sending exact user selection:', reservationData);

        const response = await reservationService.createReservation(reservationData);
        
        if (response.success) {
          showSuccess('Booking created successfully!');
          navigate('/bookings', { 
            state: { 
              message: 'Booking created successfully!',
              reservationId: response.data?.id
            }
          });
        } else {
          showError(response.message || 'Failed to create reservation');
          throw new Error(response.message || 'Failed to create reservation');
        }
      }
    } catch (error: any) {
      console.error('Quick booking error:', error);
      
      // Check if it's an authentication error
      if (error.message && (error.message.includes('Unauthorized') || error.message.includes('invalid user ID format'))) {
        // Token might be invalid, redirect to login
        showError('Your session has expired. Please log in again.');
        localStorage.removeItem('cohub-token');
        navigate('/auth/login', { 
          state: { 
            returnTo: `/spaces/${space.id}`,
            message: 'Your session has expired. Please log in again to make a reservation.'
          }
        });
        return;
      }
      
      // Other errors - show toast and fallback to full booking form
      showError(error.message || 'Quick booking failed');
      navigate(`/bookings/${space.id}`, { 
        state: { 
          prefillData: bookingData,
          error: error.message || 'Quick booking failed, please use the full form'
        }
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleOpenFullForm = () => {
    // Navigate to the full booking form
    navigate(`/bookings/${space?.id}`);
  };

  const handleToggleFavorite = () => {
    if (!space) return;

    const savedFavorites = localStorage.getItem("favoriteSpaces");
    let favorites: string[] = savedFavorites ? JSON.parse(savedFavorites) : [];
    
    if (isFavorited) {
      // Remove from favorites
      favorites = favorites.filter(fav => fav !== space.id);
    } else {
      // Add to favorites
      favorites.push(space.id);
    }
    
    localStorage.setItem("favoriteSpaces", JSON.stringify(favorites));
    setIsFavorited(!isFavorited);
  };

  const checkCurrentAvailability = async () => {
    if (!space || !space.id) {
      console.log('Cannot check availability: space or space.id is missing', { space, spaceId: space?.id });
      return;
    }

    setAvailabilityLoading(true);
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Robust time formatting to ensure HH:MM format
      const formatTime = (date: Date): string => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };
      
      const currentTime = formatTime(now);
      const endDate = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
      const endTime = formatTime(endDate);

      // Use the interface format that will be converted by the service
      const availabilityRequest = {
        startDate: currentDate,
        endDate: currentDate,
        startTime: currentTime,
        endTime: endTime
      };

      const response = await spaceService.checkSpaceAvailability(space.id, availabilityRequest);

      if (response.success && response.data !== undefined) {
        setIsAvailableNow(response.data);
      } else {
        showError('Failed to check availability');
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      showError('Error checking availability. Please try again.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Check availability when space loads - DISABLED for now
  // useEffect(() => {
  //   if (space) {
  //     checkCurrentAvailability();
  //   }
  // }, [space?.id]);

  const handleShare = async () => {
    if (!space) return;

    const shareData = {
      title: `${space.name} - CoHub Space`,
      text: `Check out this workspace: ${space.description}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        
        // Show a temporary notification
        const button = document.querySelector('[data-share-button]') as HTMLElement;
        if (button) {
          const originalText = button.textContent;
          button.textContent = 'Copied!';
          button.className = button.className.replace('text-gray-600', 'text-green-600');
          setTimeout(() => {
            button.textContent = originalText;
            button.className = button.className.replace('text-green-600', 'text-gray-600');
          }, 2000);
        }
      }
    } catch (err) {
      console.log('Error sharing:', err);
      // Final fallback for older browsers
      if (window.location.href) {
        const textArea = document.createElement('textarea');
        textArea.value = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error ? 'Error Loading Space' : 'Space Not Found'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "The space you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => navigate('/spaces')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse All Spaces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{space.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{getSpaceTypeDisplay(space.type)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-lg border ${
              isFavorited 
                ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' 
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            data-share-button
            className="p-2 rounded-lg border bg-white border-gray-300 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Photos and Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Gallery */}
          <div className="space-y-4">
            {/* Main Photo */}
            <div className="relative h-96 bg-gray-200 rounded-xl overflow-hidden">
              {space.photos && space.photos.length > 0 ? (
                <img
                  src={space.photos[selectedPhoto]}
                  alt={space.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Calendar className="w-24 h-24" />
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(space.status)}`}>
                  {space.status.charAt(0).toUpperCase() + space.status.slice(1)}
                </span>
                {isAvailableNow !== null && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isAvailableNow 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  }`}>
                    {isAvailableNow ? 'Available Now' : 'Busy Now'}
                  </span>
                )}
                {availabilityLoading && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 inline-block mr-1"></div>
                    Checking...
                  </span>
                )}
              </div>
            </div>

            {/* Photo Thumbnails */}
            {space.photos && space.photos.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {space.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPhoto(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedPhoto === index ? 'border-blue-500' : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`${space.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About This Space</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{space.description}</p>
          </div>

          {/* Equipment & Amenities */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Equipment & Amenities</h2>
            {space.equipment && space.equipment.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {space.equipment.map((equipment, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-blue-600 dark:text-blue-400">
                      {getEquipmentIcon(typeof equipment === 'string' ? equipment : equipment.name)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {typeof equipment === 'string' ? equipment : equipment.name}
                      </p>
                      {typeof equipment === 'object' && equipment.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{equipment.description}</p>
                      )}
                    </div>
                    {typeof equipment === 'object' && equipment.quantity && (
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        x{equipment.quantity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No specific equipment listed for this space</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Basic amenities may be available - contact for details
                </p>
              </div>
            )}
          </div>

          {/* Location Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Location & Pricing</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <MapPin className="w-5 h-5" />
                <span>{space.building} - Floor {space.floor} - Room {space.room_number}</span>
              </div>
              {space.surface && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-5 h-5" />
                  <span>Surface Area: {space.surface} m²</span>
                </div>
              )}
              
              {/* Pricing Information */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${space.price_per_hour}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">per hour</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${space.price_per_day}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">per day</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Here you could add a map component */}
            <div className="mt-4 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Interactive map coming soon</p>
            </div>
          </div>

          {/* Booking Rules */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Booking Information</h2>
              <button
                onClick={checkCurrentAvailability}
                disabled={availabilityLoading}
                className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 transition-colors"
              >
                {availabilityLoading ? 'Checking...' : 'Check Now'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Max Duration</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{space.max_booking_duration / 60}h</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Advance Booking</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{space.booking_advance_time}min</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>Capacity</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{space.capacity} people</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Current Status</span>
                </div>
                <span className={`font-medium ${
                  isAvailableNow === true 
                    ? 'text-green-600 dark:text-green-400'
                    : isAvailableNow === false 
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {isAvailableNow === true ? 'Available' : isAvailableNow === false ? 'Busy' : 'Unknown'}
                </span>
              </div>
              {space.requires_approval && (
                <div className="md:col-span-2 flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Manager Approval Required</span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Booking Card */}
        <div className="lg:col-span-1">
          <QuickBookingCard
            space={space as any} // Temporary type assertion for compatibility
            onBookNow={handleQuickBook}
            onOpenFullForm={handleOpenFullForm}
            isLoading={bookingLoading}
            className="shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};