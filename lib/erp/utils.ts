/**
 * Date and payroll calculation helpers for ERP system
 */

/**
 * Get total working days in a month (excluding weekends and optionally public holidays).
 * @param year       - Year (e.g., 2026)
 * @param month      - Month (1-12)
 * @param holidaySet - Optional set of YYYY-MM-DD holiday dates to also exclude
 * @returns Number of working days
 */
export function getWorkingDaysInMonth(
  year: number,
  month: number,
  holidaySet?: Set<string>,
): number {
  return getWorkingDayDatesInMonth(year, month, holidaySet).length;
}

/**
 * The actual YYYY-MM-DD dates that count as working days in a month
 * (weekdays, minus any public holidays passed in).
 *
 * Payroll needs the dates themselves and not just the count, so it can line
 * attendance rows up against them: a clock-in on a Saturday is not a payable
 * day, and a working day with no attendance row at all still has to be
 * accounted for rather than silently dropped.
 */
export function getWorkingDayDatesInMonth(
  year: number,
  month: number,
  holidaySet?: Set<string>,
): string[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    // Skip public holidays
    const dateStr = formatLocalDate(date);
    if (holidaySet && holidaySet.has(dateStr)) continue;
    dates.push(dateStr);
  }

  return dates;
}

/**
 * Format a Date as YYYY-MM-DD from its *local* calendar fields.
 *
 * Not interchangeable with formatDate() below, which goes through
 * toISOString() and so converts to UTC first. For a Date built from local
 * parts (`new Date(y, m - 1, d)`) on a server running ahead of UTC — IST is
 * +5:30 — that conversion shifts the answer back a day, which would quietly
 * mis-match the holiday dates and attendance dates compared here.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * "Today" in IST (Asia/Kolkata) as { year, month, day }, month/day 1-indexed.
 * The server's runtime timezone isn't guaranteed to be IST, so this must be
 * used (not `new Date().toISOString()`, which is UTC) anywhere "today"
 * needs to match what an India-based user considers today — e.g. matching
 * a birthday/anniversary date or today's festival.
 */
