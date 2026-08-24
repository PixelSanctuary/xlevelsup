'use server';

/**
 * Server actions for admin/HR company holiday management.
 */

import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import {
  getHolidaysForYear,
  createHoliday,
  updateHoliday,
  setHolidayActive,
  deleteHoliday,
} from '@/lib/erp/holidays';
import { revalidatePath } from 'next/cache';
import type { CompanyHoliday } from '@/lib/erp/holidays';

const holidaySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  holiday_type: z.enum(['public', 'floater', 'optional', 'company']),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

export interface HolidayActionResult {
  success: boolean;
  error?: string;
  holiday?: CompanyHoliday;
}

/**
 * Get all holidays for a year, including archived ones (admin view).
 */
export async function getHolidaysForYearAction(
  year: number,
): Promise<CompanyHoliday[]> {
  try {
    await requireRole(['admin', 'hr']);
    return await getHolidaysForYear(year, { includeInactive: true });
  } catch (error) {
    console.error('Get holidays error:', error);
    return [];
  }
}

export async function createHolidayAction(
  data: z.infer<typeof holidaySchema>,
): Promise<HolidayActionResult> {
  try {
    await requireRole(['admin', 'hr']);
    const validated = holidaySchema.parse(data);
    const holiday = await createHoliday(validated);
    revalidatePath('/erp/holidays');
    revalidatePath('/employee/holidays');
    return { success: true, holiday };
  } catch (error) {
    console.error('Create holiday error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create holiday' };
  }
}

export async function updateHolidayAction(
  id: number,
  data: z.infer<typeof holidaySchema>,
): Promise<HolidayActionResult> {
  try {
    await requireRole(['admin', 'hr']);
    const validated = holidaySchema.parse(data);
    const holiday = await updateHoliday(id, validated);
    revalidatePath('/erp/holidays');
    revalidatePath('/employee/holidays');
    return { success: true, holiday };
  } catch (error) {
    console.error('Update holiday error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update holiday' };
  }
}

export async function setHolidayActiveAction(
  id: number,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['admin', 'hr']);
    await setHolidayActive(id, isActive);
    revalidatePath('/erp/holidays');
    revalidatePath('/employee/holidays');
    return { success: true };
  } catch (error) {
    console.error('Archive/reactivate holiday error:', error);
    return { success: false, error: 'Failed to update holiday status' };
  }
}

/**
 * Permanently delete a holiday. Admin-only (stricter than the other
 * holiday actions) — prefer setHolidayActiveAction for normal removal.
 */
export async function deleteHolidayAction(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['admin']);
    await deleteHoliday(id);
    revalidatePath('/erp/holidays');
    revalidatePath('/employee/holidays');
    return { success: true };
  } catch (error) {
    console.error('Delete holiday error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete holiday' };
  }
}
