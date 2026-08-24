'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CompanyHoliday } from '@/lib/erp/holidays';

interface EmployeeHolidayCalendarProps {
  holidays: CompanyHoliday[];
  initialYear: number;
}

const HOLIDAY_TYPE_INFO: Record<
  CompanyHoliday['holiday_type'],
  { label: string; icon: string; badge: string; dot: string }
> = {
  public: {
    label: 'Mandatory / Government Holiday',
    icon: '🏛️',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    dot: 'bg-red-500',
  },
  floater: {
    label: 'Floater Holiday',
    icon: '🎈',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500',
  },
  company: {
    label: 'Company Holiday',
    icon: '🏢',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-500',
  },
  optional: {
    label: 'Company Holiday',
    icon: '🏢',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-500',
  },
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDisplayDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function EmployeeHolidayCalendar({
  holidays,
  initialYear,
}: EmployeeHolidayCalendarProps) {
  const router = useRouter();
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
  const [year, setYear] = useState(initialYear);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const holidaysByDate = new Map<string, CompanyHoliday>();
  holidays.forEach((h) => holidaysByDate.set(h.date, h));

  const changeYear = (nextYear: number) => {
    setYear(nextYear);
    setSelectedDate('');
    router.push(`/employee/holidays?year=${nextYear}`);
  };

  const shiftMonth = (delta: number) => {
    let next = monthIndex + delta;
    let nextYear = year;
    if (next > 11) {
      next = 0;
      nextYear += 1;
      changeYear(nextYear);
    } else if (next < 0) {
      next = 11;
      nextYear -= 1;
      changeYear(nextYear);
    }
    setMonthIndex(next);
    setSelectedDate('');
  };

  const firstDayIndex = new Date(year, monthIndex, 1).getDay();
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, monthIndex, 0).getDate();

  const days: { date: Date; isCurrentMonth: boolean; dayNum: number }[] = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({ date: new Date(year, monthIndex - 1, prevMonthTotalDays - i), isCurrentMonth: false, dayNum: prevMonthTotalDays - i });
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push({ date: new Date(year, monthIndex, i), isCurrentMonth: true, dayNum: i });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, monthIndex + 1, i), isCurrentMonth: false, dayNum: i });
  }

  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selectedHoliday = selectedDate ? holidaysByDate.get(selectedDate) : undefined;

  const upcomingList = holidays
    .filter((h) => h.date >= formatDateKey(new Date()))
    .slice(0, 5);

  return (
    <div className='space-y-6'>
      {/* Calendar */}
      <div className='glass rounded-lg p-6'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-gray-800 pb-4'>
          <h2 className='text-xl font-bold text-white flex items-center gap-2'>
            <span>📅</span>
            <span>{MONTHS[monthIndex]} {year}</span>
          </h2>
          <div className='flex items-center gap-2 bg-[#0c0c0e]/80 border border-gray-800 p-1.5 rounded-lg'>
            <button
              onClick={() => shiftMonth(-1)}
              className='p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors'
              aria-label='Previous month'
            >
              <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
              </svg>
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setMonthIndex(now.getMonth());
                if (year !== now.getFullYear()) changeYear(now.getFullYear());
                setSelectedDate('');
              }}
              className='px-2.5 py-1 text-xs font-semibold rounded-md hover:bg-gray-850 hover:text-white text-gray-400 transition-colors'
            >
              Today
            </button>
            <button
              onClick={() => shiftMonth(1)}
              className='p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors'
              aria-label='Next month'
            >
              <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
              </svg>
            </button>
          </div>
        </div>

        <div className='grid grid-cols-7 gap-1.5 mb-2 text-center text-xs font-bold text-gray-400 uppercase select-none tracking-wider'>
          {weekdays.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className='grid grid-cols-7 gap-1.5'>
          {days.map((cell, idx) => {
            const dateKey = formatDateKey(cell.date);
            const holiday = holidaysByDate.get(dateKey);
            const isToday = formatDateKey(new Date()) === dateKey;
            const isSelected = selectedDate === dateKey;

            return (
              <button
                key={idx}
                onClick={() => cell.isCurrentMonth && holiday && setSelectedDate(dateKey)}
                disabled={!cell.isCurrentMonth || !holiday}
                className={`min-h-[64px] sm:min-h-[80px] p-1.5 rounded-lg border flex flex-col gap-1 transition-all text-left ${
                  cell.isCurrentMonth
                    ? 'bg-gray-900/10 border-gray-800/60'
                    : 'bg-gray-950/20 border-gray-900/40 opacity-40'
                } ${isToday ? 'border-cyan/50 ring-1 ring-cyan/35' : ''} ${
                  isSelected ? 'border-cyan' : ''
                } ${holiday && cell.isCurrentMonth ? 'cursor-pointer hover:bg-gray-850/40' : 'cursor-default'}`}
              >
                <span
                  className={`text-xs font-bold ${
                    isToday
                      ? 'bg-cyan text-black px-1.5 py-0.5 rounded-md text-[10px] w-fit'
                      : cell.isCurrentMonth
                        ? 'text-gray-300'
                        : 'text-gray-600'
                  }`}
                >
                  {cell.dayNum}
                </span>
                {holiday && cell.isCurrentMonth && (
                  <span
                    className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-medium truncate border ${HOLIDAY_TYPE_INFO[holiday.holiday_type].badge}`}
                  >
                    {HOLIDAY_TYPE_INFO[holiday.holiday_type].icon} {holiday.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className='flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-850 text-xs text-gray-500'>
          {(Object.keys(HOLIDAY_TYPE_INFO) as CompanyHoliday['holiday_type'][])
            .filter((t) => t !== 'optional')
            .map((type) => (
              <div key={type} className='flex items-center gap-1.5'>
                <span className={`w-2.5 h-2.5 rounded-full ${HOLIDAY_TYPE_INFO[type].dot}`} />
                <span>{HOLIDAY_TYPE_INFO[type].label}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedHoliday && (
        <div className='bg-[#111111]/80 border border-gray-800 rounded-lg p-4 space-y-2'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-bold text-white'>
              {HOLIDAY_TYPE_INFO[selectedHoliday.holiday_type].icon} {selectedHoliday.name}
            </h3>
            <button
              onClick={() => setSelectedDate('')}
              className='text-xs text-gray-400 hover:text-white transition-colors'
            >
              Close ×
            </button>
          </div>
          <p className='text-sm text-gray-400'>{formatDisplayDate(selectedHoliday.date)}</p>
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${HOLIDAY_TYPE_INFO[selectedHoliday.holiday_type].badge}`}
          >
            {HOLIDAY_TYPE_INFO[selectedHoliday.holiday_type].label}
          </span>
          {selectedHoliday.description && (
            <p className='text-sm text-gray-300'>{selectedHoliday.description}</p>
          )}
          {selectedHoliday.holiday_type === 'floater' && (
            <p className='text-xs text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded-lg p-2 mt-2'>
              To take this as a day off, submit a{' '}
              <Link href='/employee/leave' className='underline font-medium'>
                Leave Request
              </Link>{' '}
              with type Floater.
            </p>
          )}
        </div>
      )}

      {/* Upcoming list */}
      <div className='glass rounded-lg p-6'>
        <h3 className='text-sm font-semibold text-white mb-3'>Upcoming Holidays</h3>
        {upcomingList.length === 0 ? (
          <p className='text-xs text-gray-500'>No upcoming holidays this year.</p>
        ) : (
          <div className='space-y-2'>
            {upcomingList.map((h) => (
              <div
                key={h.id}
                className='flex items-center justify-between p-2.5 rounded-lg bg-gray-850/30 border border-gray-800/60'
              >
                <div className='flex items-center gap-2'>
                  <span>{HOLIDAY_TYPE_INFO[h.holiday_type].icon}</span>
                  <div>
                    <p className='text-sm text-white font-medium'>{h.name}</p>
                    <p className='text-xs text-gray-500'>{formatDisplayDate(h.date)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${HOLIDAY_TYPE_INFO[h.holiday_type].badge}`}>
                  {HOLIDAY_TYPE_INFO[h.holiday_type].label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
