/**
 * Database functions for Attendance management
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { PayrollAttendanceStatus } from '@/lib/erp/utils';
import type {
  Attendance,
  AttendanceFormData,
  AttendanceSummary,
} from '@/types/erp';

/**
 * Get all attendance records with optional filters
 */
export async function getAllAttendance(filters?: {
  employee_id?: number;
  date?: string;
  month?: string;
}): Promise<Attendance[]> {
  let query = supabase.from('attendance').select('*');

  if (filters?.employee_id) {
    query = query.eq('employee_id', filters.employee_id);
  }

  if (filters?.date) {
    query = query.eq('date', filters.date);
  }

  if (filters?.month) {
    // Filter by month using date range (YYYY-MM format)
    const startDate = `${filters.month}-01`;
    const nextMonth = new Date(filters.month + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().substring(0, 10);
    query = query.gte('date', startDate).lt('date', nextMonthStr);
  }

  query = query.order('date', { ascending: false }).order('employee_id');

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get attendance for a specific employee and date
 */
export async function getAttendance(
  employeeId: number,
  date: string,
): Promise<Attendance | null> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Create attendance record
 */
export async function createAttendance(
  data: AttendanceFormData,
  createdBy: number,
): Promise<Attendance> {
  const { data: attendance, error } = await supabase
    .from('attendance')
    .insert({
      employee_id: data.employee_id,
      date: data.date,
      status: data.status,
      half_day_period: data.status === 'half-day' ? data.half_day_period || null : null,
      overtime_hours: data.overtime_hours || null,
      notes: data.notes || null,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return attendance;
}

/**
 * Update attendance record
 */
export async function updateAttendance(
  employeeId: number,
  date: string,
  data: AttendanceFormData,
): Promise<Attendance> {
  const { data: attendance, error } = await supabase
    .from('attendance')
    .update({
      status: data.status,
      half_day_period: data.status === 'half-day' ? data.half_day_period || null : null,
      overtime_hours:
        data.overtime_hours !== undefined ? data.overtime_hours : null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('employee_id', employeeId)
    .eq('date', date)
    .select()
    .single();

  if (error) throw error;
  return attendance;
}

/**
 * Delete attendance record
 */
export async function deleteAttendance(
  employeeId: number,
  date: string,
): Promise<void> {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('employee_id', employeeId)
    .eq('date', date);

  if (error) throw error;
}

/**
 * Bulk create/update attendance status for many employees across many dates
 * in as few round trips as possible: one fetch to find which (employee,
 * date) pairs already have a record, then one bulk insert for the rest and
 * one bulk update for the ones that exist. Never touches fields other than
 * status/notes on existing rows (leaves overtime_hours etc. as-is).
 */
export async function bulkUpsertAttendance(
  employeeIds: number[],
  dates: string[],
  status: Attendance['status'],
  notes: string | null,
  createdBy: number,
  halfDayPeriod: Attendance['half_day_period'] = null,
): Promise<{ created: number; updated: number }> {
  const { data: existing, error: fetchError } = await supabase
    .from('attendance')
    .select('id, employee_id, date')
    .in('employee_id', employeeIds)
    .in('date', dates);

  if (fetchError) throw fetchError;

  const existingIdByKey = new Map<string, number>();
  (existing || []).forEach((row) => {
    existingIdByKey.set(`${row.employee_id}_${row.date}`, row.id);
  });

  const halfDayPeriodValue = status === 'half-day' ? halfDayPeriod : null;

  const toInsert: Array<{
    employee_id: number;
    date: string;
    status: Attendance['status'];
    half_day_period: Attendance['half_day_period'];
    notes: string | null;
    created_by: number;
  }> = [];
  const toUpdateIds: number[] = [];

  for (const employeeId of employeeIds) {
    for (const date of dates) {
      const key = `${employeeId}_${date}`;
      const existingId = existingIdByKey.get(key);
      if (existingId) {
        toUpdateIds.push(existingId);
      } else {
        toInsert.push({
          employee_id: employeeId,
          date,
          status,
          half_day_period: halfDayPeriodValue,
          notes,
          created_by: createdBy,
        });
      }
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('attendance').insert(toInsert);
    if (error) throw error;
  }

  if (toUpdateIds.length > 0) {
    const { error } = await supabase
      .from('attendance')
      .update({
        status,
        half_day_period: halfDayPeriodValue,
        notes,
        updated_at: new Date().toISOString(),
      })
      .in('id', toUpdateIds);
    if (error) throw error;
  }

  return { created: toInsert.length, updated: toUpdateIds.length };
}

/**
 * Get monthly attendance summary for an employee
 */
export async function getMonthlyAttendanceSummary(
  employeeId: number,
  month: string,
): Promise<AttendanceSummary | null> {
  // Get employee info
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, name')
    .eq('id', employeeId)
    .single();

  if (empError || !employee) return null;

  // Get attendance for the month
  const startDate = `${month}-01`;
  const nextMonth = new Date(month + '-01');
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().substring(0, 10);

  const { data: attendanceRecords, error: attError } = await supabase
    .from('attendance')
    .select('status')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lt('date', nextMonthStr);

  // Calculate summary
  const records = attendanceRecords || [];
  const summary = {
    employee_id: employee.id,
    employee_name: employee.name,
    month,
    total_days: records.length,
    present_days: records.filter((r) => r.status === 'present').length,
    half_days: records.filter((r) => r.status === 'half-day').length,
    paid_leave_days: records.filter((r) => r.status === 'paid-leave').length,
    unpaid_leave_days: records.filter((r) => r.status === 'unpaid-leave')
      .length,
    absent_days: records.filter((r) => r.status === 'absent').length,
    holiday_days: records.filter((r) => r.status === 'holiday').length,
  };

  return summary;
}

/**
 * Attendance for a whole month, for every employee at once, as
 * employee_id -> (YYYY-MM-DD -> status).
 *
 * Payroll needs the per-date status rather than the bare counts that
 * getMonthlyAttendanceSummary returns, so it can tell a working day apart
 * from a weekend clock-in and spot working days with no row at all. Fetched
 * in one query for the whole run instead of once per employee.
 */
export async function getMonthlyAttendanceByEmployeeDate(
  month: string,
): Promise<Map<number, Map<string, PayrollAttendanceStatus>>> {
  const startDate = `${month}-01`;
  const nextMonth = new Date(month + '-01');
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().substring(0, 10);

  const { data, error } = await supabase
    .from('attendance')
    .select('employee_id, date, status')
    .gte('date', startDate)
    .lt('date', nextMonthStr);

  if (error) throw error;

  const byEmployee = new Map<number, Map<string, PayrollAttendanceStatus>>();

  for (const record of data || []) {
    // `date` can come back as a full timestamp depending on the column type;
    // payroll compares against plain YYYY-MM-DD working-day keys.
    const dateKey = String(record.date).substring(0, 10);

    let dates = byEmployee.get(record.employee_id);
    if (!dates) {
      dates = new Map<string, PayrollAttendanceStatus>();
      byEmployee.set(record.employee_id, dates);
    }
    dates.set(dateKey, record.status as PayrollAttendanceStatus);
  }

  return byEmployee;
}

/**
 * Get attendance for today for all active employees
 */
export async function getTodayAttendance(): Promise<
  Array<{
    employee_id: number;
    employee_name: string;
    status: string | null;
  }>
> {
  const today = new Date().toISOString().split('T')[0];

  // Get all active employees except temporary employees
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, name, employment_type')
    .eq('status', 'active')
    .neq('employment_type', 'temporary')
    .order('name');

  if (empError) throw empError;

  // Get today's attendance
  const { data: attendance, error: attError } = await supabase
    .from('attendance')
    .select('employee_id, status')
    .eq('date', today);

  if (attError) throw attError;

  // Combine data
  const attendanceMap = new Map(
    (attendance || []).map((a) => [a.employee_id, a.status]),
  );

  return (employees || []).map((emp) => ({
    employee_id: emp.id,
    employee_name: emp.name,
    status: attendanceMap.get(emp.id) || null,
  }));
}
