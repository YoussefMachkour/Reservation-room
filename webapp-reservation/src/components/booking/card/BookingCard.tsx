import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle,
  LogIn,
  LogOut,
  MoreHorizontal,
  Repeat
} from 'lucide-react';
import { Button } from '../../ui/button/Button';
import { 
  formatReservationStatus, 
  getStatusBgColor, 
  formatDateRange, 
  formatDuration,
  getReservationDuration,
  canCancelReservation,
  canModifyReservation,
  canCheckIn,
  canCheckOut,
  isReservationActive,
  isReservationUpcoming,
  formatRecurrencePattern
} from '../../../utils/bookingHelpers';
import type { Reservation } from '../../../types/booking';

interface ReservationCardProps {
  reservation: Reservation;
  showSpaceInfo?: boolean;
  onEdit?: (reservation: Reservation) => void;
  onCancel?: (reservation: Reservation) => void;
  onCheckIn?: (reservation: Reservation) => void;
  onCheckOut?: (reservation: Reservation) => void;
  onViewDetails?: (reservation: Reservation) => void;
  compact?: boolean;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  showSpaceInfo = false,
  onEdit,
  onCancel,
  onCheckIn,
  onCheckOut,
  onViewDetails,
  compact = false
}) => {
  const duration = getReservationDuration(reservation.start_time, reservation.end_time);
  const isActive = isReservationActive(reservation);
  const isUpcoming = isReservationUpcoming(reservation);

  const handleEdit = () => onEdit?.(reservation);
  const handleCancel = () => onCancel?.(reservation);
  const handleCheckIn = () => onCheckIn?.(reservation);
  const handleCheckOut = () => onCheckOut?.(reservation);
  const handleViewDetails = () => onViewDetails?.(reservation);

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {reservation.title}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(reservation.status)}`}>
                {formatReservationStatus(reservation.status)}
              </span>
              {reservation.is_recurring && (
                <Repeat className="w-3 h-3 text-gray-400" />
              )}
            </div>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(duration)}
              </span>
              {showSpaceInfo && reservation.space && (
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {reservation.space.name}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {canCheckIn(reservation) && (
              <Button size="sm" variant="secondary" onClick={handleCheckIn}>
                <LogIn className="w-3 h-3" />
              </Button>
            )}
            {canCheckOut(reservation) && (
              <Button size="sm" variant="secondary" onClick={handleCheckOut}>
                <LogOut className="w-3 h-3" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleViewDetails}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
      isActive ? 'border-green-500 dark:border-green-400' : 
      isUpcoming ? 'border-blue-500 dark:border-blue-400' : 
      'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {reservation.title}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(reservation.status)}`}>
                {formatReservationStatus(reservation.status)}
              </span>
            </div>
            
            {reservation.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {reservation.description}
              </p>
            )}
          </div>

          {/* Status indicators */}
          <div className="flex items-center space-x-2">
            {isActive && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                <span className="text-sm font-medium">Active</span>
              </div>
            )}
            {reservation.is_recurring && (
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <Repeat className="w-4 h-4 mr-1" />
                <span className="text-sm">Recurring</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{formatDateRange(reservation.start_time, reservation.end_time)}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Duration: {formatDuration(duration)}</span>
            </div>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{reservation.participant_count} participant{reservation.participant_count !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {showSpaceInfo && reservation.space && (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{reservation.space.name}</span>
              </div>
              
              
              <div className="text-sm text-gray-500 dark:text-gray-500">
                Capacity: {reservation.space.capacity} people
              </div>
              
            </div>
          )}
        </div>

        {/* Recurrence Info */}
        {reservation.is_recurring && reservation.recurrence_pattern && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
              <Repeat className="w-4 h-4 mr-2" />
              <span>{formatRecurrencePattern(reservation.recurrence_pattern)}</span>
            </div>
          </div>
        )}

        {/* Check-in/Check-out Status */}
        {(reservation.check_in_time || reservation.check_out_time) && (
          <div className="mb-4 space-y-2">
            {reservation.check_in_time && (
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Checked in at {new Date(reservation.check_in_time).toLocaleTimeString()}</span>
              </div>
            )}
            {reservation.check_out_time && (
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Checked out at {new Date(reservation.check_out_time).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Cancellation Reason */}
        {reservation.status === 'cancelled' && reservation.cancellation_reason && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start text-sm text-red-700 dark:text-red-300">
              <XCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Cancelled</p>
                <p>{reservation.cancellation_reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {canCheckIn(reservation) && (
              <Button size="sm" onClick={handleCheckIn}>
                <LogIn className="w-4 h-4 mr-2" />
                Check In
              </Button>
            )}
            
            {canCheckOut(reservation) && (
              <Button size="sm" onClick={handleCheckOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Check Out
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {canModifyReservation(reservation) && onEdit && (
              <Button size="sm" variant="secondary" onClick={handleEdit}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            
            {canCancelReservation(reservation) && onCancel && (
              <Button size="sm" variant="danger" onClick={handleCancel}>
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}

            {onViewDetails && (
              <Button size="sm" variant="ghost" onClick={handleViewDetails}>
                View Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};