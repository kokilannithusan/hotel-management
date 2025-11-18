import React, { useState, useRef, useEffect } from "react";
import { Calendar, X } from "lucide-react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const formattedDate = formatDate(selectedDate);

    if (selectingStart) {
      onStartDateChange(formattedDate);
      onEndDateChange(""); // Clear end date when selecting new start
      setSelectingStart(false);
    } else {
      const start = parseDate(startDate);
      if (start && selectedDate < start) {
        // If selected end date is before start, swap them
        onStartDateChange(formattedDate);
        onEndDateChange(startDate);
      } else {
        onEndDateChange(formattedDate);
      }
      setIsOpen(false);
      setSelectingStart(true);
    }
  };

  const isDateInRange = (day: number): boolean => {
    if (!startDate || !endDate) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    return start && end ? date >= start && date <= end : false;
  };

  const isDateSelected = (day: number): boolean => {
    const date = formatDate(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    );
    return date === startDate || date === endDate;
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const clearDates = () => {
    onStartDateChange("");
    onEndDateChange("");
    setSelectingStart(true);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Calendar className="h-3.5 w-3.5 text-blue-600" />
          {label}
        </label>
      )}

      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 pr-10 text-sm shadow-sm transition-all cursor-pointer hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {startDate && endDate ? (
            <span className="flex items-center justify-between">
              <span>
                {startDate} to {endDate}
              </span>
            </span>
          ) : startDate ? (
            <span className="text-slate-600">
              From {startDate} - Select end date
            </span>
          ) : (
            <span className="text-slate-400">Select date range</span>
          )}
        </div>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearDates();
              }}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-1 hover:bg-blue-50 rounded transition-colors"
          >
            <Calendar className="h-4 w-4 text-blue-600" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border-2 border-blue-300 rounded-xl shadow-2xl p-5 w-80">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200">
            <button
              type="button"
              onClick={previousMonth}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all hover:scale-110 font-bold text-lg"
            >
              ←
            </button>
            <div className="font-bold text-slate-900 text-base">
              {monthNames[month]} {year}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all hover:scale-110 font-bold text-lg"
            >
              →
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-bold text-blue-700 py-2 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="h-9"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const inRange = isDateInRange(day);
              const selected = isDateSelected(day);
              const isStartDate =
                formatDate(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day
                  )
                ) === startDate;
              const isEndDate =
                formatDate(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day
                  )
                ) === endDate;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`h-9 rounded-lg text-sm font-semibold transition-all ${
                    selected
                      ? isStartDate
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg scale-105"
                        : isEndDate
                        ? "bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md hover:shadow-lg scale-105"
                        : "bg-blue-600 text-white font-bold"
                      : inRange
                      ? "bg-blue-50 text-blue-900 hover:bg-blue-100"
                      : "hover:bg-slate-100 text-slate-700 hover:scale-105"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-700">
              {selectingStart ? (
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  Select start date
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  Select end date
                </span>
              )}
            </div>
            {startDate && endDate && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
