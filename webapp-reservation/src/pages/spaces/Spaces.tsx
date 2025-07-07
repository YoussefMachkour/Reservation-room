// pages/Spaces.tsx - Complete new version
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Grid, 
  List, 
  Filter,
  MapPin,
  Users,
  Clock,
  Calendar,
  Star,
  Bookmark,
  TrendingUp,
  Building2,
  X
} from 'lucide-react';
import { Space, SpaceFilters, SpaceType } from '../../types/space';
import { mockSpaces, mockBuildings } from '../../mock/space';
import { SpaceCard } from '../../components/spaces/card/SpaceCard';

export const SpacesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<SpaceFilters>({
    type: (searchParams.get('type') as SpaceType) || undefined,
    building: searchParams.get('building') || undefined,
    capacity: searchParams.get('capacity') ? parseInt(searchParams.get('capacity')!) : undefined,
    priceRange: searchParams.get('maxPrice') ? [0, parseInt(searchParams.get('maxPrice')!)] : undefined,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteSpaces, setFavoriteSpaces] = useState<string[]>([]);

  // Space types for filtering
  const spaceTypes: { value: SpaceType; label: string; icon: string }[] = [
    { value: 'meeting_room', label: 'Meeting Room', icon: '👥' },
    { value: 'office', label: 'Office', icon: '🏢' },
    { value: 'auditorium', label: 'Auditorium', icon: '🎭' },
    { value: 'open_space', label: 'Open Space', icon: '🌐' },
    { value: 'hot_desk', label: 'Hot Desk', icon: '💻' },
    { value: 'conference_room', label: 'Conference Room', icon: '📊' }
  ];

  // Load data on component mount
  useEffect(() => {
    const loadSpaces = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setSpaces(mockSpaces);
        
        // Load favorites from localStorage
        const savedFavorites = localStorage.getItem('favoriteSpaces');
        if (savedFavorites) {
          setFavoriteSpaces(JSON.parse(savedFavorites));
        }
      } catch (error) {
        console.error('Error loading spaces:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSpaces();
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (filters.type) params.set('type', filters.type);
    if (filters.building) params.set('building', filters.building);
    if (filters.capacity) params.set('capacity', filters.capacity.toString());
    if (filters.priceRange?.[1]) params.set('maxPrice', filters.priceRange[1].toString());
    
    setSearchParams(params);
  }, [searchTerm, filters, setSearchParams]);

  // Filter spaces
  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = searchTerm === '' || 
      space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.building.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !filters.type || space.type === filters.type;
    const matchesBuilding = !filters.building || space.building === filters.building;
    const matchesCapacity = !filters.capacity || space.capacity >= filters.capacity;
    const matchesPrice = !filters.priceRange || space.price_per_hour <= filters.priceRange[1];

    return matchesSearch && matchesType && matchesBuilding && matchesCapacity && matchesPrice;
  });

  // Get quick stats
  const stats = {
    totalSpaces: spaces.length,
    availableSpaces: spaces.filter(s => s.status === 'available').length,
    buildings: new Set(spaces.map(s => s.building)).size,
    avgPrice: Math.round(spaces.reduce((sum, s) => sum + s.price_per_hour, 0) / spaces.length)
  };

  // Handlers
  const handleBookSpace = (space: Space) => {
    navigate(`/spaces/${space.id}`);
  };

  const handleFilterChange = (key: keyof SpaceFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const toggleFavorite = (spaceId: string) => {
    const newFavorites = favoriteSpaces.includes(spaceId)
      ? favoriteSpaces.filter(id => id !== spaceId)
      : [...favoriteSpaces, spaceId];
    
    setFavoriteSpaces(newFavorites);
    localStorage.setItem('favoriteSpaces', JSON.stringify(newFavorites));
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== null) || searchTerm !== '';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg text-white overflow-hidden">
        <div className="p-8">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">Find Your Perfect Workspace</h1>
            <p className="text-xl text-blue-100 mb-6">
              Discover and book premium co-working spaces tailored to your needs
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{stats.totalSpaces}</div>
                <div className="text-sm text-blue-100">Total Spaces</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-300">{stats.availableSpaces}</div>
                <div className="text-sm text-blue-100">Available Now</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{stats.buildings}</div>
                <div className="text-sm text-blue-100">Buildings</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">${stats.avgPrice}</div>
                <div className="text-sm text-blue-100">Avg. per Hour</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        {/* Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search spaces, buildings, or amenities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                  {Object.values(filters).filter(v => v !== undefined).length + (searchTerm ? 1 : 0)}
                </span>
              )}
            </button>

            <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
                title="Grid view"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
                title="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Type Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleFilterChange('type', undefined)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !filters.type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Types
          </button>
          {spaceTypes.map(type => (
            <button
              key={type.value}
              onClick={() => handleFilterChange('type', type.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                filters.type === type.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Building Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Building
                </label>
                <select
                  value={filters.building || ''}
                  onChange={(e) => handleFilterChange('building', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Buildings</option>
                  {mockBuildings.map(building => (
                    <option key={building} value={building}>{building}</option>
                  ))}
                </select>
              </div>

              {/* Capacity Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Capacity
                </label>
                <input
                  type="number"
                  placeholder="People"
                  value={filters.capacity || ''}
                  onChange={(e) => handleFilterChange('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Price (per hour)
                </label>
                <input
                  type="number"
                  placeholder="$"
                  value={filters.priceRange?.[1] || ''}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value ? [0, parseInt(e.target.value)] : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">{filteredSpaces.length}</span> space{filteredSpaces.length !== 1 ? 's' : ''} found
            {hasActiveFilters && (
              <span className="ml-2 text-sm">
                (out of {spaces.length} total)
              </span>
            )}
          </p>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Spaces Grid */}
      {filteredSpaces.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Building2 className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No spaces found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {hasActiveFilters
              ? "Try adjusting your search criteria or filters to find more spaces."
              : "No spaces are currently available. Please check back later."
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredSpaces.map(space => (
            viewMode === 'grid' ? (
              <SpaceCard
                key={space.id}
                space={space}
                onBookNow={handleBookSpace}
              />
            ) : (
              <SpaceListItem
                key={space.id}
                space={space}
                onBookNow={handleBookSpace}
                isFavorited={favoriteSpaces.includes(space.id)}
                onToggleFavorite={() => toggleFavorite(space.id)}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

// List Item Component
interface SpaceListItemProps {
  space: Space;
  onBookNow: (space: Space) => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

const SpaceListItem: React.FC<SpaceListItemProps> = ({ 
  space, 
  onBookNow, 
  isFavorited, 
  onToggleFavorite 
}) => {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="flex">
        {/* Image */}
        <div 
          className="w-64 h-40 bg-gray-200 dark:bg-gray-700 flex-shrink-0 cursor-pointer"
          onClick={() => navigate(`/spaces/${space.id}`)}
        >
          {space.photos.length > 0 ? (
            <img 
              src={space.photos[0]} 
              alt={space.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
              <Calendar className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 
                    className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    onClick={() => navigate(`/spaces/${space.id}`)}
                  >
                    {space.name}
                  </h3>
                  <button
                    onClick={onToggleFavorite}
                    className={`p-1 rounded ${isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    <Bookmark className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{getSpaceTypeDisplay(space.type)}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(space.status)}`}>
                  {space.status.charAt(0).toUpperCase() + space.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{space.building} - Floor {space.floor} - Room {space.room_number}</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>{space.capacity} people</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{space.max_booking_duration / 60}h max</span>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
              {space.description}
            </p>

            {/* Equipment tags */}
            <div className="flex flex-wrap gap-2">
              {space.equipment.slice(0, 4).map((eq, index) => (
                <span key={index} className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                  {eq.name}
                </span>
              ))}
              {space.equipment.length > 4 && (
                <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                  +{space.equipment.length - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Price and Actions */}
          <div className="ml-6 flex flex-col justify-between items-end text-right">
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${space.price_per_hour}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">per hour</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">${space.price_per_day}/day</p>
            </div>

            <div className="flex flex-col gap-2 min-w-[140px]">
              <button
                onClick={() => navigate(`/spaces/${space.id}`)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => onBookNow(space)}
                disabled={space.status !== 'available'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {space.status === 'available' ? 'Book Now' : 'Unavailable'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};