export function getTodayIST(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get month name from YYYY-MM string
 */
export function getMonthName(monthString: string): string {
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Calculate payroll based on attendance
 */
export interface PayrollCalculation {
  total_working_days: number;
  present_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  absent_days: number;
  half_days: number;
  payable_days: number;
  lop_days: number;
  /** Working days the employee wasn't employed for (joined late / left early). */
  not_employed_days: number;
  per_day_salary: number;
  /** The employee's contracted monthly salary, before any attendance loss. */
  gross_salary: number;
  /** Loss-of-pay for unpaid days: per_day_salary * lop_days. */
  lop_deduction: number;
  /** gross_salary - lop_deduction (+ bonus - deduction, applied later). */
  net_salary: number;
}

/** Attendance statuses payroll knows how to price. */
export type PayrollAttendanceStatus =
  | 'present'
  | 'absent'
  | 'half-day'
  | 'paid-leave'
  | 'unpaid-leave'
  | 'holiday'
  | 'in_progress';

/** Round a money amount to paise, so stored totals don't drift on float error. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Price one month of attendance against an employee's contracted salary.
 *
 * Driven by the month's working-day *dates* rather than a raw count of
 * attendance rows, which is what keeps two things honest:
 *
 *  - Payable days can never exceed working days. Only dates in
 *    `workingDayDates` are ever walked, so a weekend or public-holiday
 *    clock-in cannot push someone above their monthly salary (it used to:
 *    22 or 23 payable days in a 21-day month). Extra weekend work is paid
 *    through `bonus`, not by inflating the day count.
 *  - A working day with no attendance row at all is treated as worked.
 *    Attendance logging has gaps, and a missing row is far more likely to be
 *    a logging failure than an unrecorded absence — so it must not silently
 *    dock pay. Only an explicit 'absent' or 'unpaid-leave' row causes loss
 *    of pay.
 *
 * `gross_salary` is the contracted monthly salary as configured on the
 * employee. Attendance loss is *not* folded into it — it comes out as an
 * explicit `lop_deduction` on the way to `net_salary` — so the payslip shows
 * what was promised and what was actually paid as two separate numbers.
 */
export function calculatePayroll(
  monthSalary: number,
  workingDayDates: string[],
  attendanceByDate: Map<string, PayrollAttendanceStatus>,
  employment?: { from?: string | null; to?: string | null },
): PayrollCalculation {
  const totalWorkingDays = workingDayDates.length;

  let payableDays = 0;
  let presentDays = 0;
  let halfDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let absentDays = 0;
  let notEmployedDays = 0;

  for (const date of workingDayDates) {
    // Days outside the employment window are not payable, and — unlike a
    // missing attendance row — must never be assumed worked. Without this a
    // mid-month joiner (or anyone hired after the payroll month) would be
    // paid a full salary for time they weren't employed. Both bounds are
    // YYYY-MM-DD, so a lexicographic compare is a date compare.
    if (
      (employment?.from && date < employment.from) ||
      (employment?.to && date > employment.to)
    ) {
      notEmployedDays++;
      continue;
    }

    const status = attendanceByDate.get(date);

    switch (status) {
      case 'paid-leave':
        paidLeaveDays++;
        payableDays += 1;
        break;
      case 'half-day':
        halfDays++;
        payableDays += 0.5;
        break;
      case 'unpaid-leave':
        unpaidLeaveDays++;
        break;
      case 'absent':
        absentDays++;
        break;
      // 'present', 'in_progress' (clocked in, not yet out), 'holiday' logged
      // against a working day, and — per the rule above — no row at all.
      default:
        presentDays++;
        payableDays += 1;
        break;
    }
  }

  const perDaySalary = totalWorkingDays > 0 ? monthSalary / totalWorkingDays : 0;
  const lopDays = Math.max(0, totalWorkingDays - payableDays);
  const lopDeduction = roundMoney(perDaySalary * lopDays);
  const grossSalary = roundMoney(monthSalary);

  return {
    total_working_days: totalWorkingDays,
    present_days: presentDays,
    paid_leave_days: paidLeaveDays,
    unpaid_leave_days: unpaidLeaveDays,
    absent_days: absentDays,
    half_days: halfDays,
    payable_days: payableDays,
    lop_days: lopDays,
    not_employed_days: notEmployedDays,
    per_day_salary: roundMoney(perDaySalary),
    gross_salary: grossSalary,
    lop_deduction: lopDeduction,
    net_salary: roundMoney(grossSalary - lopDeduction),
  };
}

/**
 * Recompute net pay from a stored payroll row.
 *
 * The payroll table has no lop_deduction column, so loss of pay is derived
 * back out of the day counts that *are* stored. Anything that edits bonus or
 * deduction after generation has to go through here — recomputing net as a
 * plain `gross + bonus - deduction` would drop the attendance loss entirely
 * and pay an absent employee their full salary.
 */
export function computeNetSalary(row: {
  total_working_days: number;
  payable_days: number;
  per_day_salary: number;
  gross_salary: number;
  bonus?: number | null;
  deduction?: number | null;
}): { lop_days: number; lop_deduction: number; net_salary: number } {
  const lopDays = Math.max(0, row.total_working_days - row.payable_days);
  const lopDeduction = roundMoney(row.per_day_salary * lopDays);
  const netSalary = roundMoney(
    row.gross_salary - lopDeduction + (row.bonus || 0) - (row.deduction || 0),
  );

  return { lop_days: lopDays, lop_deduction: lopDeduction, net_salary: netSalary };
}

/**
 * Format currency (Indian Rupees)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get date range for a specific month
 */
export function getMonthDateRange(monthString: string): {
  startDate: string;
  endDate: string;
} {
  const [year, month] = monthString.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

/**
 * Format decimal hours into a readable string showing hours and/or minutes.
 * If less than 1 hour, shows only minutes (e.g., "45m" or "45 mins").
 * Otherwise, shows hours and minutes (e.g., "8h 30m" or "8 hrs 30 mins").
 *
 * @param hours - The duration in decimal hours (e.g., 8.5)
 * @param short - Whether to use compact format (e.g., "8h 30m" vs "8 hrs 30 mins")
 */
export function formatDuration(hours: number, short = true): string {
  if (hours <= 0 || isNaN(hours)) {
    return short ? '0m' : '0 mins';
  }

  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (short) {
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  } else {
    if (h === 0) return `${m} min${m !== 1 ? 's' : ''}`;
    if (m === 0) return `${h} hr${h !== 1 ? 's' : ''}`;
    return `${h} hr${h !== 1 ? 's' : ''} ${m} min${m !== 1 ? 's' : ''}`;
  }
}

