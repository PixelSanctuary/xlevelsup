/**
 * Database functions for Dashboard statistics
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { DashboardStats } from '@/types/erp';

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7); // YYYY-MM

  // Total active employees except temporary employees
  const { data: employees, error: employeeError } = await supabase
    .from('employees')
    .select('id, employment_type')
    .eq('status', 'active')
    .neq('employment_type', 'temporary');

  if (employeeError) throw employeeError;
  const employeeCount = employees?.length || 0;

  // Today's attendance
  const { data: todayAttendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', today);

  if (attendanceError) throw attendanceError;

  const todayAttendanceRecords = todayAttendance || [];
  const presentCount = todayAttendanceRecords.filter(
    (a) => a.status === 'present' || a.status === 'half-day' || a.status === 'in_progress',
  ).length;

  const attendancePercentage =
    employeeCount > 0 ? (presentCount / employeeCount) * 100 : 0;

  // Current month payroll total
  const { data: payrollRecords, error: payrollError } = await supabase
    .from('payroll')
    .select('*')
    .eq('month', currentMonth);

  if (payrollError) throw payrollError;

  const payrollTotal = (payrollRecords || []).reduce(
    (sum, p) => sum + (p.net_salary || 0),
    0,
  );

  // Current month expenses
  const nextMonth = new Date(currentMonth + '-01');
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().substring(0, 7);

  const { data: expenseRecords, error: expenseError } = await supabase
    .from('expenses')
    .select('*')
    .gte('date', `${currentMonth}-01`)
    .lt('date', `${nextMonthStr}-01`);

  if (expenseError) throw expenseError;

  const expensesTotal = (expenseRecords || []).reduce(
    (sum, e) => sum + (e.amount || 0),
    0,
  );

  // Pending expenses
  const { data: pendingExpensesRecords, error: pendingExpensesError } =
    await supabase.from('expenses').select('*').eq('status', 'pending');

  if (pendingExpensesError) throw pendingExpensesError;

  const pendingExpenses = pendingExpensesRecords || [];
  const pendingExpensesCount = pendingExpenses.length;
  const pendingExpensesTotal = pendingExpenses.reduce(
    (sum, e) => sum + (e.amount || 0),
    0,
  );

  // Unpaid payroll
  const { data: unpaidPayrollRecords, error: unpaidPayrollError } =
    await supabase
      .from('payroll')
      .select('*')
      .in('status', ['draft', 'approved'])
      .eq('month', currentMonth);

  if (unpaidPayrollError) throw unpaidPayrollError;

  const unpaidPayrollCount = unpaidPayrollRecords?.length || 0;

  // Pending leave requests
  const { count: pendingLeaveCount, error: pendingLeaveError } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (pendingLeaveError) throw pendingLeaveError;

  // Pending attendance change requests
  const {
    count: pendingAttendanceChangeCount,
    error: pendingAttendanceChangeError,
  } = await supabase
    .from('attendance_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (pendingAttendanceChangeError) throw pendingAttendanceChangeError;

  return {
    total_active_employees: employeeCount,
    today_attendance_count: presentCount,
    today_attendance_percentage: Math.round(attendancePercentage),
    current_month_payroll_total: payrollTotal,
    current_month_expenses_total: expensesTotal,
    pending_expenses_count: pendingExpensesCount,
    pending_expenses_total: pendingExpensesTotal,
    unpaid_payroll_count: unpaidPayrollCount,
    pending_leave_requests_count: pendingLeaveCount || 0,
    pending_attendance_change_requests_count: pendingAttendanceChangeCount || 0,
  };
}
