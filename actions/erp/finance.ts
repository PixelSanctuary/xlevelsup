'use server';

import { z } from 'zod';
import { requireAuth, requireRole } from '@/lib/auth';
import {
  getLedgerEntries,
  insertLedgerEntry,
  updateLedgerEntryById,
  deleteLedgerEntryById,
  approveLedgerEntry,
  getFinanceSummary,
  getEmployeeIdFromUserId,
} from '@/lib/erp/finance';
import { uploadReceiptFile, getReceiptSignedUrl } from '@/lib/erp/receipts';
import { revalidatePath } from 'next/cache';
import type { FinancialLedgerEntry } from '@/types/erp';

const ledgerEntrySchema = z.object({
  transaction_type: z.enum([
    'income',
    'expense',
    'investment',
    'payroll',
    'reimbursement',
    'adjustment',
    'refund',
    'transfer',
  ]),
  direction: z.enum(['inflow', 'outflow']),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  payment_mode: z.string().nullable().optional(),
  payment_status: z.enum(['pending', 'completed', 'failed', 'cancelled', 'refunded']).nullable().optional(),
  client_name: z.string().nullable().optional(),
  project_name: z.string().nullable().optional(),
  employee_id: z.number().nullable().optional(),
  payer_name: z.string().nullable().optional(),
  payee_name: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  invoice_number: z.string().nullable().optional(),
  reference_number: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  approval_status: z.enum(['pending', 'approved', 'rejected', 'paid']).nullable().optional(),
  account_id: z.number().nullable().optional(),
  receipt_path: z.string().nullable().optional(),
});

export interface FinanceActionResult {
  success: boolean;
  error?: string;
  entry?: FinancialLedgerEntry;
}

/**
 * Get all ledger entries
 */
export async function getLedgerEntriesAction(filters?: {
  type?: string;
  direction?: string;
  category?: string;
  payment_status?: string;
  approval_status?: string;
  month?: string;
  client?: string;
  employeeId?: number;
}): Promise<FinancialLedgerEntry[]> {
  try {
    const session = await requireAuth();
    return await getLedgerEntries(session.userId, session.role, filters);
  } catch (error) {
    console.error('Get ledger entries error:', error);
    return [];
  }
}

/**
 * Get financial summary
 */
