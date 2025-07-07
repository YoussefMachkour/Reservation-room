// pages/SpaceDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Clock, 
  Calendar,
  Star,
  Share2,
  Heart,
  Wifi,
  Car,
  Coffee,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Space } from '../../types/space';
import { mockSpaces } from '../../mock/space';
import { QuickBookingCard } from '../../components/booking/card/QuickBookingCard';

export const SpaceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [space, setSpace] = useState<Space | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch space details
    const fetchSpace = async () => {
      setLoading(true);
      // In real app, this would be: const response = await api.get(`/spaces/${id}`)
      const foundSpace = mockSpaces.find(s => s.id === id);
      setSpace(foundSpace || null);
      setLoading(false);
    };

    if (id) {
      fetchSpace();
    }
  }, [id]);

  const getSpaceTypeDisplay = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
    if (name.includes('wifi') || name.includes('internet')) return <Wifi className="w-5 h-5" />;
    if (name.includes('coffee') || name.includes('kitchen')) return <Coffee className="w-5 h-5" />;
    if (name.includes('parking') || name.includes('car')) return <Car className="w-5 h-5" />;
    if (name.includes('security') || name.includes('access')) return <Shield className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  const handleQuickBook = (bookingData: {
    start_time: string;
    end_time: string;
    participant_count: number;
  }) => {
    // Navigate to booking page with prefilled data
    navigate(`/bookings/${space?.id}`, { 
      state: { 
        prefillData: bookingData 
      }
    });
  };

  const handleOpenFullForm = () => {
    // Navigate to the full booking form
    navigate(`/bookings/${space?.id}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: space?.name,
          text: space?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Space Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The space you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/spaces')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Browse All Spaces
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            onClick={() => setIsFavorited(!isFavorited)}
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
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(space.status)}`}>
                  {space.status.charAt(0).toUpperCase() + space.status.slice(1)}
                </span>
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
          {space.equipment && space.equipment.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Equipment & Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {space.equipment.map((equipment, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-blue-600 dark:text-blue-400">
                      {getEquipmentIcon(equipment.name)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{equipment.name}</p>
                      {equipment.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{equipment.description}</p>
                      )}
                    </div>
                    {equipment.quantity && (
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        x{equipment.quantity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Location</h2>
            <div className="space-y-3">
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
            </div>
            {/* Here you could add a map component */}
            <div className="mt-4 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Interactive map coming soon</p>
            </div>
          </div>

          {/* Booking Rules */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Booking Information</h2>
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
              {space.requires_approval && (
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Approval Required</span>
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
            space={space}
            onBookNow={handleQuickBook}
            onOpenFullForm={handleOpenFullForm}
            className="shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};