/**
 * Attendance Change Request Operations
 * Extended to support clock-in time regularisation (missed_clock_in, missed_both, clock_in_correction)
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type {
  AttendanceChangeRequest,
  AttendanceChangeRequestWithEmployee,
  AttendanceRegularisationType,
  AttendanceRegularisationFormData,
  AttendanceStatus,
  HalfDayPeriod,
} from '@/types/erp';

// ─────────────────────────────────────────────────────────────────────────────
// READ OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all attendance change requests (admin view)
 */
export async function getAllAttendanceChangeRequests(filters?: {
  status?: 'pending' | 'approved' | 'rejected';
  employeeId?: number;
}): Promise<AttendanceChangeRequestWithEmployee[]> {
  let query = supabase
    .from('attendance_change_requests')
    .select(
      `
      *,
      employees:employee_id (
        name,
        email,
        employee_id
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.employeeId) {
    query = query.eq('employee_id', filters.employeeId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((request: any) => ({
    ...request,
    employee_name: request.employees?.name || 'Unknown',
    employee_email: request.employees?.email || '',
    employee_employee_id: request.employees?.employee_id || '',
  }));
}

/**
 * Get employee's own attendance change requests
 */
export async function getEmployeeAttendanceChangeRequests(
  employeeId: number,
): Promise<AttendanceChangeRequest[]> {
  const { data, error } = await supabase
    .from('attendance_change_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get attendance record and time log for a specific employee + date
 * Used by the regularisation form to pre-fill current clock-in/out values
 */
export async function fetchAttendanceByEmployeeAndDate(
  employeeId: number,
  date: string,
): Promise<{
  attendance: any | null;
  timeLog: any | null;
  clockInTime: string | null;
  clockOutTime: string | null;
}> {
  // Fetch attendance record
  const { data: attendance, error: attError } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .maybeSingle();

  if (attError) throw attError;

  // Fetch the most recent time log for that date
  const { data: timeLogs, error: logError } = await supabase
    .from('time_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .order('clock_in_time', { ascending: false })
    .limit(1);

  if (logError) throw logError;

  const timeLog = timeLogs?.[0] || null;

  return {
    attendance,
    timeLog,
    clockInTime: timeLog?.clock_in_time || null,
    clockOutTime: timeLog?.clock_out_time || null,
  };
}

/**
 * Get employee attendance with pending change request info
 */
export async function getEmployeeAttendanceWithRequests(
  employeeId: number,
  startDate?: string,
  endDate?: string,
): Promise<any[]> {
  let query = supabase
    .from('attendance')
    .select(
      `
      *,
      change_requests:attendance_change_requests!attendance_id (
        id,
        status,
        requested_status,
        request_type,
        reason,
        created_at
      )
    `,
    )
    .eq('employee_id', employeeId)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((attendance: any) => ({
    ...attendance,
    has_pending_request:
      attendance.change_requests?.some(
        (req: any) => req.status === 'pending',
      ) || false,
    change_request_id:
      attendance.change_requests?.find((req: any) => req.status === 'pending')
        ?.id || null,
  }));
}

/**
 * Get count of pending attendance change requests
 */
export async function getPendingAttendanceChangeRequestsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('attendance_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
}

/**
 * Get a single attendance change request by id (admin use, e.g. to build a
 * summary before proposing a review decision).
 */
export async function getAttendanceChangeRequestById(
  id: number,
): Promise<AttendanceChangeRequest | null> {
  const { data, error } = await supabase
    .from('attendance_change_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Check if employee has pending request for a specific date (and optionally a specific type).
 * Updated to allow one pending request per type per date.
 */
export async function hasPendingRequestForDate(
  employeeId: number,
  date: string,
  requestType?: AttendanceRegularisationType,
): Promise<boolean> {
  let query = supabase
    .from('attendance_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .eq('request_date', date)
    .eq('status', 'pending');

  if (requestType) {
    query = query.eq('request_type', requestType);
  }

  const { count, error } = await query;

  if (error) throw error;
  return (count || 0) > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE OPERATIONS – LEGACY (status-change / clock-out regularisation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create attendance change request (legacy – used by original status-change form)
 */
export async function createAttendanceChangeRequest(
  employeeId: number,
  requestData: {
    request_date: string;
    current_status?: AttendanceStatus | null;
    requested_status: AttendanceStatus;
    half_day_period?: HalfDayPeriod | null;
    leave_type?: string | null;
    clock_out_time?: string | null;
    reason: string;
    attendance_id?: number | null;
  },
): Promise<AttendanceChangeRequest> {
  const { data, error } = await supabase
    .from('attendance_change_requests')
    .insert({
      employee_id: employeeId,
      request_date: requestData.request_date,
      current_status: requestData.current_status,
      requested_status: requestData.requested_status,
      half_day_period:
        requestData.requested_status === 'half-day' ? requestData.half_day_period : null,
      leave_type: requestData.leave_type,
      clock_out_time: requestData.clock_out_time,
      reason: requestData.reason,
      attendance_id: requestData.attendance_id,
      status: 'pending',
      request_type: requestData.clock_out_time ? 'missed_clock_out' : 'status_change',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE OPERATIONS – NEW (typed regularisation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a typed attendance regularisation request.
 * Handles: missed_clock_in | missed_clock_out | missed_both | clock_in_correction | clock_out_correction
 */
export async function createAttendanceRegularisationRequest(
  employeeId: number,
  formData: AttendanceRegularisationFormData,
): Promise<AttendanceChangeRequest> {
  // For regularisation requests the "requested_status" is always 'present'
  // (we're correcting clock times, not attendance status)
  const { data, error } = await supabase
    .from('attendance_change_requests')
    .insert({
      employee_id: employeeId,
      request_date: formData.request_date,
      requested_status: 'present',
      reason: formData.reason,
      attendance_id: formData.attendance_id ?? null,
      status: 'pending',
      request_type: formData.request_type,
      requested_clock_in_time: formData.requested_clock_in_time ?? null,
      requested_clock_out_time: formData.requested_clock_out_time ?? null,
      current_clock_in_time: formData.current_clock_in_time ?? null,
      current_clock_out_time: formData.current_clock_out_time ?? null,
      employee_note: formData.employee_note ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// APPROVAL / REJECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Review attendance change request (approve/reject).
 * Extended to handle all new request types.
 */
export async function reviewAttendanceChangeRequest(
  requestId: number,
  reviewerId: number,
  status: 'approved' | 'rejected',
  reviewComments?: string,
): Promise<void> {
  // Fetch the request details
  const { data: request, error: fetchError } = await supabase
    .from('attendance_change_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;
  if (!request) throw new Error('Request not found');
  if (request.status !== 'pending') throw new Error('Request has already been reviewed');

  // Update request status
  const { error: updateError } = await supabase
    .from('attendance_change_requests')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_comments: reviewComments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) throw updateError;

  if (status === 'approved') {
    const reqType: AttendanceRegularisationType = request.request_type || 'status_change';

    if (reqType === 'status_change') {
      // ── Legacy flow: update/create attendance record ──────────────────────
      await handleStatusChangeApproval(request, reviewerId);
    } else {
      // ── New regularisation flow: update time logs ─────────────────────────
      await handleRegularisationApproval(request, reviewerId, reqType);
    }
  }
}

/** Handle legacy status-change approval */
async function handleStatusChangeApproval(
  request: any,
  reviewerId: number,
): Promise<void> {
  const halfDayPeriod =
    request.requested_status === 'half-day' ? request.half_day_period ?? null : null;

  if (request.attendance_id) {
    const { error } = await supabase
      .from('attendance')
      .update({
        status: request.requested_status,
        half_day_period: halfDayPeriod,
        notes: `Updated via change request #${request.id}. ${request.reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.attendance_id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('attendance')
      .insert({
        employee_id: request.employee_id,
        date: request.request_date,
        status: request.requested_status,
        half_day_period: halfDayPeriod,
        notes: `Created via change request #${request.id}. ${request.reason}`,
        created_by: reviewerId,
      });
    if (error) throw error;
  }

  // Legacy clock-out time update (HH:MM text column)
  if (request.clock_out_time) {
    await updateTimeLogClockOut(
      request.employee_id,
      request.request_date,
      request.clock_out_time,
      request.id,
      request.reason,
    );
  }

  // Deduct leave balance if paid-leave approved
  if (request.requested_status === 'paid-leave' && request.leave_type) {
    await deductLeaveBalance(request.employee_id, request.request_date, request.leave_type);
  }
}

