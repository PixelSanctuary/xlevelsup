/**
 * Server Actions for Attendance Change Requests & Regularisation
 */

'use server';

import { z } from 'zod';
import {
  createAttendanceChangeRequest,
  createAttendanceRegularisationRequest,
  reviewAttendanceChangeRequest,
  hasPendingRequestForDate,
  fetchAttendanceByEmployeeAndDate,
} from '@/lib/erp/attendance-change-requests';
import type { AttendanceStatus, AttendanceRegularisationType } from '@/types/erp';

// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────────

/** Legacy status-change request schema */
const attendanceChangeRequestSchema = z
  .object({
    request_date: z.string().min(1, 'Date is required'),
    requested_status: z.enum([
      'present',
      'absent',
      'half-day',
      'paid-leave',
      'unpaid-leave',
      'holiday',
    ]),
    half_day_period: z.enum(['first_half', 'second_half']).nullable().optional(),
    leave_type: z
      .enum([
        'sick',
        'casual',
        'floater',
        'earned',
        'unpaid',
        'maternity',
        'paternity',
        'other',
      ])
      .nullable()
      .optional(),
    clock_out_time: z
      .string()
      .regex(/^([0-9]{2}):([0-9]{2})(:[0-9]{2})?$/, 'Invalid clock-out time format')
      .nullable()
      .optional(),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
    current_status: z
      .enum([
        'present',
        'absent',
        'half-day',
        'paid-leave',
        'unpaid-leave',
        'holiday',
      ])
      .nullable()
      .optional(),
    attendance_id: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.requested_status === 'paid-leave') {
        return data.leave_type !== null && data.leave_type !== undefined;
      }
      return true;
    },
    {
      message: 'Leave type is required when requesting paid leave',
      path: ['leave_type'],
    },
  )
  .refine((data) => data.requested_status !== 'half-day' || !!data.half_day_period, {
    message: 'Select which half of the day when requesting half-day status',
    path: ['half_day_period'],
  });

/** New typed regularisation request schema */
const regularisationSchema = z
  .object({
    request_date: z.string().min(1, 'Date is required'),
    request_type: z.enum([
      'missed_clock_in',
      'missed_clock_out',
      'missed_both',
      'clock_in_correction',
      'clock_out_correction',
    ]),
    requested_clock_in_time: z.string().nullable().optional(),
    requested_clock_out_time: z.string().nullable().optional(),
    current_clock_in_time: z.string().nullable().optional(),
    current_clock_out_time: z.string().nullable().optional(),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
    employee_note: z.string().nullable().optional(),
    attendance_id: z.number().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const needsClockIn = ['missed_clock_in', 'missed_both', 'clock_in_correction'];
    const needsClockOut = ['missed_clock_out', 'missed_both', 'clock_out_correction'];

    if (needsClockIn.includes(data.request_type) && !data.requested_clock_in_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Requested clock-in time is required for this request type',
        path: ['requested_clock_in_time'],
      });
    }

    if (needsClockOut.includes(data.request_type) && !data.requested_clock_out_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Requested clock-out time is required for this request type',
        path: ['requested_clock_out_time'],
      });
    }

    // For missed_both: clock-out must be after clock-in
    if (
      data.request_type === 'missed_both' &&
      data.requested_clock_in_time &&
      data.requested_clock_out_time
    ) {
      const inTime = new Date(data.requested_clock_in_time).getTime();
      const outTime = new Date(data.requested_clock_out_time).getTime();
      if (outTime <= inTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Clock-out time must be after clock-in time',
          path: ['requested_clock_out_time'],
        });
      }
    }

    // For clock_out_correction / missed_clock_out: validate clock-out is after clock-in if both present
    if (
      ['clock_out_correction', 'missed_clock_out'].includes(data.request_type) &&
      data.requested_clock_out_time &&
      data.current_clock_in_time
    ) {
      const inTime = new Date(data.current_clock_in_time).getTime();
      const outTime = new Date(data.requested_clock_out_time).getTime();
      if (outTime <= inTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Requested clock-out time must be after the existing clock-in time',
          path: ['requested_clock_out_time'],
        });
      }
    }

    // For clock_in_correction: validate clock-in is before clock-out if both present
    if (
      ['clock_in_correction', 'missed_clock_in'].includes(data.request_type) &&
      data.requested_clock_in_time &&
      data.current_clock_out_time
    ) {
      const inTime = new Date(data.requested_clock_in_time).getTime();
      const outTime = new Date(data.current_clock_out_time).getTime();
      if (inTime >= outTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Requested clock-in time must be before the existing clock-out time',
          path: ['requested_clock_in_time'],
        });
      }
    }
  });

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  review_comments: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create attendance change request action (employee – legacy status-change form)
 */
