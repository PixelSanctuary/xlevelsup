/**
 * Database functions for Payroll management
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { Payroll, PayrollWithEmployee } from '@/types/erp';

/**
 * Get all payroll records with optional filters
 */
export async function getAllPayroll(filters?: {
  month?: string;
  status?: string;
  employee_id?: number;
}): Promise<PayrollWithEmployee[]> {
  let query = supabase.from('payroll').select(`
            *,
            employees!inner(
                name,
                role,
                department
            )
        `);

  if (filters?.month) {
    query = query.eq('month', filters.month);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.employee_id) {
    query = query.eq('employee_id', filters.employee_id);
  }

  query = query.order('month', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  // Transform the nested employee data to flat structure
  return (data || []).map((item: any) => ({
    ...item,
    employee_name: item.employees.name,
    employee_role: item.employees.role,
    employee_department: item.employees.department,
    employees: undefined,
  })) as PayrollWithEmployee[];
}

/**
 * Get payroll by ID
 */
export async function getPayrollById(
  id: number,
): Promise<PayrollWithEmployee | undefined> {
  const { data, error } = await supabase
    .from('payroll')
    .select(
      `
            *,
            employees!inner(
                name,
                role,
                department
            )
        `,
    )
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return undefined;

  // Transform the nested employee data to flat structure
  return {
    ...data,
    employee_name: data.employees.name,
    employee_role: data.employees.role,
    employee_department: data.employees.department,
    employees: undefined,
  } as PayrollWithEmployee;
}

/**
 * Get payroll for specific employee and month
 */
export async function getPayrollByEmployeeMonth(
  employeeId: number,
  month: string,
): Promise<Payroll | undefined> {
  const { data, error } = await supabase
    .from('payroll')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('month', month)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || undefined;
}

/**
 * Create payroll record
 */
export async function createPayroll(
  data: Omit<Payroll, 'id' | 'created_at' | 'updated_at'>,
): Promise<Payroll> {
  const { data: result, error } = await supabase
    .from('payroll')
    .insert({
      employee_id: data.employee_id,
      month: data.month,
      total_working_days: data.total_working_days,
      present_days: data.present_days,
      paid_leave_days: data.paid_leave_days,
      unpaid_leave_days: data.unpaid_leave_days,
      absent_days: data.absent_days,
      half_days: data.half_days,
      payable_days: data.payable_days,
      per_day_salary: data.per_day_salary,
      gross_salary: data.gross_salary,
      bonus: data.bonus || 0,
      deduction: data.deduction || 0,
      net_salary: data.net_salary,
      status: data.status,
      notes: data.notes || null,
      generated_by: data.generated_by || null,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

/**
 * Update payroll adjustments (bonus, deduction, notes)
 */
export async function updatePayrollAdjustments(
  id: number,
  bonus: number,
  deduction: number,
  notes?: string,
): Promise<Payroll> {
  // Get current payroll
  const { data: payroll, error: fetchError } = await supabase
    .from('payroll')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const netSalary = payroll.gross_salary + bonus - deduction;

  const { data, error } = await supabase
    .from('payroll')
    .update({
      bonus,
      deduction,
      net_salary: netSalary,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update payroll status
 */
export async function updatePayrollStatus(
  id: number,
  status: 'draft' | 'approved' | 'paid',
  userId: number,
): Promise<Payroll> {
  let updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'approved') {
    updateData.approved_by = userId;
    updateData.approved_at = new Date().toISOString();
  } else if (status === 'paid') {
    updateData.paid_by = userId;
    updateData.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('payroll')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete payroll record
 */
export async function deletePayroll(id: number): Promise<void> {
  const { error } = await supabase.from('payroll').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Delete all payroll records for a given month (e.g. to regenerate from scratch).
 * Returns the number of records deleted.
 */
export async function deletePayrollByMonth(month: string): Promise<number> {
  const { data, error } = await supabase
    .from('payroll')
    .delete()
    .eq('month', month)
    .select('id');

  if (error) throw error;
  return (data || []).length;
}

/**
 * Get payroll statistics
 */
export async function getPayrollStats(month?: string): Promise<{
  total_records: number;
  total_payable: number;
  draft_count: number;
  approved_count: number;
  paid_count: number;
}> {
  let query = supabase.from('payroll').select('*');

  if (month) {
    query = query.eq('month', month);
  }

  const { data, error } = await query;
  if (error) throw error;

  const records = data || [];

  return {
    total_records: records.length,
    total_payable: records.reduce((sum, r) => sum + (r.net_salary || 0), 0),
    draft_count: records.filter((r) => r.status === 'draft').length,
    approved_count: records.filter((r) => r.status === 'approved').length,
    paid_count: records.filter((r) => r.status === 'paid').length,
  };
}
