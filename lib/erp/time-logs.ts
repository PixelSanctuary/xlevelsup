/**
 * Database functions for Time Logs (Clock In/Out) management
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { TimeLog, TimeLogSummary } from '@/types/erp';

/**
 * Ensure an attendance record exists for this employee/date, marking it
 * 'in_progress'. Only inserts when no record exists yet — never overwrites
 * an existing status (e.g. one an admin already set to half-day/leave/etc).
 * Clocking in only ever wrote to time_logs; nothing else creates the
 * attendance row, so a day with an open session but no attendance record
 * would show as blank on the employee's attendance calendar.
 */
async function ensureAttendanceOnClockIn(
  employeeId: number,
  date: string,
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('attendance')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .maybeSingle();

  if (fetchError) {
    console.error('Failed to check attendance record before clock-in:', fetchError);
    return;
  }
  if (existing) return;

  const { error: insertError } = await supabase.from('attendance').insert({
    employee_id: employeeId,
    date,
    status: 'in_progress',
    notes: 'Auto-created from clock-in',
  });

  if (insertError) {
    console.error('Failed to auto-create attendance record:', insertError);
  }
}

/**
 * On clock-out, upgrade the day's attendance record to 'present'. If no
 * record exists at all (shouldn't normally happen — clock-in already
 * creates one), create it as 'present' directly. If a record exists but
 * was set to something other than the clock-in-created 'in_progress'
 * (e.g. an admin already marked the day half-day/leave/absent), leave it
 * untouched — clocking out never overrides a manually-set status.
 */
async function ensureAttendanceOnClockOut(
  employeeId: number,
  date: string,
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('attendance')
    .select('id, status')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .maybeSingle();

  if (fetchError) {
    console.error('Failed to check attendance record before clock-out:', fetchError);
    return;
  }

  if (!existing) {
    const { error: insertError } = await supabase.from('attendance').insert({
      employee_id: employeeId,
      date,
      status: 'present',
      notes: 'Auto-created from clock-out',
    });
    if (insertError) {
      console.error('Failed to auto-create attendance record:', insertError);
    }
    return;
  }

  if (existing.status !== 'in_progress') return;

  const { error: updateError } = await supabase
    .from('attendance')
    .update({ status: 'present', notes: 'Auto-completed from clock-out' })
    .eq('id', existing.id);

  if (updateError) {
    console.error('Failed to auto-complete attendance record:', updateError);
  }
}

/**
 * Get active time log session for employee today
 */
