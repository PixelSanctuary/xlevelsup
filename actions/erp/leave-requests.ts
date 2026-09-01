'use server';

/**
 * Server actions for Leave Requests
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { LeaveBalance, LeaveRequestFormData } from '@/types/erp';
import {
  createLeaveRequest,
  updateLeaveRequest,
  cancelLeaveRequest,
  getLeaveRequestById,
  reviewLeaveRequest,
  calculateLeaveDays,
  calculateLeaveDaysWithHolidays,
  getWfhDaysCountInMonth,
  getEmployeeLeaveBalance,
} from '@/lib/erp/leave-requests';
import { getEmployeeSession } from '@/lib/erp/employee-portal-auth';
import { requireRole } from '@/lib/auth';

/**
 * Verify the caller is authenticated as this exact employee and is not a
 * freelancer (who is restricted to the Attendance screen). Leave requests
 * must never be creatable/editable/cancelable via a direct action call that
 * bypasses the page-level redirect for freelancers, or by one employee
 * spoofing another employee's id.
 */
async function assertOwnLeaveAccess(employeeId: number): Promise<string | null> {
  const session = await getEmployeeSession();

  if (!session) {
    return 'Not authenticated. Please log in again.';
  }
  if (session.id !== employeeId) {
    return 'You are not authorized to modify this leave request.';
  }
  if (session.employment_type === 'freelancer') {
    return 'Leave requests are not available for freelancer accounts.';
  }

  return null;
}

// Validation schema
const leaveRequestSchema = z.object({
  leave_type: z.enum([
    'sick',
    'casual',
    'floater',
    'earned',
    'unpaid',
    'maternity',
    'paternity',
    'other',
    'wfh',
  ]),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  is_half_day: z.boolean().optional().default(false),
  half_day_period: z.enum(['first_half', 'second_half']).nullable().optional(),
});

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  review_comments: z.string().optional(),
});

/**
 * Create leave request action (for employees)
 */
export async function createLeaveRequestAction(
  employeeId: number,
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const authError = await assertOwnLeaveAccess(employeeId);
    if (authError) {
      return { success: false, error: authError };
    }

    const data: LeaveRequestFormData = {
      leave_type: formData.get('leave_type') as any,
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      reason: formData.get('reason') as string,
      is_half_day: formData.get('is_half_day') === 'true',
      half_day_period: (formData.get('half_day_period') as 'first_half' | 'second_half' | null) || null,
    };

    // Validate
    const validated = leaveRequestSchema.parse(data);

    // Validate date range
    const startDate = new Date(validated.start_date);
    const endDate = new Date(validated.end_date);
    if (endDate < startDate) {
      return {
        success: false,
        error: 'End date must be after or equal to start date',
      };
    }

    if (validated.is_half_day) {
      if (validated.start_date !== validated.end_date) {
        return {
          success: false,
          error: 'Half-day leave must be for a single day.',
        };
      }
      if (!validated.half_day_period) {
        return {
          success: false,
          error: 'Please select which half of the day (first half or second half).',
        };
      }
    }

    const requestedDays = validated.is_half_day
      ? (await calculateLeaveDaysWithHolidays(validated.start_date, validated.start_date)) > 0 ? 0.5 : 0
      : await calculateLeaveDaysWithHolidays(validated.start_date, validated.end_date);
    if (requestedDays === 0) {
      return {
        success: false,
        error: validated.is_half_day
          ? 'The selected day is a weekend or public holiday.'
          : 'The requested period must contain at least one working day (weekends and public holidays are excluded).',
      };
    }

    // WFH specific validation
    if (validated.leave_type === 'wfh') {
      const startMonth = validated.start_date.substring(0, 7); // YYYY-MM

      if (requestedDays > 2) {
        return {
          success: false,
          error: 'You cannot request more than 2 Work From Home days in a single request.',
        };
      }

      const currentWfhDays = await getWfhDaysCountInMonth(employeeId, startMonth);
      if (currentWfhDays + requestedDays > 2) {
        return {
          success: false,
          error: `You can only apply for a maximum of 2 Work From Home days per month. You currently have ${currentWfhDays} WFH days approved/pending in ${startMonth}.`,
        };
      }
    }

    // Create leave request
    await createLeaveRequest(employeeId, validated);

    revalidatePath('/employee/leave');
    return { success: true };
  } catch (error) {
    console.error('Create leave request error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to create leave request' };
  }
}

/**
 * Update leave request action (for employees)
 */
