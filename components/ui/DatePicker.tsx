'use client';

/**
 * Calendar Date Picker Component
 * A visual calendar-style date picker
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Format a Date as a local YYYY-MM-DD string. Never use `toISOString()` for
 * this — it converts to UTC first, which silently shifts the date by a day
 * in any timezone ahead of UTC (e.g. IST) when the Date represents local
 * midnight.
 */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse a YYYY-MM-DD string as a local-midnight Date (avoids the UTC-parse offset that `new Date(str)` applies to date-only strings). */
function parseLocalDateString(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  disableWeekends?: boolean;
  /** Specific dates to block (YYYY-MM-DD). Pass holiday dates here. */
  disabledDates?: Set<string> | string[];
}

interface Position {
  top: number;
  left: number;
  width: number;
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  required = false,
  placeholder = 'Select a date',
  helperText,
  disableWeekends = false,
  disabledDates,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? parseLocalDateString(value) : null,
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Re-sync when the value prop changes after mount (e.g. a date picked
  // elsewhere on the page, like a calendar cell, updates this field via
  // props) — without this, only the very first value is ever reflected,
  // since useState's initializer only runs once.
  useEffect(() => {
    const parsed = value ? parseLocalDateString(value) : null;
    setSelectedDate(parsed);
    if (parsed) setDisplayDate(parsed);
  }, [value]);

  // Position the portalled dropdown against the trigger button, and keep it
  // pinned there on scroll/resize — rendering into document.body escapes any
  // ancestor's overflow/stacking context (e.g. a scrollable Modal or sticky
  // panel), which otherwise clips or hides an absolutely-positioned dropdown
  // nested inside it.
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside (either the trigger or the portalled popover)
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateString = toLocalDateString(date);
    onChange(dateString);
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    const dateString = toLocalDateString(date);
    if (minDate && dateString < minDate) return true;
    if (maxDate && dateString > maxDate) return true;
    if (disableWeekends) {
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday
      if (day === 0 || day === 6) return true;
    }
    // Check explicit disabled dates (e.g., public holidays)
    if (disabledDates) {
      const dateSet =
        disabledDates instanceof Set
          ? disabledDates
          : new Set(disabledDates);
      if (dateSet.has(dateString)) return true;
    }
    return false;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setDisplayDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const setDisplayMonth = (month: number) => {
    setDisplayDate((prev) => new Date(prev.getFullYear(), month, 1));
  };

  const setDisplayYear = (year: number) => {
    setDisplayDate((prev) => new Date(year, prev.getMonth(), 1));
  };

  // Year dropdown bounds: honor minDate/maxDate where given (e.g. a leave
  // request's minDate=tomorrow keeps the list to nearby years), otherwise
  // fall back to a wide range so a field like date-of-birth is usable
  // without every caller having to pass explicit bounds.
  const currentYear = new Date().getFullYear();
  const minYear = minDate ? parseLocalDateString(minDate).getFullYear() : currentYear - 100;
  const maxYear = maxDate ? parseLocalDateString(maxDate).getFullYear() : currentYear + 10;
  const yearOptions: number[] = [];
  for (let y = maxYear; y >= minYear; y--) yearOptions.push(y);

  const renderCalendar = () => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const days = renderCalendar();
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className='relative'>
      {label && (
        <label className='block text-sm font-medium mb-2'>
          {label} {required && <span className='text-red-500'>*</span>}
        </label>
      )}

      {/* Date Input Display */}
      <button
        ref={buttonRef}
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white text-left flex items-center justify-between hover:border-gray-600 transition-colors'
      >
        <span className={selectedDate ? 'text-white' : 'text-gray-500'}>
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
        </span>
        <svg
          className='w-5 h-5 text-gray-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      </button>

      {helperText && <p className='text-xs text-gray-500 mt-1'>{helperText}</p>}

      {/* Calendar Dropdown — portalled to document.body so it can never be
          clipped by a scrollable ancestor (a Modal, a sticky side panel, etc). */}
      {isOpen && mounted && position &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: 'absolute', top: position.top, left: position.left, width: position.width }}
            className='z-[9999] bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-lg p-4'
          >
            {/* Month/Year Navigation */}
            <div className='flex items-center justify-between mb-4'>
              <button
                type='button'
                onClick={() => navigateMonth('prev')}
                className='p-1 hover:bg-gray-800 rounded transition-colors'
              >
                <svg
                  className='w-5 h-5 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 19l-7-7 7-7'
                  />
                </svg>
              </button>

              <div className='flex items-center gap-1'>
                <select
                  value={displayDate.getMonth()}
                  onChange={(e) => setDisplayMonth(Number(e.target.value))}
                  className='bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer hover:bg-gray-800 rounded px-1 py-0.5'
                >
                  {monthNames.map((name, index) => (
                    <option key={name} value={index} className='bg-[#1a1a1a]'>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={displayDate.getFullYear()}
                  onChange={(e) => setDisplayYear(Number(e.target.value))}
                  className='bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer hover:bg-gray-800 rounded px-1 py-0.5'
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y} className='bg-[#1a1a1a]'>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type='button'
                onClick={() => navigateMonth('next')}
                className='p-1 hover:bg-gray-800 rounded transition-colors'
              >
                <svg
                  className='w-5 h-5 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </button>
            </div>

            {/* Day Names */}
            <div className='grid grid-cols-7 gap-1 mb-2'>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div
                  key={day}
                  className='text-center text-xs font-medium text-gray-500 py-1'
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className='grid grid-cols-7 gap-1'>
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} />;
                }

                const date = new Date(
                  displayDate.getFullYear(),
                  displayDate.getMonth(),
                  day,
                );
                const disabled = isDateDisabled(date);
                const today = isToday(date);
                const selected = isSelected(date);

                return (
                  <button
                    key={index}
                    type='button'
                    onClick={() => !disabled && handleDateClick(date)}
                    disabled={disabled}
                    className={`
                      p-2 text-sm rounded transition-colors
                      ${disabled ? 'text-gray-600 cursor-not-allowed' : 'text-white hover:bg-gray-800'}
                      ${today && !selected ? 'bg-gray-800 font-semibold' : ''}
                      ${selected ? 'bg-[var(--cyan)] text-black font-bold' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Today Button */}
            <div className='mt-3 pt-3 border-t border-gray-800'>
              <button
                type='button'
                onClick={() => {
                  const today = new Date();
                  if (!isDateDisabled(today)) {
                    handleDateClick(today);
                  }
                }}
                className='w-full py-2 text-sm text-[var(--cyan)] hover:bg-gray-800 rounded transition-colors'
              >
                Today
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