export async function getActiveTimeLog(
  employeeId: number,
): Promise<TimeLog | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('time_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .eq('status', 'active')
    .order('clock_in_time', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Get all time logs for employee for a specific date
 */
export async function getTimeLogsByDate(
  employeeId: number,
  date?: string,
): Promise<TimeLog[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('time_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', targetDate)
    .order('clock_in_time', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Check if employee has any missed clock-outs from previous days
 * (i.e. time logs with status 'active' and date < today that don't have pending/approved change requests)
 */
export async function getMissedClockOut(
  employeeId: number,
): Promise<TimeLog | null> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all active sessions from previous days
    const { data: activeLogs, error: logsError } = await supabase
      .from('time_logs')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'active')
      .lt('date', today)
      .order('date', { ascending: false });

    if (logsError) throw logsError;
    if (!activeLogs || activeLogs.length === 0) return null;

    // For each active log, check if there is a pending or approved attendance change request
    for (const log of activeLogs) {
      const { data: requests, error: reqError } = await supabase
        .from('attendance_change_requests')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('request_date', log.date)
        .in('status', ['pending', 'approved'])
        .limit(1);

      if (reqError) throw reqError;

      // If no pending or approved change request exists, this is an unregularized missed clock-out
      if (!requests || requests.length === 0) {
        return log;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching missed clock out:', error);
    return null;
  }
}

/**
 * Get time log summary for employee today
 */
export async function getTimeLogSummary(
  employeeId: number,
): Promise<TimeLogSummary> {
  const timeLogs = await getTimeLogsByDate(employeeId);

  const activeSession = timeLogs.find((log) => log.status === 'active') || null;
  const completedSessions = timeLogs.filter(
    (log) => log.status === 'completed',
  );

  // Calculate total completed hours
  const completedHours = completedSessions.reduce(
    (sum, log) => sum + (log.total_hours || 0),
    0,
  );

  // Get any unregularized missed clock-out from previous days
  const missedClockOut = await getMissedClockOut(employeeId);

  // Don't calculate current session hours on server side to avoid hydration mismatch
  // Client will calculate this dynamically
  return {
    total_hours_today: completedHours,
    is_clocked_in: !!activeSession,
    active_session: activeSession,
    completed_sessions: completedSessions,
    missed_clock_out: missedClockOut,
  };
}

/**
 * Clock in - create new time log entry
 */
export async function clockIn(
  employeeId: number,
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  },
): Promise<TimeLog> {
  // Check if already clocked in
  const activeLog = await getActiveTimeLog(employeeId);
  if (activeLog) {
    throw new Error('You are already clocked in. Please clock out first.');
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('time_logs')
    .insert({
      employee_id: employeeId,
      date: today,
      clock_in_time: now.toISOString(),
      status: 'active',
      clock_in_latitude: location?.latitude || null,
      clock_in_longitude: location?.longitude || null,
      clock_in_location_accuracy: location?.accuracy || null,
    })
    .select()
    .single();

  if (error) throw error;

  await ensureAttendanceOnClockIn(employeeId, today);

  return data;
}

/**
 * Clock out - complete the active time log entry
 */
export async function clockOut(
  employeeId: number,
  notes?: string,
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  },
): Promise<TimeLog> {
  // Get active session
  const activeLog = await getActiveTimeLog(employeeId);
  if (!activeLog) {
    throw new Error('No active clock-in session found.');
  }

  const now = new Date();

  // Parse clock_in_time - handle both with and without timezone
  let clockInTime: Date;
  const clockInTimeStr = activeLog.clock_in_time;

  if (clockInTimeStr.includes('+') || clockInTimeStr.endsWith('Z')) {
    // Already has timezone info
    clockInTime = new Date(clockInTimeStr);
  } else {
    // No timezone, assume UTC
    clockInTime = new Date(clockInTimeStr + 'Z');
  }

  // Validate the date
  if (isNaN(clockInTime.getTime())) {
    throw new Error('Invalid clock in time format');
  }

  // Calculate total hours
  const diffMs = now.getTime() - clockInTime.getTime();
  const totalHours = Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours, ensure positive

  const { data, error } = await supabase
    .from('time_logs')
    .update({
      clock_out_time: now.toISOString(),
      total_hours: parseFloat(totalHours.toFixed(2)),
      status: 'completed',
      notes: notes || null,
      clock_out_latitude: location?.latitude || null,
      clock_out_longitude: location?.longitude || null,
      clock_out_location_accuracy: location?.accuracy || null,
      updated_at: now.toISOString(),
    })
    .eq('id', activeLog.id)
    .select()
    .single();

  if (error) throw error;

  await ensureAttendanceOnClockOut(employeeId, activeLog.date);

  return data;
}

/**
 * Get time logs for date range
 */
export async function getTimeLogsByRange(
  employeeId: number,
  startDate: string,
  endDate: string,
): Promise<TimeLog[]> {
  const { data, error } = await supabase
    .from('time_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('clock_in_time', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all time logs for all employees (admin view)
 */
export async function getAllTimeLogs(filters?: {
  date?: string;
  month?: string;
  employee_id?: number;
  status?: 'active' | 'completed';
}): Promise<any[]> {
  let query = supabase
    .from('time_logs')
    .select(
      `
      *,
      employee:employees!employee_id(id, employee_id, name, department, employment_type)
    `,
    )
    .order('clock_in_time', { ascending: false });

  if (filters?.date) {
    query = query.eq('date', filters.date);
  }

  if (filters?.month) {
    const startDate = `${filters.month}-01`;
    const nextMonth = new Date(filters.month + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().substring(0, 10);
    query = query.gte('date', startDate).lt('date', nextMonthStr);
  }

  if (filters?.employee_id) {
    query = query.eq('employee_id', filters.employee_id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Exclude temporary employees by default
  return (data || []).filter(
    (log: any) => log.employee?.employment_type !== 'temporary'
  );
}

/**
 * Calculate total working hours for employee for a month
 */
export async function getMonthlyWorkingHours(
  employeeId: number,
  year: number,
  month: number,
): Promise<number> {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const timeLogs = await getTimeLogsByRange(employeeId, startDate, endDate);

  const totalHours = timeLogs.reduce(
    (sum, log) => sum + (log.total_hours || 0),
    0,
  );

  return parseFloat(totalHours.toFixed(2));
}