export async function getFinanceSummaryAction(filters?: {
  month?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<any> {
  try {
    const session = await requireAuth();
    return await getFinanceSummary(session.userId, session.role, filters);
  } catch (error) {
    console.error('Get finance summary error:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      clientIncome: 0,
      investments: 0,
      pendingReimbursements: 0,
      payrollOutflow: 0,
      thisMonthIncome: 0,
      thisMonthExpenses: 0,
    };
  }
}

/**
 * Create a ledger entry
 */
export async function createLedgerEntryAction(
  formData: FormData,
): Promise<FinanceActionResult> {
  try {
    const session = await requireAuth();

    const rawAmount = parseFloat(formData.get('amount') as string);
    const rawEmployeeId = formData.get('employee_id')
      ? parseInt(formData.get('employee_id') as string, 10)
      : null;

    const rawData: any = {
      transaction_type: formData.get('transaction_type') as any,
      direction: formData.get('direction') as any,
      category: formData.get('category') as string,
      amount: rawAmount,
      transaction_date: formData.get('transaction_date') as string,
      payment_mode: (formData.get('payment_mode') as string) || null,
      payment_status: (formData.get('payment_status') as any) || 'completed',
      client_name: (formData.get('client_name') as string) || null,
      project_name: (formData.get('project_name') as string) || null,
      employee_id: rawEmployeeId,
      payer_name: (formData.get('payer_name') as string) || null,
      payee_name: (formData.get('payee_name') as string) || null,
      vendor_name: (formData.get('vendor_name') as string) || null,
      invoice_number: (formData.get('invoice_number') as string) || null,
      reference_number: (formData.get('reference_number') as string) || null,
      description: (formData.get('description') as string) || null,
      notes: (formData.get('notes') as string) || null,
      approval_status: (formData.get('approval_status') as any) || 'approved',
      account_id: formData.get('account_id') ? parseInt(formData.get('account_id') as string, 10) : null,
      receipt_path: null as string | null,
    };

    // Role restrictions
    if (session.role === 'employee') {
      const employeeId = await getEmployeeIdFromUserId(session.userId);
      if (!employeeId) {
        return { success: false, error: 'Your employee profile is not linked to this user' };
      }
      // Employees can only request reimbursements (which are outflow, pending)
      rawData.transaction_type = 'reimbursement';
      rawData.direction = 'outflow';
      rawData.employee_id = employeeId;
      rawData.payment_status = 'pending';
      rawData.approval_status = 'pending';
    }

    const receiptFile = formData.get('receipt');
    if (receiptFile instanceof File && receiptFile.size > 0) {
      rawData.receipt_path = await uploadReceiptFile(receiptFile);
    }

    const validatedData = ledgerEntrySchema.parse(rawData);
    const entry = await insertLedgerEntry(validatedData, session.userId);

    revalidatePath('/erp/finances');
    return { success: true, entry };
  } catch (error) {
    console.error('Create ledger entry error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create ledger entry' };
  }
}

/**
 * Update a ledger entry
 */
export async function updateLedgerEntryAction(
  id: number,
  formData: FormData,
): Promise<FinanceActionResult> {
  try {
    const session = await requireRole(['admin', 'hr']);

    const rawAmount = parseFloat(formData.get('amount') as string);
    const rawEmployeeId = formData.get('employee_id')
      ? parseInt(formData.get('employee_id') as string, 10)
      : null;

    const rawData: any = {
      transaction_type: formData.get('transaction_type') as any,
      direction: formData.get('direction') as any,
      category: formData.get('category') as string,
      amount: rawAmount,
      transaction_date: formData.get('transaction_date') as string,
      payment_mode: (formData.get('payment_mode') as string) || null,
      payment_status: (formData.get('payment_status') as any) || 'completed',
      client_name: (formData.get('client_name') as string) || null,
      project_name: (formData.get('project_name') as string) || null,
      employee_id: rawEmployeeId,
      payer_name: (formData.get('payer_name') as string) || null,
      payee_name: (formData.get('payee_name') as string) || null,
      vendor_name: (formData.get('vendor_name') as string) || null,
      invoice_number: (formData.get('invoice_number') as string) || null,
      reference_number: (formData.get('reference_number') as string) || null,
      description: (formData.get('description') as string) || null,
      notes: (formData.get('notes') as string) || null,
      approval_status: (formData.get('approval_status') as any) || 'approved',
      account_id: formData.get('account_id') ? parseInt(formData.get('account_id') as string, 10) : null,
    };

    const validatedData = ledgerEntrySchema.parse(rawData);
    const entry = await updateLedgerEntryById(id, validatedData, session.userId);

    revalidatePath('/erp/finances');
    return { success: true, entry };
  } catch (error) {
    console.error('Update ledger entry error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to update ledger entry' };
  }
}

/**
 * Delete a ledger entry
 */
export async function deleteLedgerEntryAction(
  id: number,
): Promise<FinanceActionResult> {
  try {
    await requireRole(['admin']);
    await deleteLedgerEntryById(id);
    revalidatePath('/erp/finances');
    return { success: true };
  } catch (error) {
    console.error('Delete ledger entry error:', error);
    return { success: false, error: 'Failed to delete ledger entry' };
  }
}

/**
 * Approve/reject a reimbursement or expense entry
 */
export async function approveLedgerEntryAction(
  id: number,
  status: 'pending' | 'approved' | 'rejected' | 'paid',
  comments?: string,
): Promise<FinanceActionResult> {
  try {
    const session = await requireRole(['admin', 'hr']);
    const entry = await approveLedgerEntry(id, status, session.userId, comments);
    
    revalidatePath('/erp/finances');
    return { success: true, entry };
  } catch (error) {
    console.error('Approve ledger entry error:', error);
    return { success: false, error: 'Failed to update entry approval status' };
  }
}

/**
 * Get a short-lived signed URL to view a ledger entry's receipt attachment.
 * The storage bucket is private, so viewing always goes through this
 * server action rather than a stored public URL.
 */
export async function getReceiptUrlAction(path: string): Promise<{ url: string | null }> {
  try {
    await requireAuth();
    const url = await getReceiptSignedUrl(path);
    return { url };
  } catch (error) {
    console.error('Get receipt URL error:', error);
    return { url: null };
  }
}
