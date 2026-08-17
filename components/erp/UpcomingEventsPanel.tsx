'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  getUpcomingEventsAction,
  getMonthEventsAction,
  type UpcomingEvent,
  type UpcomingEventType,
} from '@/actions/erp/events';

const EVENT_META: Record<
  UpcomingEventType,
  { icon: string; badge: string }
> = {
  birthday: { icon: '🎂', badge: 'bg-pink-500/20 text-pink-400' },
  anniversary: { icon: '🎉', badge: 'bg-purple-500/20 text-purple-400' },
  'holiday-public': { icon: '🏛️', badge: 'bg-red-500/20 text-red-400' },
  'holiday-floater': { icon: '🎈', badge: 'bg-amber-500/20 text-amber-400' },
  'holiday-other': { icon: '📅', badge: 'bg-blue-500/20 text-blue-400' },
};

function formatWhen(daysUntil: number, date: string) {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil === -1) return 'Yesterday';
  const d = new Date(`${date}T00:00:00Z`);
  const label = d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  });
  return daysUntil < 0 ? `${label} (past)` : label;
}

function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  });
}

export default function UpcomingEventsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [soonCount, setSoonCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // SSR-safe portal gate (document doesn't exist during server render) — same
  // pattern as MonthPicker.tsx.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const now = new Date();
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const isCurrentMonth =
    cursor.year === now.getFullYear() && cursor.month === now.getMonth() + 1;

  // Badge count always reflects the next 7 days, independent of the panel's month view.
  useEffect(() => {
    getUpcomingEventsAction(7).then((upcoming) => setSoonCount(upcoming.length));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // Resets the spinner for the newly-selected month while the fetch below is in flight.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getMonthEventsAction(cursor.year, cursor.month)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [isOpen, cursor]);

  const shiftMonth = (delta: number) => {
    setCursor((prev) => {
      let month = prev.month + delta;
      let year = prev.year;
      if (month > 12) {
        month = 1;
        year += 1;
      } else if (month < 1) {
        month = 12;
        year -= 1;
      }
      return { year, month };
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg hover:bg-gray-800/40 text-gray-400 hover:text-white transition-colors"
        title="Upcoming events"
        aria-label="Upcoming events"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {soonCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-cyan text-[10px] font-bold text-black flex items-center justify-center">
            {soonCount}
          </span>
        )}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 bg-black z-40"
                />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-[#0c0c0e] border-l border-gray-800 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/80">
                <h2 className="font-bold text-white">📅 Events</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-850 text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Month navigator */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
                <button
                  onClick={() => shiftMonth(-1)}
                  className="p-1.5 rounded-lg hover:bg-gray-850 text-gray-400 hover:text-white transition-colors"
                  aria-label="Previous month"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold text-white">
                    {monthLabel(cursor.year, cursor.month)}
                  </span>
                  {!isCurrentMonth && (
                    <button
                      onClick={() =>
                        setCursor({ year: now.getFullYear(), month: now.getMonth() + 1 })
                      }
                      className="text-[10px] text-cyan hover:underline"
                    >
                      Back to this month
                    </button>
                  )}
                </div>
                <button
                  onClick={() => shiftMonth(1)}
                  className="p-1.5 rounded-lg hover:bg-gray-850 text-gray-400 hover:text-white transition-colors"
                  aria-label="Next month"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {loading ? (
                  <p className="text-xs text-gray-500 px-1">Loading...</p>
                ) : events.length === 0 ? (
                  <p className="text-xs text-gray-500 px-1">
                    Nothing on the calendar this month.
                  </p>
                ) : (
                  events.map((event, idx) => {
                    const meta = EVENT_META[event.type];
                    const isPast = event.daysUntil < 0;
                    return (
                      <div
                        key={`${event.type}-${event.date}-${idx}`}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-850/40 border border-gray-800/60"
                      >
                        <span className={`text-xl leading-none mt-0.5 ${isPast ? 'grayscale opacity-60' : ''}`}>
                          {meta.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${isPast ? 'text-gray-500' : 'text-white'}`}
                          >
                            {event.title}
                          </p>
                          {event.subtitle && (
                            <p className={`text-xs ${isPast ? 'text-gray-600' : 'text-gray-400'}`}>
                              {event.subtitle}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${
                            isPast ? 'bg-gray-700/40 text-gray-500' : meta.badge
                          }`}
                        >
                          {formatWhen(event.daysUntil, event.date)}
                        </span>
                      </div>
                    );
                  })
                )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