export async function createAttendanceChangeRequestAction(
  employeeId: number,
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const rawData = {
      request_date: formData.get('request_date') as string,
      requested_status: formData.get('requested_status') as string,
      half_day_period: (formData.get('half_day_period') as string) || null,
      leave_type: (formData.get('leave_type') as string) || null,
      clock_out_time: (formData.get('clock_out_time') as string) || null,
      reason: formData.get('reason') as string,
      current_status: (formData.get('current_status') as string) || null,
      attendance_id: formData.get('attendance_id')
        ? parseInt(formData.get('attendance_id') as string)
        : null,
    };

    const validated = attendanceChangeRequestSchema.parse(rawData);

    // Check for pending request for this date (any type)
    const hasPending = await hasPendingRequestForDate(employeeId, validated.request_date);
    if (hasPending) {
      return {
        success: false,
        error: 'You already have a pending request for this date',
      };
    }

    await createAttendanceChangeRequest(employeeId, {
      request_date: validated.request_date,
      requested_status: validated.requested_status as AttendanceStatus,
      half_day_period: validated.half_day_period,
      leave_type: validated.leave_type,
      clock_out_time: validated.clock_out_time,
      reason: validated.reason,
      current_status: validated.current_status as AttendanceStatus | null,
      attendance_id: validated.attendance_id,
    });

    return { success: true };
  } catch (error) {
    console.error('Create attendance change request error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to create request' };
  }
}

/**
 * Create attendance regularisation request action (employee – new typed form)
 * Supports: missed_clock_in | missed_clock_out | missed_both | clock_in_correction | clock_out_correction
 */
export async function createAttendanceRegularisationRequestAction(
  employeeId: number,
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const rawData = {
      request_date: formData.get('request_date') as string,
      request_type: formData.get('request_type') as string,
      requested_clock_in_time: (formData.get('requested_clock_in_time') as string) || null,
      requested_clock_out_time: (formData.get('requested_clock_out_time') as string) || null,
      current_clock_in_time: (formData.get('current_clock_in_time') as string) || null,
      current_clock_out_time: (formData.get('current_clock_out_time') as string) || null,
      reason: formData.get('reason') as string,
      employee_note: (formData.get('employee_note') as string) || null,
      attendance_id: formData.get('attendance_id')
        ? parseInt(formData.get('attendance_id') as string)
        : null,
    };

    const validated = regularisationSchema.parse(rawData);

    // Validate: date must not be in the future
    const today = new Date().toISOString().split('T')[0];
    if (validated.request_date >= today) {
      return { success: false, error: 'Cannot raise a regularisation request for today or a future date' };
    }

    // Check for pending request for this date and same request type
    const hasPending = await hasPendingRequestForDate(
      employeeId,
      validated.request_date,
      validated.request_type as AttendanceRegularisationType,
    );
    if (hasPending) {
      return {
        success: false,
        error: `You already have a pending ${validated.request_type.replace(/_/g, ' ')} request for this date`,
      };
    }

    await createAttendanceRegularisationRequest(employeeId, {
      request_date: validated.request_date,
      request_type: validated.request_type as AttendanceRegularisationType,
      requested_clock_in_time: validated.requested_clock_in_time,
      requested_clock_out_time: validated.requested_clock_out_time,
      current_clock_in_time: validated.current_clock_in_time,
      current_clock_out_time: validated.current_clock_out_time,
      reason: validated.reason,
      employee_note: validated.employee_note,
      attendance_id: validated.attendance_id,
    });

    return { success: true };
  } catch (error) {
    console.error('Create regularisation request error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to submit regularisation request' };
  }
}

/**
 * Fetch attendance and time log info for a specific date (for pre-filling form)
 */
export async function getAttendanceForRegularisationDateAction(
  employeeId: number,
  date: string,
): Promise<{
  success: boolean;
  error?: string;
  clockInTime?: string | null;
  clockOutTime?: string | null;
  attendanceId?: number | null;
  attendanceStatus?: string | null;
}> {
  try {
    const result = await fetchAttendanceByEmployeeAndDate(employeeId, date);
    return {
      success: true,
      clockInTime: result.clockInTime,
      clockOutTime: result.clockOutTime,
      attendanceId: result.attendance?.id ?? null,
      attendanceStatus: result.attendance?.status ?? null,
    };
  } catch (error) {
    console.error('Get attendance for date error:', error);
    return { success: false, error: 'Failed to fetch attendance data for this date' };
  }
}

/**
 * Review attendance change request action (admin)
 */
export async function reviewAttendanceChangeRequestAction(
  requestId: number,
  reviewerId: number,
  status: 'approved' | 'rejected',
  reviewComments?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const rawData = {
      status,
      review_comments: reviewComments || undefined,
    };

    const validated = reviewSchema.parse(rawData);

    await reviewAttendanceChangeRequest(
      requestId,
      reviewerId,
      validated.status,
      validated.review_comments,
    );

    return { success: true };
  } catch (error) {
    console.error('Review attendance change request error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to review request' };
  }
}
