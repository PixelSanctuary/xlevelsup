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
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    // Skip public holidays
    const dateStr = date.toISOString().split('T')[0];
    if (holidaySet && holidaySet.has(dateStr)) continue;
    workingDays++;
  }

  return workingDays;
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
  per_day_salary: number;
  gross_salary: number;
}

export function calculatePayroll(
  monthSalary: number,
  presentDays: number,
  halfDays: number,
  paidLeaveDays: number,
  unpaidLeaveDays: number,
  absentDays: number,
  totalWorkingDays: number,
): PayrollCalculation {
  // Calculate per day salary
  const perDaySalary = monthSalary / totalWorkingDays;

  // Calculate payable days
  // Present days + paid leave + (half days * 0.5)
  // Unpaid leave and absences reduce the payable days
  const payableDays = presentDays + paidLeaveDays + halfDays * 0.5;

  // Calculate gross salary
  const grossSalary = perDaySalary * payableDays;

  return {
    total_working_days: totalWorkingDays,
    present_days: presentDays,
    paid_leave_days: paidLeaveDays,
    unpaid_leave_days: unpaidLeaveDays,
    absent_days: absentDays,
    half_days: halfDays,
    payable_days: payableDays,
    per_day_salary: perDaySalary,
    gross_salary: grossSalary,
  };
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

