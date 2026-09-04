'use server';

import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import {
  getAllPayroll,
  getPayrollById,
  getPayrollByEmployeeMonth,
  createPayroll,
  updatePayrollAdjustments,
  updatePayrollStatus,
  deletePayroll,
  deletePayrollByMonth,
} from '@/lib/erp/payroll';
import { getAllEmployees } from '@/lib/erp/employees';
import { getMonthlyAttendanceByEmployeeDate } from '@/lib/erp/attendance';
import { getHolidayDateSetInRange } from '@/lib/erp/holidays';
import {
  getWorkingDayDatesInMonth,
  calculatePayroll,
  getMonthDateRange,
  type PayrollAttendanceStatus,
} from '@/lib/erp/utils';
import { revalidatePath } from 'next/cache';
import type { PayrollWithEmployee } from '@/types/erp';

export interface PayrollActionResult {
  success: boolean;
  error?: string;
  payroll?: any;
}

/**
 * Get all payroll records
 */
export async function getPayrollAction(filters?: {
  month?: string;
  status?: string;
  employee_id?: number;
}): Promise<PayrollWithEmployee[]> {
  try {
    await requireRole(['admin', 'hr']);
    return await getAllPayroll(filters);
  } catch (error) {
    console.error('Get payroll error:', error);
    return [];
  }
}

/**
 * Generate payroll for a specific month
 */
export async function generatePayrollAction(
  formData: FormData,
): Promise<PayrollActionResult> {
  try {
    const session = await requireRole(['admin', 'hr']);

    const month = formData.get('month') as string;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return { success: false, error: 'Invalid month format' };
    }

    // Get all active employees
    const employees = await getAllEmployees({ status: 'active' });

    if (employees.length === 0) {
      return { success: false, error: 'No active employees found' };
    }

    const [year, monthNum] = month.split('-').map(Number);

    // Public holidays are not working days: counting them would understate
    // per-day salary and dock anyone who correctly did not work that day.
    const { startDate, endDate } = getMonthDateRange(month);
    const holidaySet = await getHolidayDateSetInRange(startDate, endDate);
    const workingDayDates = getWorkingDayDatesInMonth(
      year,
      monthNum,
      holidaySet,
    );

    // One query for the whole run, rather than one per employee.
    const attendanceByEmployee = await getMonthlyAttendanceByEmployeeDate(month);

    let generatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const employee of employees) {
      // Check if payroll already exists
      const existing = await getPayrollByEmployeeMonth(employee.id, month);
      if (existing) {
        skippedCount++;
        continue;
      }

      // No monthly salary configured — hourly freelancers, who are paid
      // through the hourly flow rather than monthly payroll, and anyone whose
      // pay hasn't been set up yet. A zero row can't be approved or paid, so
      // it would only be noise on the payroll screen.
      if (!employee.monthly_salary) {
        skippedCount++;
        continue;
      }

      const attendanceByDate =
        attendanceByEmployee.get(employee.id) ||
        new Map<string, PayrollAttendanceStatus>();

      // Calculate payroll
      const calculation = calculatePayroll(
        employee.monthly_salary || 0,
        workingDayDates,
        attendanceByDate,
        { from: employee.joining_date, to: employee.end_date },
      );

      // Not employed for a single working day of this month — someone hired
      // after it, or who left before it. No payslip is owed, and generating a
      // zero row would just be noise on the screen.
      if (calculation.not_employed_days === calculation.total_working_days) {
        skippedCount++;
        continue;
      }

      try {
        await createPayroll({
          employee_id: employee.id,
          month,
          total_working_days: calculation.total_working_days,
          present_days: calculation.present_days,
          paid_leave_days: calculation.paid_leave_days,
          unpaid_leave_days: calculation.unpaid_leave_days,
          absent_days: calculation.absent_days,
          half_days: calculation.half_days,
          payable_days: calculation.payable_days,
          per_day_salary: calculation.per_day_salary,
          gross_salary: calculation.gross_salary,
          bonus: 0,
          deduction: 0,
          // gross_salary is the contracted monthly pay; net is what's left
          // after loss of pay for unpaid days. The two differ whenever
          // payable_days < total_working_days.
          net_salary: calculation.net_salary,
          status: 'draft',
          notes: null,
          generated_by: session.userId,
          generated_at: new Date().toISOString(),
          approved_by: null,
          approved_at: null,
          paid_by: null,
          paid_at: null,
        });
        generatedCount++;
      } catch (error) {
        errors.push(`Failed for ${employee.name}: ${error}`);
      }
    }

    revalidatePath('/erp/payroll');

    return {
      success: true,
      payroll: {
        generated: generatedCount,
        skipped: skippedCount,
        errors,
      },
    };
  } catch (error) {
    console.error('Generate payroll error:', error);
    return { success: false, error: 'Failed to generate payroll' };
  }
}

/**
 * Update payroll adjustments
 */
export async function updatePayrollAdjustmentsAction(
  id: number,
  formData: FormData,
): Promise<PayrollActionResult> {
  try {
    await requireRole(['admin', 'hr']);

    const bonus = parseFloat(formData.get('bonus') as string) || 0;
    const deduction = parseFloat(formData.get('deduction') as string) || 0;
    const notes = formData.get('notes') as string;

    const payroll = await updatePayrollAdjustments(id, bonus, deduction, notes);

    revalidatePath('/erp/payroll');
    return { success: true, payroll };
  } catch (error) {
    console.error('Update payroll adjustments error:', error);
    return { success: false, error: 'Failed to update payroll' };
  }
}

/**
 * Update payroll status
 */
export async function updatePayrollStatusAction(
  id: number,
  status: 'draft' | 'approved' | 'paid',
): Promise<PayrollActionResult> {
  try {
    const session = await requireRole(['admin', 'hr']);

    if (status === 'approved' || status === 'paid') {
      const existing = await getPayrollById(id);
      if (!existing) {
        return { success: false, error: 'Payroll record not found' };
      }
      if (existing.generated_by === session.userId) {
        return { success: false, error: 'You cannot approve/mark-paid a payroll run you generated yourself' };
      }
    }

    const payroll = await updatePayrollStatus(id, status, session.userId);

    revalidatePath('/erp/payroll');
    return { success: true, payroll };
  } catch (error) {
    console.error('Update payroll status error:', error);
    return { success: false, error: 'Failed to update payroll status' };
  }
}

/**
 * Delete payroll
 */
export async function deletePayrollAction(
  id: number,
): Promise<PayrollActionResult> {
  try {
    await requireRole(['admin', 'hr']);
    await deletePayroll(id);
    revalidatePath('/erp/payroll');
    return { success: true };
  } catch (error) {
    console.error('Delete payroll error:', error);
    return { success: false, error: 'Failed to delete payroll' };
  }
}

/**
 * Delete all payroll records for a month (so it can be regenerated from scratch)
 */
export async function deletePayrollForMonthAction(
  month: string,
): Promise<PayrollActionResult> {
  try {
    await requireRole(['admin', 'hr']);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return { success: false, error: 'Invalid month format' };
    }

    const deletedCount = await deletePayrollByMonth(month);

    revalidatePath('/erp/payroll');
    return { success: true, payroll: { deletedCount } };
  } catch (error) {
    console.error('Delete payroll for month error:', error);
    return { success: false, error: 'Failed to delete payroll for month' };
  }
}
