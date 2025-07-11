import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, Users, FileText, Repeat, AlertCircle } from 'lucide-react';
import { format, addDays, parse, isAfter, isBefore } from 'date-fns';
import { Button } from '../../ui/button/Button';
import { Input } from '../../ui/input/Input';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { ErrorMessage } from '../../ui/ErrorMessage';
import { generateTimeSlots, validateBookingTimes, formatDuration } from '../../../utils/bookingHelpers';
import type { Space } from '../../../types/space';
import type { BookingFormData, RecurrencePattern, RecurrenceType } from '../../../types/booking';

// Create a schema that exactly matches BookingFormData
const bookingSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title too long'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_date: z.string().min(1, 'End date is required'),
  end_time: z.string().min(1, 'End time is required'),
  participant_count: z.number().min(1, 'At least 1 participant required').max(1000, 'Too many participants'),
  is_recurring: z.boolean(),
  recurrence_pattern: z.object({
    type: z.enum(['none', 'daily', 'weekly', 'monthly']),
    interval: z.number(),
    days_of_week: z.array(z.number()).optional(),
    end_date: z.string().optional(),
    max_occurrences: z.number().optional()
  }).optional()
}) satisfies z.ZodType<BookingFormData>;

interface BookingFormProps {
  space: Space;
  onSubmit: (data: BookingFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
  initialData?: Partial<BookingFormData>;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  space,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  initialData
}) => {
  const [showRecurrence, setShowRecurrence] = useState(initialData?.is_recurring || false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>({
    type: 'none',
    interval: 1,
    days_of_week: [],
    end_date: undefined,
    max_occurrences: undefined
  });
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    clearErrors
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      start_date: initialData?.start_date || format(new Date(), 'yyyy-MM-dd'),
      start_time: initialData?.start_time || '09:00',
      end_date: initialData?.end_date || format(new Date(), 'yyyy-MM-dd'),
      end_time: initialData?.end_time || '10:00',
      participant_count: initialData?.participant_count || 1,
      is_recurring: initialData?.is_recurring || false,
      recurrence_pattern: initialData?.recurrence_pattern
    }
  });

  const watchedValues = watch();
  const timeSlots = generateTimeSlots(8, 20, 30);

  // Initialize recurrence pattern from initial data
  useEffect(() => {
    if (initialData?.recurrence_pattern) {
      setRecurrencePattern(initialData.recurrence_pattern);
      setShowRecurrence(true);
    }
  }, [initialData?.recurrence_pattern]);

  // Calculate estimated cost
  useEffect(() => {
    if (watchedValues.start_date && watchedValues.start_time && 
        watchedValues.end_date && watchedValues.end_time) {
      const startDateTime = new Date(`${watchedValues.start_date}T${watchedValues.start_time}`);
      const endDateTime = new Date(`${watchedValues.end_date}T${watchedValues.end_time}`);
      
      if (isAfter(endDateTime, startDateTime)) {
        const diffInHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
        const cost = diffInHours * (space.price_per_hour || 0);
        setEstimatedCost(cost);
      }
    }
  }, [watchedValues.start_date, watchedValues.start_time, watchedValues.end_date, watchedValues.end_time, space.price_per_hour]);

  // Auto-set end date when start date changes
  useEffect(() => {
    if (watchedValues.start_date && !initialData?.end_date) {
      setValue('end_date', watchedValues.start_date);
    }
  }, [watchedValues.start_date, setValue, initialData?.end_date]);

  const handleFormSubmit = async (data: BookingFormData) => {
    // Validate booking times
    const startDateTime = `${data.start_date}T${data.start_time}`;
    const endDateTime = `${data.end_date}T${data.end_time}`;
    
    const validation = validateBookingTimes(startDateTime, endDateTime, 480); // 8 hours default
    if (!validation.valid) {
      // You might want to show the validation error here
      console.error('Validation error:', validation.error);
      return;
    }

    // Add recurrence pattern if recurring
    if (data.is_recurring && showRecurrence) {
      data.recurrence_pattern = recurrencePattern;
    }

    await onSubmit(data);
  };

  const handleRecurrenceToggle = (checked: boolean) => {
    setShowRecurrence(checked);
    setValue('is_recurring', checked);
    if (!checked) {
      setRecurrencePattern({
        type: 'none',
        interval: 1,
        days_of_week: [],
        end_date: undefined,
        max_occurrences: undefined
      });
      setValue('recurrence_pattern', undefined);
    }
  };

  const updateRecurrencePattern = (updates: Partial<RecurrencePattern>) => {
    const newPattern = { ...recurrencePattern, ...updates };
    setRecurrencePattern(newPattern);
    setValue('recurrence_pattern', newPattern);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Book {space.name}
        </h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FileText className="inline w-4 h-4 mr-1" />
            Booking Title
          </label>
          <Input
            id="title"
            {...register('title')}
            placeholder="e.g., Team Planning Meeting"
            error={errors.title?.message}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            {...register('description')}
            placeholder="Add any additional details about your booking..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Start Date
            </label>
            <Input
              id="start_date"
              type="date"
              {...register('start_date')}
              min={format(new Date(), 'yyyy-MM-dd')}
              error={errors.start_date?.message}
            />
          </div>

          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Start Time
            </label>
            <select
              id="start_time"
              {...register('start_time')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>
                  {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
                </option>
              ))}
            </select>
            {errors.start_time && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.start_time.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <Input
              id="end_date"
              type="date"
              {...register('end_date')}
              min={watchedValues.start_date || format(new Date(), 'yyyy-MM-dd')}
              error={errors.end_date?.message}
            />
          </div>

          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Time
            </label>
            <select
              id="end_time"
              {...register('end_time')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>
                  {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
                </option>
              ))}
            </select>
            {errors.end_time && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.end_time.message}</p>
            )}
          </div>
        </div>

        {/* Participant Count */}
        <div>
          <label htmlFor="participant_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Users className="inline w-4 h-4 mr-1" />
            Number of Participants
          </label>
          <Input
            id="participant_count"
            type="number"
            min="1"
            max={space.capacity}
            {...register('participant_count', { valueAsNumber: true })}
            error={errors.participant_count?.message}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Maximum capacity: {space.capacity} people
          </p>
        </div>

        {/* Recurring Booking */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showRecurrence}
                onChange={(e) => handleRecurrenceToggle(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <Repeat className="inline w-4 h-4 mr-1" />
                Make this a recurring booking
              </span>
            </label>
          </div>

          {showRecurrence && (
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Repeat
                  </label>
                  <select
                    value={recurrencePattern.type}
                    onChange={(e) => updateRecurrencePattern({ type: e.target.value as RecurrenceType })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Every
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={recurrencePattern.interval}
                      onChange={(e) => updateRecurrencePattern({ interval: parseInt(e.target.value) })}
                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {recurrencePattern.type === 'daily' && (recurrencePattern.interval === 1 ? 'day' : 'days')}
                      {recurrencePattern.type === 'weekly' && (recurrencePattern.interval === 1 ? 'week' : 'weeks')}
                      {recurrencePattern.type === 'monthly' && (recurrencePattern.interval === 1 ? 'month' : 'months')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={recurrencePattern.end_date ? format(new Date(recurrencePattern.end_date), 'yyyy-MM-dd') : ''}
                    onChange={(e) => updateRecurrencePattern({ end_date: e.target.value ? e.target.value : undefined })}
                    min={watchedValues.start_date}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Occurrences (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={recurrencePattern.max_occurrences || ''}
                    onChange={(e) => updateRecurrencePattern({ max_occurrences: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="No limit"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cost Estimation */}
        {space.price_per_hour && space.price_per_hour > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Estimated Cost
            </h3>
            <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              ${estimatedCost.toFixed(2)}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Rate: ${space.price_per_hour}/hour
            </p>
          </div>
        )}

        {/* Space Requirements Notice */}
        {space.status !== 'available' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Space Unavailable
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  This space is currently not available for booking.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || space.status !== 'available'}
            loading={isLoading}
          >
            Book Space
          </Button>
        </div>
      </form>
    </div>
  );
};