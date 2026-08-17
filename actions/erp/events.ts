'use server';

/**
 * Server actions for the "Upcoming Events" panel (admin/erp header) —
 * merges employee birthdays, work anniversaries, and company holidays
 * (public + floater) into one sorted timeline.
 */

import { getSession } from '@/lib/auth';
import {
  getUpcomingBirthdays,
  getUpcomingAnniversaries,
  getBirthdaysInMonth,
  getAnniversariesInMonth,
  type UpcomingCelebration,
} from '@/lib/erp/employees';
import {
  getUpcomingHolidays,
  getHolidaysInMonth,
  type MonthHoliday,
} from '@/lib/erp/holidays';

export type UpcomingEventType =
  | 'birthday'
  | 'anniversary'
  | 'holiday-public'
  | 'holiday-floater'
  | 'holiday-other';

export interface UpcomingEvent {
  type: UpcomingEventType;
  title: string;
  subtitle?: string;
  date: string; // YYYY-MM-DD
  daysUntil: number; // negative if the date has already passed
}

function mergeEvents(
  birthdays: UpcomingCelebration[],
  anniversaries: UpcomingCelebration[],
  holidays: MonthHoliday[],
): UpcomingEvent[] {
  const events: UpcomingEvent[] = [
    ...birthdays.map((b) => ({
      type: 'birthday' as const,
      title: `${b.name}'s Birthday`,
      date: b.date,
      daysUntil: b.daysUntil,
    })),
    ...anniversaries.map((a) => ({
      type: 'anniversary' as const,
      title: `${a.name}'s Work Anniversary`,
      subtitle: a.years ? `${a.years} year${a.years === 1 ? '' : 's'}` : undefined,
      date: a.date,
      daysUntil: a.daysUntil,
    })),
    ...holidays.map((h) => ({
      type: (h.holiday_type === 'public'
        ? 'holiday-public'
        : h.holiday_type === 'floater'
          ? 'holiday-floater'
          : 'holiday-other') as UpcomingEventType,
      title: h.name,
      subtitle:
        h.holiday_type === 'public'
          ? 'Government Holiday'
          : h.holiday_type === 'floater'
            ? 'Floater Holiday'
            : 'Company Holiday',
      date: h.date,
      daysUntil: h.daysUntil,
    })),
  ];

  return events.sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Get all upcoming events (birthdays, anniversaries, holidays) within
 * `withinDays` of today, merged and sorted soonest-first. Any logged-in
 * ERP user (admin, HR, or staff with admin login) can view this — none of
 * it is sensitive, unlike salary/financial data.
 */
export async function getUpcomingEventsAction(
  withinDays: number = 30,
): Promise<UpcomingEvent[]> {
  const session = await getSession();
  if (!session) return [];

  const [birthdays, anniversaries, holidays] = await Promise.all([
    getUpcomingBirthdays(withinDays),
    getUpcomingAnniversaries(withinDays),
    getUpcomingHolidays(withinDays),
  ]);

  return mergeEvents(birthdays, anniversaries, holidays);
}

/**
 * Get all events (birthdays, anniversaries, holidays) falling within a
 * specific calendar month, regardless of whether they've already passed —
 * merged and sorted by day of month.
 */
export async function getMonthEventsAction(
  year: number,
  month: number,
): Promise<UpcomingEvent[]> {
  const session = await getSession();
  if (!session) return [];

  const [birthdays, anniversaries, holidays] = await Promise.all([
    getBirthdaysInMonth(year, month),
    getAnniversariesInMonth(year, month),
    getHolidaysInMonth(year, month),
  ]);

  return mergeEvents(birthdays, anniversaries, holidays);
}