export async function updateLeaveRequestAction(
  leaveRequestId: number,
  employeeId: number,
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const authError = await assertOwnLeaveAccess(employeeId);
    if (authError) {
      return { success: false, error: authError };
    }

    const data: LeaveRequestFormData = {
      leave_type: formData.get('leave_type') as any,
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      reason: formData.get('reason') as string,
      is_half_day: formData.get('is_half_day') === 'true',
      half_day_period: (formData.get('half_day_period') as 'first_half' | 'second_half' | null) || null,
    };

    // Validate
    const validated = leaveRequestSchema.parse(data);

    // Validate date range
    const startDate = new Date(validated.start_date);
    const endDate = new Date(validated.end_date);
    if (endDate < startDate) {
      return {
        success: false,
        error: 'End date must be after or equal to start date',
      };
    }

    if (validated.is_half_day) {
      if (validated.start_date !== validated.end_date) {
        return {
          success: false,
          error: 'Half-day leave must be for a single day.',
        };
      }
      if (!validated.half_day_period) {
        return {
          success: false,
          error: 'Please select which half of the day (first half or second half).',
        };
      }
    }

    const requestedDays = validated.is_half_day
      ? (await calculateLeaveDaysWithHolidays(validated.start_date, validated.start_date)) > 0 ? 0.5 : 0
      : await calculateLeaveDaysWithHolidays(validated.start_date, validated.end_date);
    if (requestedDays === 0) {
      return {
        success: false,
        error: validated.is_half_day
          ? 'The selected day is a weekend or public holiday.'
          : 'The requested period must contain at least one working day (weekends and public holidays are excluded).',
      };
    }

    // WFH specific validation
    if (validated.leave_type === 'wfh') {
      const startMonth = validated.start_date.substring(0, 7); // YYYY-MM

      if (requestedDays > 2) {
        return {
          success: false,
          error: 'You cannot request more than 2 Work From Home days in a single request.',
        };
      }

      const currentWfhDays = await getWfhDaysCountInMonth(employeeId, startMonth, leaveRequestId);
      if (currentWfhDays + requestedDays > 2) {
        return {
          success: false,
          error: `You can only apply for a maximum of 2 Work From Home days per month. You currently have ${currentWfhDays} WFH days approved/pending in ${startMonth} (excluding this request).`,
        };
      }
    }

    // Update leave request
    await updateLeaveRequest(leaveRequestId, employeeId, validated);

    revalidatePath('/employee/leave');
    return { success: true };
  } catch (error) {
    console.error('Update leave request error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to update leave request' };
  }
}

/**
 * Cancel leave request action (for employees)
 */
export async function cancelLeaveRequestAction(
  leaveRequestId: number,
  employeeId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const authError = await assertOwnLeaveAccess(employeeId);
    if (authError) {
      return { success: false, error: authError };
    }

    await cancelLeaveRequest(leaveRequestId, employeeId);

    revalidatePath('/employee/leave');
    return { success: true };
  } catch (error) {
    console.error('Cancel leave request error:', error);
    return { success: false, error: 'Failed to cancel leave request' };
  }
}

/**
 * Get an employee's leave balances (for admin/HR use, e.g. attendance page)
 */
export async function getEmployeeLeaveBalanceAction(
  employeeId: number,
  year?: number,
): Promise<LeaveBalance[]> {
  try {
    await requireRole(['admin', 'hr']);
    return await getEmployeeLeaveBalance(employeeId, year);
  } catch (error) {
    console.error('Get employee leave balance error:', error);
    return [];
  }
}

/**
 * Review (approve/reject) an employee's leave request. The reviewer
 * identity is always the verified session, never a client-supplied id.
 */
export async function reviewLeaveRequestAction(
  leaveRequestId: number,
  status: 'approved' | 'rejected',
  reviewComments?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireRole(['admin', 'hr']);

    const data = {
      status,
      review_comments: reviewComments || undefined,
    };

    // Validate
    const validated = reviewSchema.parse(data);

    const leaveRequest = await getLeaveRequestById(leaveRequestId);
    if (!leaveRequest) {
      return { success: false, error: 'Leave request not found' };
    }
    if (leaveRequest.status !== 'pending') {
      return { success: false, error: 'This leave request has already been reviewed' };
    }

    await reviewLeaveRequest(
      leaveRequestId,
      session.userId,
      validated.status,
      validated.review_comments,
    );

    revalidatePath('/erp/leave-requests');
    revalidatePath('/employee/leave');

    return { success: true };
  } catch (error) {
    console.error('Review leave request error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to review leave request' };
  }
}
