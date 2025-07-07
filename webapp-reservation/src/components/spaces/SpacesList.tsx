// components/spaces/SpacesList.tsx - Updated version
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Space, SpaceFilters } from '../../types/space';
import { SpaceCard } from './card/SpaceCard';
import { SpaceFiltersComponent } from './filter/SpaceFilters';
import { Search, Grid, List, MapPin, Users, Clock, Calendar } from 'lucide-react';

interface SpacesListProps {
  spaces: Space[];
  buildings: string[];
  onBookSpace?: (space: Space) => void; // Made optional since we'll use navigation
}

export const SpacesList: React.FC<SpacesListProps> = ({ spaces, buildings, onBookSpace }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SpaceFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  const filteredSpaces = spaces.filter(space => {
    // Search filter
    const matchesSearch = space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         space.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         space.building.toLowerCase().includes(searchTerm.toLowerCase());

    // Type filter
    const matchesType = !filters.type || space.type === filters.type;

    // Building filter
    const matchesBuilding = !filters.building || space.building === filters.building;

    // Capacity filter
    const matchesCapacity = !filters.capacity || space.capacity >= filters.capacity;

    // Price filter
    const matchesPrice = !filters.priceRange || space.price_per_hour <= filters.priceRange[1];

    return matchesSearch && matchesType && matchesBuilding && matchesCapacity && matchesPrice;
  });

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const handleBookNow = (space: Space) => {
    if (onBookSpace) {
      // If parent component provided a custom handler, use it
      onBookSpace(space);
    } else {
      // Otherwise, navigate to the booking page
      navigate(`/bookings/${space.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search spaces..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title="Grid view"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title="List view"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <SpaceFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        buildings={buildings}
        onClearFilters={handleClearFilters}
      />

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600 dark:text-gray-400">
          {filteredSpaces.length} space{filteredSpaces.length !== 1 ? 's' : ''} found
          {(searchTerm || Object.values(filters).some(v => v !== undefined)) && (
            <span className="ml-2">
              ({spaces.length} total)
            </span>
          )}
        </p>
        {(searchTerm || Object.values(filters).some(v => v !== undefined)) && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Spaces Grid/List */}
      {filteredSpaces.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No spaces found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || Object.values(filters).some(v => v !== undefined)
              ? "Try adjusting your search criteria or filters"
              : "No spaces are currently available"
            }
          </p>
          {(searchTerm || Object.values(filters).some(v => v !== undefined)) && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpaces.map(space => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  onBookNow={handleBookNow}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSpaces.map(space => (
                <SpaceListItem
                  key={space.id}
                  space={space}
                  onBookNow={handleBookNow}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// List view component for spaces
interface SpaceListItemProps {
  space: Space;
  onBookNow: (space: Space) => void;
}

const SpaceListItem: React.FC<SpaceListItemProps> = ({ space, onBookNow }) => {
  const navigate = useNavigate();

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

  const handleViewDetails = () => {
    navigate(`/spaces/${space.id}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="flex">
        {/* Image */}
        <div className="w-48 h-32 bg-gray-200 flex-shrink-0 cursor-pointer" onClick={handleViewDetails}>
          {space.photos && space.photos.length > 0 ? (
            <img 
              src={space.photos[0]} 
              alt={space.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Calendar className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="cursor-pointer" onClick={handleViewDetails}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                  {space.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{getSpaceTypeDisplay(space.type)}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(space.status)}`}>
                {space.status.charAt(0).toUpperCase() + space.status.slice(1)}
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{space.building} - Floor {space.floor} - Room {space.room_number}</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{space.capacity} people</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{space.max_booking_duration / 60}h max</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {space.description}
            </p>
          </div>

          {/* Price and Actions */}
          <div className="ml-4 flex flex-col justify-between items-end">
            <div className="text-right mb-3">
              <p className="text-lg font-bold text-gray-900 dark:text-white">${space.price_per_hour}/hr</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">${space.price_per_day}/day</p>
            </div>

            <div className="flex flex-col gap-2 min-w-[120px]">
              <button
                onClick={handleViewDetails}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => onBookNow(space)}
                disabled={space.status !== 'available'}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};