/**
 * ONE-TIME fix: approve all currently pending attendance change requests.
 *
 * This bypasses the normal maker-checker flow (lib/erp/admin-approvals.ts),
 * which otherwise requires a second admin/HR user to independently confirm
 * each review before it takes effect. Use only when you've already reviewed
 * the pending list yourself and accept responsibility for approving them
 * without a second reviewer (e.g. to unblock a payroll run).
 *
 * Mirrors the exact approval logic in lib/erp/attendance-change-requests.ts
 * (reviewAttendanceChangeRequest + its per-type handlers) so the resulting
 * attendance/time_logs/leave_balances writes are identical to what clicking
 * "approve" in the app would produce.
 *
 * Usage:
 *   npx tsx scripts/approve-pending-attendance-change-requests.ts                # dry run (default)
 *   npx tsx scripts/approve-pending-attendance-change-requests.ts --yes          # actually apply
 *   npx tsx scripts/approve-pending-attendance-change-requests.ts --yes --reviewer=someone@example.com
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({
  path: path.resolve(process.cwd(), '.env.local'),
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const APPLY = process.argv.includes('--yes');
const reviewerArg = process.argv.find((a) => a.startsWith('--reviewer='));
const REVIEWER_EMAIL = reviewerArg ? reviewerArg.split('=')[1] : 'prahalnathk@gmail.com';
const REVIEW_COMMENTS = 'Approved via one-time payroll fix script (no second reviewer).';

// ─────────────────────────────────────────────────────────────────────────────
// Approval logic — ported 1:1 from lib/erp/attendance-change-requests.ts
// ─────────────────────────────────────────────────────────────────────────────

async function handleStatusChangeApproval(request: any, reviewerId: number): Promise<void> {
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
    const { error } = await supabase.from('attendance').insert({
      employee_id: request.employee_id,
      date: request.request_date,
      status: request.requested_status,
      half_day_period: halfDayPeriod,
      notes: `Created via change request #${request.id}. ${request.reason}`,
      created_by: reviewerId,
    });
    if (error) throw error;
  }

  if (request.clock_out_time) {
    await updateTimeLogClockOut(
      request.employee_id,
      request.request_date,
      request.clock_out_time,
      request.id,
      request.reason,
    );
  }

  if (request.requested_status === 'paid-leave' && request.leave_type) {
    await deductLeaveBalance(request.employee_id, request.request_date, request.leave_type);
  }
}

async function handleRegularisationApproval(
  request: any,
  reviewerId: number,
  reqType: string,
): Promise<void> {
  const date: string = request.request_date;
  const employeeId: number = request.employee_id;

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

  switch (reqType) {
    case 'missed_clock_in':
      await applyMissedClockIn(employeeId, date, request);
      break;
    case 'missed_clock_out':
      await applyMissedClockOut(employeeId, date, request);
      break;
    case 'missed_both':
      await applyMissedBoth(employeeId, date, request);
      break;
    case 'clock_in_correction':
      await applyClockInCorrection(employeeId, date, request);
      break;
    case 'clock_out_correction':
      await applyClockOutCorrection(employeeId, date, request);
      break;
  }
}

async function applyMissedClockIn(employeeId: number, date: string, request: any): Promise<void> {
  if (!request.requested_clock_in_time) return;

  const { data: existingLogs } = await supabase
    .from('time_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .order('clock_in_time', { ascending: false })
    .limit(1);

  const existingLog = existingLogs?.[0];

  if (existingLog) {
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

async function applyMissedClockOut(employeeId: number, date: string, request: any): Promise<void> {
  if (!request.requested_clock_out_time) return;

  const clockOutTime = new Date(request.requested_clock_out_time);

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
    return;
  }

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
}

async function applyMissedBoth(employeeId: number, date: string, request: any): Promise<void> {
  if (!request.requested_clock_in_time || !request.requested_clock_out_time) return;

  const clockInTime = new Date(request.requested_clock_in_time);
  const clockOutTime = new Date(request.requested_clock_out_time);
  const diffMs = clockOutTime.getTime() - clockInTime.getTime();
  const totalHours = Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));

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

async function applyClockInCorrection(employeeId: number, date: string, request: any): Promise<void> {
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

async function applyClockOutCorrection(employeeId: number, date: string, request: any): Promise<void> {
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

  if (logFetchError || !timeLog) return;

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

  if (error) console.error('Failed to update time log during regularization:', error);
}

async function deductLeaveBalance(employeeId: number, requestDate: string, leaveType: string): Promise<void> {
  if (leaveType === 'wfh') return;

  const year = new Date(requestDate).getFullYear();

  const { data: currentBalance, error: balanceFetchError } = await supabase
    .from('leave_balances')
    .select('used_days')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .eq('leave_type', leaveType)
    .single();

  if (balanceFetchError || !currentBalance) return;

  const newUsedDays = Number(currentBalance.used_days) + 1;

  const { error } = await supabase
    .from('leave_balances')
    .update({ used_days: newUsedDays, updated_at: new Date().toISOString() })
    .eq('employee_id', employeeId)
    .eq('year', year)
    .eq('leave_type', leaveType);

  if (error) console.error('Failed to update leave balance:', error);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🚀 Approve pending attendance change requests${APPLY ? '' : ' [DRY RUN — pass --yes to apply]'}`);

  const { data: reviewer, error: reviewerError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', REVIEWER_EMAIL)
    .single();

  if (reviewerError || !reviewer) {
    console.error(`❌ Reviewer user not found for email ${REVIEWER_EMAIL}`, reviewerError);
    process.exit(1);
  }

  if (reviewer.role !== 'admin' && reviewer.role !== 'hr') {
    console.error(`❌ Reviewer ${REVIEWER_EMAIL} has role "${reviewer.role}", not admin/hr. Aborting.`);
    process.exit(1);
  }

  console.log(`👤 Reviewer: ${reviewer.email} (id ${reviewer.id}, role ${reviewer.role})`);

  const { data: pending, error: pendingError } = await supabase
    .from('attendance_change_requests')
    .select('*, employees:employee_id (name, employee_id)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (pendingError) {
    console.error('❌ Error fetching pending requests:', pendingError);
    process.exit(1);
  }

  if (!pending || pending.length === 0) {
    console.log('✅ No pending requests. Nothing to do.');
    return;
  }

  console.log(`\n📋 ${pending.length} pending request(s):`);
  for (const r of pending as any[]) {
    console.log(
      `  #${r.id} | ${r.employees?.employee_id ?? r.employee_id} ${r.employees?.name ?? ''} | ${r.request_date} | ${r.request_type} | ${r.reason}`,
    );
  }

  if (!APPLY) {
    console.log('\n(dry run — re-run with --yes to actually approve these)');
    return;
  }

  let succeeded = 0;
  let failed = 0;

  for (const request of pending as any[]) {
    try {
      const { error: updateError } = await supabase
        .from('attendance_change_requests')
        .update({
          status: 'approved',
          reviewed_by: reviewer.id,
          reviewed_at: new Date().toISOString(),
          review_comments: REVIEW_COMMENTS,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id)
        .eq('status', 'pending'); // guard against a concurrent review

      if (updateError) throw updateError;

      const reqType: string = request.request_type || 'status_change';
      if (reqType === 'status_change') {
        await handleStatusChangeApproval(request, reviewer.id);
      } else {
        await handleRegularisationApproval(request, reviewer.id, reqType);
      }

      console.log(`✅ Approved #${request.id} (${request.employees?.employee_id ?? request.employee_id}, ${request.request_date})`);
      succeeded++;
    } catch (err) {
      console.error(`❌ Failed to approve #${request.id}:`, err);
      failed++;
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log(`   Approved: ${succeeded}`);
  console.log(`   Failed: ${failed}`);
}

main();
