import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { Button } from "../../ui/button/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import {
  formatDuration,
  getReservationDuration,
  getStatusBgColor,
} from "../../../utils/bookingHelpers";
import type { Reservation } from "../../../types/booking";

interface BookingCalendarProps {
  reservations: Reservation[];
  onDateSelect?: (date: Date) => void;
  onReservationClick?: (reservation: Reservation) => void;
  selectedDate?: Date;
  loading?: boolean;
  compact?: boolean;
  showUserNames?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  reservations: Reservation[];
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  reservations,
  onDateSelect,
  onReservationClick,
  selectedDate,
  loading = false,
  compact = false,
  showUserNames = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // Generate calendar days
  useEffect(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const calendarData = days.map((date) => {
      const dayReservations = reservations.filter((reservation) => {
        const reservationDate = parseISO(reservation.start_time);
        return isSameDay(date, reservationDate);
      });

      return {
        date,
        isCurrentMonth: isSameMonth(date, currentMonth),
        isToday: isToday(date),
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
        reservations: dayReservations,
      };
    });

    setCalendarDays(calendarData);
  }, [currentMonth, reservations, selectedDate]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleDateClick = (date: Date) => {
    onDateSelect?.(date);
  };

  const handleReservationClick = (
    e: React.MouseEvent,
    reservation: Reservation
  ) => {
    e.stopPropagation();
    onReservationClick?.(reservation);
  };

  const getReservationsByTimeSlot = (dayReservations: Reservation[]) => {
    // Sort reservations by start time
    return dayReservations
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
      .slice(0, compact ? 2 : 4); // Limit number of shown reservations
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigateMonth("next")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`border-r border-b border-gray-200 dark:border-gray-700 ${
              compact ? "h-20" : "h-32"
            } ${
              day.isCurrentMonth
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-900"
            } ${day.isSelected ? "ring-2 ring-blue-500 ring-inset" : ""} ${
              onDateSelect
                ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                : ""
            }`}
            onClick={() => handleDateClick(day.date)}
          >
            <div className="p-2 h-full flex flex-col">
              {/* Date Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium ${
                    day.isToday
                      ? "bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      : day.isCurrentMonth
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-400 dark:text-gray-600"
                  }`}
                >
                  {format(day.date, "d")}
                </span>

                {day.reservations.length > 0 && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {day.reservations.length}
                  </div>
                )}
              </div>

              {/* Reservations */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {getReservationsByTimeSlot(day.reservations).map(
                  (reservation) => {
                    const duration = getReservationDuration(
                      reservation.start_time,
                      reservation.end_time
                    );

                    return (
                      <div
                        key={reservation.id}
                        className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${getStatusBgColor(
                          reservation.status
                        )}`}
                        onClick={(e) => handleReservationClick(e, reservation)}
                        title={`${reservation.title} - ${format(
                          parseISO(reservation.start_time),
                          "h:mm a"
                        )} (${formatDuration(duration)})`}
                      >
                        <div className="font-medium truncate">
                          {reservation.title}
                        </div>
                        {!compact && (
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs opacity-75">
                              {format(
                                parseISO(reservation.start_time),
                                "h:mm a"
                              )}
                            </span>
                            <div className="flex items-center text-xs opacity-75">
                              <Users className="w-2 h-2 mr-1" />
                              {reservation.participant_count}
                            </div>
                          </div>
                        )}
                        {!compact && showUserNames && reservation.user && (
                          <div className="text-xs opacity-75 truncate">
                            {reservation.user.first_name}{" "}
                            {reservation.user.last_name}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}

                {day.reservations.length > (compact ? 2 : 4) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                    +{day.reservations.length - (compact ? 2 : 4)} more
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
