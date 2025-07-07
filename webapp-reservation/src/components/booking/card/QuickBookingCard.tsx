import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { format, addHours, parse } from 'date-fns';
import { Button } from '../../ui/button/Button';
import { Input } from '../../ui/input/Input';
import { generateTimeSlots } from '../../../utils/bookingHelpers';
import type { Space } from '../../../types/space';

interface QuickBookingCardProps {
  space: Space;
  onBookNow?: (data: {
    start_time: string;
    end_time: string;
    participant_count: number;
  }) => void;
  onOpenFullForm?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const QuickBookingCard: React.FC<QuickBookingCardProps> = ({
  space,
  onBookNow,
  onOpenFullForm,
  isLoading = false,
  className = ''
}) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [participantCount, setParticipantCount] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const navigate = useNavigate();

  const timeSlots = generateTimeSlots(8, 20, 30);

  // Auto-calculate end time when start time changes
  useEffect(() => {
    const start = parse(startTime, 'HH:mm', new Date());
    const end = addHours(start, 1);
    setEndTime(format(end, 'HH:mm'));
  }, [startTime]);

  // Calculate estimated cost
  useEffect(() => {
    if (space.price_per_hour && space.price_per_hour > 0) {
      try {
        const startDateTime = parse(startTime, 'HH:mm', new Date());
        const endDateTime = parse(endTime, 'HH:mm', new Date());
        
        if (endDateTime > startDateTime) {
          const diffInHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
          setEstimatedCost(diffInHours * space.price_per_hour);
        }
      } catch {
        setEstimatedCost(0);
      }
    }
  }, [startTime, endTime, space.price_per_hour]);

  const handleQuickBook = () => {
    const startDateTime = `${selectedDate}T${startTime}:00`;
    const endDateTime = `${selectedDate}T${endTime}:00`;
    
    const bookingData = {
      start_time: startDateTime,
      end_time: endDateTime,
      participant_count: participantCount
    };

    if (onBookNow) {
      // If parent component provided a custom handler, use it
      onBookNow(bookingData);
    } else {
      // Otherwise, navigate to the booking page with the data
      navigate(`/bookings/${space.id}`, { 
        state: { 
          prefillData: bookingData 
        }
      });
    }
  };

  const handleAdvancedOptions = () => {
    if (onOpenFullForm) {
      onOpenFullForm();
    } else {
      // Navigate to the booking page
      navigate(`/bookings/${space.id}`);
    }
  };

  const isValidBooking = () => {
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());
    const selectedDateTime = new Date(selectedDate);
    const now = new Date();
    
    return (
      end > start &&
      participantCount > 0 &&
      participantCount <= space.capacity &&
      selectedDateTime >= new Date(now.toDateString()) // Today or future
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 sticky top-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Booking
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Book this space instantly
          </p>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Date
          </label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={format(new Date(), 'yyyy-MM-dd')}
            className="w-full"
          />
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Start
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>
                  {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End
            </label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>
                  {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Participant Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Users className="inline w-4 h-4 mr-1" />
            Participants
          </label>
          <Input
            type="number"
            min="1"
            max={space.capacity}
            value={participantCount}
            onChange={(e) => setParticipantCount(parseInt(e.target.value) || 1)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Max capacity: {space.capacity} people
          </p>
        </div>

        {/* Cost Estimation */}
        {space.price_per_hour && space.price_per_hour > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Estimated Cost
              </span>
              <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                ${estimatedCost.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              ${space.price_per_hour}/hour
            </p>
          </div>
        )}

        {/* Booking Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            onClick={handleQuickBook}
            disabled={!isValidBooking() || isLoading}
            loading={isLoading}
            className="w-full"
          >
            Book Now
          </Button>
          
          <Button
            onClick={handleAdvancedOptions}
            variant="secondary"
            disabled={isLoading}
            className="w-full"
          >
            Advanced Options
          </Button>
        </div>

        {/* Space Features */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            What's Included
          </h4>
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
              <span>Capacity for {space.capacity} people</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
              <span>Free cancellation 30 min before</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {space.capacity}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Max People
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};