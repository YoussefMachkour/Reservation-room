// components/spaces/SpaceFilters.tsx
import React from 'react';
import { SpaceFilters, SpaceType } from '../../../types/space';
import { Filter, X } from 'lucide-react';

interface SpaceFiltersProps {
  filters: SpaceFilters;
  onFiltersChange: (filters: SpaceFilters) => void;
  buildings: string[];
  onClearFilters: () => void;
}

export const SpaceFiltersComponent: React.FC<SpaceFiltersProps> = ({
  filters,
  onFiltersChange,
  buildings,
  onClearFilters
}) => {
  const spaceTypes: { value: SpaceType; label: string }[] = [
    { value: 'meeting_room', label: 'Meeting Room' },
    { value: 'office', label: 'Office' },
    { value: 'auditorium', label: 'Auditorium' },
    { value: 'open_space', label: 'Open Space' },
    { value: 'hot_desk', label: 'Hot Desk' },
    { value: 'conference_room', label: 'Conference Room' }
  ];

  const handleFilterChange = (key: keyof SpaceFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== null);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Space Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Space Type
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {spaceTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Building */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Building
          </label>
          <select
            value={filters.building || ''}
            onChange={(e) => handleFilterChange('building', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Buildings</option>
            {buildings.map(building => (
              <option key={building} value={building}>
                {building}
              </option>
            ))}
          </select>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Capacity
          </label>
          <input
            type="number"
            placeholder="People"
            value={filters.capacity || ''}
            onChange={(e) => handleFilterChange('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Price per Hour
          </label>
          <input
            type="number"
            placeholder="$"
            value={filters.priceRange?.[1] || ''}
            onChange={(e) => handleFilterChange('priceRange', e.target.value ? [0, parseInt(e.target.value)] : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};