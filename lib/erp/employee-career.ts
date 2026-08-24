/**
 * Database functions for Employee Career & Promotion Management
 *
 * Handles: intern conversion, promotions, salary revisions,
 * designation/department changes, career history retrieval.
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type {
  EmployeeCareerHistory,
  EmployeeCareerHistoryWithNames,
  EmployeeCareerChangeType,
  CareerChangeFormData,
} from '@/types/erp';

// ─────────────────────────────────────────────────────────────────────────────
// READ OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all career history records for a specific employee (newest first)
 */
export async function fetchEmployeeCareerHistory(
  employeeId: number,
): Promise<EmployeeCareerHistory[]> {
  const { data, error } = await supabase
    .from('employee_career_history')
    .select('*')
    .eq('employee_id', employeeId)
    .order('effective_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as EmployeeCareerHistory[];
}

/**
 * Fetch all career history records (admin view) with employee and reviewer names
 */
export async function fetchAllCareerHistory(filters?: {
  change_type?: EmployeeCareerChangeType;
  status?: string;
  employeeId?: number;
}): Promise<EmployeeCareerHistoryWithNames[]> {
  let query = supabase
    .from('employee_career_history')
    .select(
      `
      *,
      employee:employees!employee_id (
        name,
        employee_id
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.change_type) {
    query = query.eq('change_type', filters.change_type);
  }
  if (filters?.employeeId) {
    query = query.eq('employee_id', filters.employeeId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    employee_name: row.employee?.name || 'Unknown',
    employee_display_id: row.employee?.employee_id || '',
    requester_name: null,
    approver_name: null,
  })) as EmployeeCareerHistoryWithNames[];
}

/**
 * Fetch all career changes with status = 'pending_effective'
 * where effective_date <= today — these are ready to be applied
 */
export async function fetchPendingEffectiveChanges(): Promise<
  EmployeeCareerHistoryWithNames[]
> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('employee_career_history')
    .select(
      `
      *,
      employee:employees!employee_id (
        name,
        employee_id
      )
    `,
    )
    .eq('status', 'pending_effective')
    .lte('effective_date', today)
    .order('effective_date', { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    employee_name: row.employee?.name || 'Unknown',
    employee_display_id: row.employee?.employee_id || '',
    requester_name: null,
    approver_name: null,
  })) as EmployeeCareerHistoryWithNames[];
}

/**
 * Get the applicable salary for an employee for a given payroll month.
 * Looks back through career history to find the most recent salary_revision
 * or career change that was applied on or before the last day of the payroll month.
 * Falls back to current employee.monthly_salary if no history found.
 */
export async function getEmployeeSalaryForPayrollPeriod(
  employeeId: number,
  payrollMonth: string, // YYYY-MM
): Promise<{ monthly_salary: number | null; salary_type: string }> {
  // Last day of the payroll month
  const [year, month] = payrollMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

  // Find the most recent applied salary change on or before lastDay
  const { data: history, error: histError } = await supabase
    .from('employee_career_history')
    .select('new_salary, new_salary_type, effective_date, status')
    .eq('employee_id', employeeId)
    .not('new_salary', 'is', null)
    .in('status', ['approved', 'applied'])
    .lte('effective_date', lastDay)
    .order('effective_date', { ascending: false })
    .limit(1);

  if (!histError && history && history.length > 0) {
    return {
      monthly_salary: history[0].new_salary,
      salary_type: history[0].new_salary_type || 'monthly',
    };
  }

  // Fall back to current employee record
  const { data: employee } = await supabase
    .from('employees')
    .select('monthly_salary, salary_type')
    .eq('id', employeeId)
    .single();

  return {
    monthly_salary: employee?.monthly_salary ?? null,
    salary_type: employee?.salary_type ?? 'monthly',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insert a new career history record.
 * If effective_date is today or past → status 'approved', employee updated immediately.
 * If effective_date is in the future → status 'pending_effective', employee NOT updated yet.
 */
export async function insertEmployeeCareerHistory(
  formData: CareerChangeFormData,
  requestedBy: number,
): Promise<EmployeeCareerHistory> {
  const today = new Date().toISOString().split('T')[0];
  const isFuture = formData.effective_date > today;
  const status = isFuture ? 'pending_effective' : 'approved';

  const { data, error } = await supabase
    .from('employee_career_history')
    .insert({
      employee_id: formData.employee_id,
      change_type: formData.change_type,

      previous_employment_type: formData.current_employment_type || null,
      new_employment_type: formData.new_employment_type || null,

      previous_designation: formData.current_designation || null,
      new_designation: formData.new_designation || null,

      previous_department: formData.current_department || null,
      new_department: formData.new_department || null,

      previous_salary_type: formData.current_salary_type || null,
      new_salary_type: formData.new_salary_type || null,

      previous_salary: formData.current_salary ?? null,
      new_salary: formData.new_salary ?? null,

      effective_date: formData.effective_date,
      reason: formData.reason,
      notes: formData.notes || null,

      status,
      requested_by: requestedBy,
      approved_by: isFuture ? null : requestedBy,
      approved_at: isFuture ? null : new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // If not a future date, apply the change immediately
  if (!isFuture) {
    await updateEmployeeCareerDetails(formData.employee_id, formData);
  }

  return data as EmployeeCareerHistory;
}

/**
 * Apply the new values from a career history record to the employees table.
 * Only updates fields that have a new_ value present.
 */
export async function updateEmployeeCareerDetails(
  employeeId: number,
  changes: Pick<
    CareerChangeFormData,
    | 'new_employment_type'
    | 'new_designation'
    | 'new_department'
    | 'new_salary_type'
    | 'new_salary'
  >,
): Promise<void> {
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (changes.new_employment_type) {
    updates.employment_type = changes.new_employment_type;
  }
  if (changes.new_designation) {
    updates.role = changes.new_designation; // employees.role = designation
  }
  if (changes.new_department) {
    updates.department = changes.new_department;
  }
  if (changes.new_salary_type) {
    updates.salary_type = changes.new_salary_type;
  }
  if (changes.new_salary !== undefined && changes.new_salary !== null) {
    updates.monthly_salary = changes.new_salary;
  }

  if (Object.keys(updates).length <= 1) return; // only updated_at, nothing to do

  const { error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', employeeId);

  if (error) throw error;
}

/**
 * Apply a pending_effective career change (Admin clicks "Apply" on/after effective date).
 * Marks history record as 'applied' and updates the employees table.
 */
export async function applyCareerChangeById(
  historyId: number,
  adminUserId: number,
): Promise<void> {
  // Fetch the history record
  const { data: record, error: fetchError } = await supabase
    .from('employee_career_history')
    .select('*')
    .eq('id', historyId)
    .single();

  if (fetchError) throw fetchError;
  if (!record) throw new Error('Career change record not found');
  if (record.status !== 'pending_effective') {
    throw new Error(`Cannot apply a record with status '${record.status}'`);
  }
  if (record.requested_by === adminUserId) {
    throw new Error('You cannot apply/approve a career change you requested yourself');
  }

  // Apply changes to employee
  await updateEmployeeCareerDetails(record.employee_id, {
    new_employment_type: record.new_employment_type,
    new_designation: record.new_designation,
    new_department: record.new_department,
    new_salary_type: record.new_salary_type,
    new_salary: record.new_salary,
  });

  // Mark history record as applied
  const { error: updateError } = await supabase
    .from('employee_career_history')
    .update({
      status: 'applied',
      approved_by: adminUserId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', historyId);

  if (updateError) throw updateError;
}

/**
 * Cancel a pending_effective career change record.
 */
export async function cancelCareerChangeById(historyId: number): Promise<void> {
  const { error } = await supabase
    .from('employee_career_history')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', historyId)
    .in('status', ['pending', 'pending_effective']);

  if (error) throw error;
}

/**
 * Check if an employee has a pending/pending_effective career change of a given type.
 * Used to prevent duplicates.
 */
export async function hasPendingCareerChange(
  employeeId: number,
  changeType?: EmployeeCareerChangeType,
): Promise<boolean> {
  let query = supabase
    .from('employee_career_history')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .in('status', ['pending', 'pending_effective']);

  if (changeType) {
    query = query.eq('change_type', changeType);
  }

  const { count, error } = await query;
  if (error) throw error;
  return (count || 0) > 0;
}
