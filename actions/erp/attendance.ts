'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireRole, requireAuth } from '@/lib/auth';
import {
  getAllAttendance,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  bulkUpsertAttendance,
  getMonthlyAttendanceSummary,
  getTodayAttendance,
} from '@/lib/erp/attendance';
import type { Attendance, AttendanceSummary } from '@/types/erp';

const ATTENDANCE_STATUSES = [
  'present',
  'absent',
  'half-day',
  'paid-leave',
  'unpaid-leave',
  'holiday',
] as const;

const HALF_DAY_PERIODS = ['first_half', 'second_half'] as const;

const attendanceSchema = z
  .object({
    employee_id: z.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(ATTENDANCE_STATUSES),
    half_day_period: z.enum(HALF_DAY_PERIODS).nullable().optional(),
    overtime_hours: z.number().min(0).max(24).optional().nullable(),
    notes: z.string().optional(),
  })
  .refine((data) => data.status !== 'half-day' || !!data.half_day_period, {
    message: 'Select which half of the day for a half-day status',
    path: ['half_day_period'],
  });

const bulkAttendanceSchema = z
  .object({
    employee_ids: z.array(z.number().int().positive()).min(1, 'Select at least one employee'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(ATTENDANCE_STATUSES),
    half_day_period: z.enum(HALF_DAY_PERIODS).nullable().optional(),
    notes: z.string().nullable().optional(),
    skip_weekends: z.boolean().optional().default(true),
  })
  .refine((data) => data.status !== 'half-day' || !!data.half_day_period, {
    message: 'Select which half of the day for a half-day status',
    path: ['half_day_period'],
  });

export interface AttendanceActionResult {
  success: boolean;
  error?: string;
  attendance?: Attendance;
}

/**
 * Get attendance records
 */
export async function getAttendanceAction(filters?: {
  employee_id?: number;
  date?: string;
  month?: string;
}): Promise<Attendance[]> {
  try {
    await requireAuth();
    return await getAllAttendance(filters);
  } catch (error) {
    console.error('Get attendance error:', error);
    return [];
  }
}

/**
 * Get today's attendance
 */
export async function getTodayAttendanceAction() {
  try {
    await requireAuth();
    return await getTodayAttendance();
  } catch (error) {
    console.error('Get today attendance error:', error);
    return [];
  }
}

/**
 * Create or update an attendance record.
 */
export async function saveAttendanceAction(
  formData: FormData,
): Promise<AttendanceActionResult> {
  try {
    const session = await requireRole(['admin', 'hr']);

    const overtimeValue = formData.get('overtime_hours') as string;
    const rawData = {
      employee_id: parseInt(formData.get('employee_id') as string),
      date: formData.get('date') as string,
      status: formData.get('status') as string,
      half_day_period: (formData.get('half_day_period') as string) || null,
      overtime_hours: overtimeValue ? parseFloat(overtimeValue) : null,
      notes: (formData.get('notes') as string) || undefined,
    };

    const validatedData = attendanceSchema.parse(rawData);

    const existing = await getAttendance(validatedData.employee_id, validatedData.date);
    const attendance = existing
      ? await updateAttendance(validatedData.employee_id, validatedData.date, validatedData)
      : await createAttendance(validatedData, session.userId);

    revalidatePath('/erp/attendance');

    return { success: true, attendance };
  } catch (error) {
    console.error('Save attendance error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to save attendance' };
  }
}

export interface BulkAttendanceActionResult {
  success: boolean;
  error?: string;
  employeeCount?: number;
  dateCount?: number;
}

/**
 * Apply a bulk attendance status change for many employees across a date
 * range (e.g. mark a team present/absent/on-holiday for a week).
 */
export async function bulkUpdateAttendanceAction(input: {
  employeeIds: number[];
  startDate: string;
  endDate: string;
  status: Attendance['status'];
  halfDayPeriod?: Attendance['half_day_period'];
  notes?: string | null;
  skipWeekends?: boolean;
}): Promise<BulkAttendanceActionResult> {
  try {
    const session = await requireRole(['admin', 'hr']);

    const validated = bulkAttendanceSchema.parse({
      employee_ids: input.employeeIds,
      start_date: input.startDate,
      end_date: input.endDate,
      status: input.status,
      half_day_period: input.halfDayPeriod || null,
      notes: input.notes,
      skip_weekends: input.skipWeekends,
    });

    if (validated.end_date < validated.start_date) {
      return { success: false, error: 'End date must be on or after the start date' };
    }

    // Build the list of applicable dates in range
    const dates: string[] = [];
    const cursor = new Date(`${validated.start_date}T00:00:00`);
    const end = new Date(`${validated.end_date}T00:00:00`);
    while (cursor <= end) {
      const dayOfWeek = cursor.getDay();
      if (!(validated.skip_weekends && (dayOfWeek === 0 || dayOfWeek === 6))) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, '0');
        const d = String(cursor.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (dates.length === 0) {
      return {
        success: false,
        error: 'No applicable dates in the selected range (all weekends?)',
      };
    }

    await bulkUpsertAttendance(
      validated.employee_ids,
      dates,
      validated.status,
      validated.notes || null,
      session.userId,
      validated.half_day_period || null,
    );

    revalidatePath('/erp/attendance');

    return {
      success: true,
      employeeCount: validated.employee_ids.length,
      dateCount: dates.length,
    };
  } catch (error) {
    console.error('Bulk update attendance error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to bulk update attendance' };
  }
}

/**
 * Delete an attendance record.
 */
export async function deleteAttendanceAction(
  employeeId: number,
  date: string,
): Promise<AttendanceActionResult> {
  try {
    await requireRole(['admin', 'hr']);

    await deleteAttendance(employeeId, date);

    revalidatePath('/erp/attendance');

    return { success: true };
  } catch (error) {
    console.error('Delete attendance error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete attendance' };
  }
}

/**
 * Get monthly attendance summary
 */
export async function getMonthlyAttendanceSummaryAction(
  employeeId: number,
  month: string,
): Promise<AttendanceSummary | null> {
  try {
    await requireAuth();
    return await getMonthlyAttendanceSummary(employeeId, month);
  } catch (error) {
    console.error('Get attendance summary error:', error);
    return null;
  }
}
