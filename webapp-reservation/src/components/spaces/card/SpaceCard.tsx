// components/spaces/SpaceCard.tsx - Updated to match backend DTO
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ComponentSpace,
  getSpaceTypeDisplay,
  getStatusColor,
} from "../../../types/space";
import { MapPin, Users, Clock, Calendar } from "lucide-react";

interface SpaceCardProps {
  space: ComponentSpace;
  onBookNow?: (space: ComponentSpace) => void; // Made optional since we'll use navigation
}

export const SpaceCard: React.FC<SpaceCardProps> = ({ space, onBookNow }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/spaces/${space.id}`);
  };

  const handleBookNow = () => {
    if (onBookNow) {
      // If parent component provided a custom handler, use it
      onBookNow(space);
    } else {
      // Otherwise, navigate to the booking page
      navigate(`/bookings/${space.id}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image */}
      <div
        className="relative h-48 bg-gray-200 dark:bg-gray-700 cursor-pointer"
        onClick={handleViewDetails}
      >
        {space.photos && space.photos.length > 0 ? (
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
        <div className="absolute top-4 right-4">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              space.status
            )}`}
          >
            {space.status.charAt(0).toUpperCase() + space.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="cursor-pointer" onClick={handleViewDetails}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400">
              {space.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getSpaceTypeDisplay(space.type)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              ${space.price_per_hour}/hr
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ${space.price_per_day}/day
            </p>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span>
            {space.building} - Floor {space.floor} - Room {space.room_number}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{space.capacity} people</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{space.max_booking_duration / 60}h max</span>
          </div>
        </div>

        {/* Equipment Preview - Updated to handle both string and object equipment */}
        {space.equipment && space.equipment.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {space.equipment.slice(0, 3).map((eq, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs"
                >
                  {typeof eq === "string" ? eq : eq.name}
                </span>
              ))}
              {space.equipment.length > 3 && (
                <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                  +{space.equipment.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {space.description}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleViewDetails}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            View Details
          </button>
          <button
            onClick={handleBookNow}
            disabled={space.status !== "available"}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {space.status === "available" ? "Book Now" : "Unavailable"}
          </button>
        </div>
      </div>
    </div>
  );
};