/** Handle new typed regularisation approval */
async function handleRegularisationApproval(
  request: any,
  reviewerId: number,
  reqType: AttendanceRegularisationType,
): Promise<void> {
  const date: string = request.request_date;
  const employeeId: number = request.employee_id;

  // Ensure there is an attendance record for the date (status = present)
  const { data: existingAtt } = await supabase
    .from('attendance')
    .select('id, status')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .maybeSingle();

  if (!existingAtt) {
    const { error } = await supabase.from('attendance').insert({
      employee_id: employeeId,
      date,
      status: 'present',
      notes: `Auto-created via regularisation request #${request.id}`,
      created_by: reviewerId,
    });
    if (error) throw error;
  } else if (existingAtt.status === 'in_progress') {
    const { error } = await supabase
      .from('attendance')
      .update({
        status: 'present',
        notes: `Auto-completed via regularisation request #${request.id}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingAtt.id);
    if (error) throw error;
  }

  // Now handle time log based on request type
  switch (reqType) {
    case 'missed_clock_in':
      await applyMissedClockIn(employeeId, date, request);
      break;

    case 'missed_clock_out':
      await applyMissedClockOut(employeeId, date, request);
      break;

    case 'missed_both':
      await applyMissedBoth(employeeId, date, request, reviewerId);
      break;

    case 'clock_in_correction':
      await applyClockInCorrection(employeeId, date, request);
      break;

    case 'clock_out_correction':
      await applyClockOutCorrection(employeeId, date, request);
      break;
  }
}

/** missed_clock_in – insert or update time log with clock-in time */
async function applyMissedClockIn(
  employeeId: number,
  date: string,
  request: any,
): Promise<void> {
  if (!request.requested_clock_in_time) return;

  // Check if a time log already exists for the date
  const { data: existingLogs } = await supabase
    .from('time_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .order('clock_in_time', { ascending: false })
    .limit(1);

  const existingLog = existingLogs?.[0];

  if (existingLog) {
    // Update existing log's clock-in time and recalculate hours
    const clockInTime = new Date(request.requested_clock_in_time);
    let totalHours: number | null = null;
    if (existingLog.clock_out_time) {
      const clockOutTime = new Date(existingLog.clock_out_time);
      const diffMs = clockOutTime.getTime() - clockInTime.getTime();
      totalHours = Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));
    }

    const { error } = await supabase
      .from('time_logs')
      .update({
        clock_in_time: clockInTime.toISOString(),
        total_hours: totalHours,
        notes: `Clock-in regularised via request #${request.id}. ${request.reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingLog.id);
    if (error) throw error;
  } else {
    // Insert a new time log with only clock-in (status=active, employee didn't clock out yet)
    const { error } = await supabase.from('time_logs').insert({
      employee_id: employeeId,
      date,
      clock_in_time: new Date(request.requested_clock_in_time).toISOString(),
      status: 'active',
      notes: `Clock-in regularised via request #${request.id}. ${request.reason}`,
    });
    if (error) throw error;
  }
}

/** missed_clock_out – find active time log and set clock-out */
async function applyMissedClockOut(
  employeeId: number,
  date: string,
  request: any,
): Promise<void> {
  if (!request.requested_clock_out_time) return;

  // Try new TIMESTAMPTZ column first; fall back to legacy clock_out_time text
  const clockOutTime = new Date(request.requested_clock_out_time);

  // Find the active time log for that date
  const { data: activeLogs } = await supabase
    .from('time_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .eq('status', 'active')
    .order('clock_in_time', { ascending: false })
    .limit(1);

  const activeLog = activeLogs?.[0];

  if (activeLog) {
    const clockInTime = new Date(
      activeLog.clock_in_time.includes('+') || activeLog.clock_in_time.endsWith('Z')
        ? activeLog.clock_in_time
        : activeLog.clock_in_time + 'Z',
    );
    const diffMs = clockOutTime.getTime() - clockInTime.getTime();
    const totalHours = Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));

    const { error } = await supabase
      .from('time_logs')
      .update({
        clock_out_time: clockOutTime.toISOString(),
        total_hours: totalHours,
        status: 'completed',
        notes: `Clock-out regularised via request #${request.id}. ${request.reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeLog.id);
    if (error) throw error;
  } else {
    // No active log — look for any log on that date to update
    const { data: anyLogs } = await supabase
      .from('time_logs')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', date)
      .order('clock_in_time', { ascending: false })
      .limit(1);

    if (anyLogs?.[0]) {
      const log = anyLogs[0];
      const clockInTime = new Date(
        log.clock_in_time.includes('+') || log.clock_in_time.endsWith('Z')
          ? log.clock_in_time
          : log.clock_in_time + 'Z',
      );
      const diffMs = clockOutTime.getTime() - clockInTime.getTime();
      const totalHours = Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));

      const { error } = await supabase
        .from('time_logs')
        .update({
          clock_out_time: clockOutTime.toISOString(),
          total_hours: totalHours,
          status: 'completed',
          notes: `Clock-out regularised via request #${request.id}. ${request.reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', log.id);
      if (error) throw error;
    }
    // If no time log at all, we skip — the clock-out can't be applied without a clock-in
  }
}

/** missed_both – create a complete time log with both times */
async function applyMissedBoth(
  employeeId: number,
  date: string,
  request: any,
  reviewerId: number,
): Promise<void> {
  if (!request.requested_clock_in_time || !request.requested_clock_out_time) return;

  const clockInTime = new Date(request.requested_clock_in_time);
  const clockOutTime = new Date(request.requested_clock_out_time);
  const diffMs = clockOutTime.getTime() - clockInTime.getTime();
  const totalHours = Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));

  // Check if a time log already exists; if so update it, otherwise insert
  const { data: existingLogs } = await supabase
    .from('time_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .limit(1);

  if (existingLogs?.[0]) {
    const { error } = await supabase
      .from('time_logs')
      .update({
        clock_in_time: clockInTime.toISOString(),
        clock_out_time: clockOutTime.toISOString(),
        total_hours: totalHours,
        status: 'completed',
        notes: `Full-day regularised via request #${request.id}. ${request.reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingLogs[0].id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('time_logs').insert({
      employee_id: employeeId,
      date,
      clock_in_time: clockInTime.toISOString(),
      clock_out_time: clockOutTime.toISOString(),
      total_hours: totalHours,
      status: 'completed',
      notes: `Full-day regularised via request #${request.id}. ${request.reason}`,
    });
    if (error) throw error;
  }
}

/** clock_in_correction – update existing time log's clock-in time */
async function applyClockInCorrection(
  employeeId: number,
  date: string,
  request: any,
): Promise<void> {
  if (!request.requested_clock_in_time) return;

  const { data: logs } = await supabase
    .from('time_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .order('clock_in_time', { ascending: false })
    .limit(1);

  const log = logs?.[0];
  if (!log) return;

  const clockInTime = new Date(request.requested_clock_in_time);
  let totalHours: number | null = log.total_hours;

  if (log.clock_out_time) {
    const clockOutTime = new Date(log.clock_out_time);
    const diffMs = clockOutTime.getTime() - clockInTime.getTime();
    totalHours = Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));
  }

  const { error } = await supabase
    .from('time_logs')
    .update({
      clock_in_time: clockInTime.toISOString(),
      total_hours: totalHours,
      notes: `Clock-in corrected via request #${request.id}. ${request.reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', log.id);
  if (error) throw error;
}

/** clock_out_correction – update existing time log's clock-out time */
async function applyClockOutCorrection(
  employeeId: number,
  date: string,
  request: any,
): Promise<void> {
  if (!request.requested_clock_out_time) return;

  const { data: logs } = await supabase
    .from('time_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .order('clock_in_time', { ascending: false })
    .limit(1);

  const log = logs?.[0];
  if (!log) return;

  const clockOutTime = new Date(request.requested_clock_out_time);
  let totalHours: number | null = log.total_hours;

  if (log.clock_in_time) {
    const clockInTime = new Date(
      log.clock_in_time.includes('+') || log.clock_in_time.endsWith('Z')
        ? log.clock_in_time
        : log.clock_in_time + 'Z',
    );
    const diffMs = clockOutTime.getTime() - clockInTime.getTime();
    totalHours = Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));
  }

  const { error } = await supabase
    .from('time_logs')
    .update({
      clock_out_time: clockOutTime.toISOString(),
      total_hours: totalHours,
      status: 'completed',
      notes: `Clock-out corrected via request #${request.id}. ${request.reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', log.id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Legacy HH:MM clock-out update for status-change requests */
async function updateTimeLogClockOut(
  employeeId: number,
  date: string,
  clockOutTimeStr: string,
  requestId: number,
  reason: string,
): Promise<void> {
  const { data: timeLog, error: logFetchError } = await supabase
    .from('time_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (logFetchError) {
    console.error('Failed to fetch active time log for regularization:', logFetchError);
    return;
  }
  if (!timeLog) return;

  let clockInTime: Date;
  if (timeLog.clock_in_time.includes('+') || timeLog.clock_in_time.endsWith('Z')) {
    clockInTime = new Date(timeLog.clock_in_time);
  } else {
    clockInTime = new Date(timeLog.clock_in_time + 'Z');
  }

  const clockOutTime = new Date(`${date}T${clockOutTimeStr}`);
  const diffMs = clockOutTime.getTime() - clockInTime.getTime();
  const totalHours = Math.max(0, diffMs / (1000 * 60 * 60));

  const { error } = await supabase
    .from('time_logs')
    .update({
      clock_out_time: clockOutTime.toISOString(),
      total_hours: parseFloat(totalHours.toFixed(2)),
      status: 'completed',
      notes: `Regularized via change request #${requestId}. ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', timeLog.id);

  if (error) {
    console.error('Failed to update time log during regularization:', error);
  }
}

/** Deduct leave balance after paid-leave approval */
async function deductLeaveBalance(
  employeeId: number,
  requestDate: string,
  leaveType: string,
): Promise<void> {
  // WFH is a note on attendance, not a tracked leave balance — never create
  // or touch a leave_balances row for it.
  if (leaveType === 'wfh') return;

  const year = new Date(requestDate).getFullYear();

  const { data: currentBalance, error: balanceFetchError } = await supabase
    .from('leave_balances')
    .select('used_days')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .eq('leave_type', leaveType)
    .single();

  if (balanceFetchError) {
    console.error('Failed to fetch leave balance:', balanceFetchError);
    return;
  }
  if (!currentBalance) return;

  const newUsedDays = Number(currentBalance.used_days) + 1;

  const { error } = await supabase
    .from('leave_balances')
    .update({
      used_days: newUsedDays,
      updated_at: new Date().toISOString(),
    })
    .eq('employee_id', employeeId)
    .eq('year', year)
    .eq('leave_type', leaveType);

  if (error) {
    console.error('Failed to update leave balance:', error);
  }
}
