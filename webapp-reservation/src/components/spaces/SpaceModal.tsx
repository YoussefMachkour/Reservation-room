// components/spaces/SpaceModal.tsx
import React, { useState } from "react";
import { Space } from "../../types/space";
import { X, MapPin, Users, Clock, Calendar } from "lucide-react";

interface SpaceModalProps {
  space: Space;
  onClose: () => void;
  onBook: () => void;
}

export const SpaceModal: React.FC<SpaceModalProps> = ({
  space,
  onClose,
  onBook,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  const getSpaceTypeDisplay = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "out_of_service":
        return "bg-red-100 text-red-800";
      case "reserved":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // const getEquipmentIcon = (equipmentName: string) => {
  //   const name = equipmentName.toLowerCase();
  //   if (name.includes("wifi") || name.includes("internet"))
  //     return <Wifi className="w-4 h-4" />;
  //   if (name.includes("coffee") || name.includes("kitchen"))
  //     return <Coffee className="w-4 h-4" />;
  //   if (name.includes("parking") || name.includes("car"))
  //     return <Car className="w-4 h-4" />;
  //   if (name.includes("security") || name.includes("access"))
  //     return <Shield className="w-4 h-4" />;
  //   return <CheckCircle className="w-4 h-4" />;
  // };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{space.name}</h2>
            <p className="text-gray-600">{getSpaceTypeDisplay(space.type)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Photos */}
            <div>
              <div className="space-y-4">
                {/* Main Photo */}
                <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden">
                  {space.photos!.length > 0 ? (
                    <img
                      src={space.photos![selectedPhoto]}
                      alt={space.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Calendar className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        space.status
                      )}`}
                    >
                      {space.status.charAt(0).toUpperCase() +
                        space.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Photo Thumbnails */}
                {space.photos!.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {space.photos!.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPhoto(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          selectedPhoto === index
                            ? "border-blue-500"
                            : "border-gray-200"
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
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Space Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-3" />
                    <span>
                      {space.building} - Floor {space.floor} - Room{" "}
                      {space.room_number}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-5 h-5 mr-3" />
                    <span>Capacity: {space.capacity} people</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-3" />
                    <span>
                      Max booking: {space.max_booking_duration / 60} hours
                    </span>
                  </div>
                  {space.surface && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-5 h-5 mr-3" />
                      <span>Surface: {space.surface} m²</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Pricing
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Per Hour</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${space.price_per_hour}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Per Day</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${space.price_per_day}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Per Month</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${space.price_per_month}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Rules */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Booking Information
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    • Advance booking required: {space.booking_advance_time}{" "}
                    minutes
                  </p>
                  <p>
                    • Maximum duration: {space.max_booking_duration / 60} hours
                  </p>
                  {space.requires_approval && (
                    <p>
                      •{" "}
                      <span className="text-orange-600">Approval required</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Description
            </h3>
            <p className="text-gray-600 leading-relaxed">{space.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onBook}
              disabled={space.status !== "available"}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Book This Space
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
