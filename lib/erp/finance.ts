/**
 * Database helper functions for Unified Financial Ledger (Supabase)
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { FinancialLedgerEntry, LedgerFormData } from '@/types/erp';
import { handleDatabaseError } from './error-handler';

/**
 * Helper to resolve employee ID from user ID
 */
export async function getEmployeeIdFromUserId(userId: number): Promise<number | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error resolving employee from user:', error);
    return null;
  }
  return data ? data.id : null;
}

/**
 * Get all ledger entries with optional filters and role restrictions
 */
export async function getLedgerEntries(
  userId: number,
  userRole: string,
  filters?: {
    type?: string;
    direction?: string;
    category?: string;
    payment_status?: string;
    payment_mode?: string;
    approval_status?: string;
    month?: string;
    dateFrom?: string;
    dateTo?: string;
    client?: string;
    employeeId?: number;
    payee?: string;
    accountId?: number;
  },
): Promise<FinancialLedgerEntry[]> {
  try {
    let query = supabase.from('financial_ledger').select('*');

    // Access Control: Employee can only see their own reimbursements
    if (userRole === 'employee') {
      const employeeId = await getEmployeeIdFromUserId(userId);
      if (employeeId) {
        query = query
          .eq('employee_id', employeeId)
          .eq('transaction_type', 'reimbursement');
      } else {
        // Fallback: If no employee record is linked, return nothing for safety
        return [];
      }
    } else if (userRole === 'hr') {
      // HR can view expenses, payroll, and reimbursements (all outflows or operational data)
      // but cannot view client investments or company-wide profit/loss client fees unless specified.
      // However, we can allow HR to query them but filter to outflows/reimbursements in the UI.
      // Let's implement filters safely.
    }

    // Apply filters
    if (filters?.type) {
      query = query.eq('transaction_type', filters.type);
    }
    if (filters?.direction) {
      query = query.eq('direction', filters.direction);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }
    if (filters?.approval_status) {
      query = query.eq('approval_status', filters.approval_status);
    }
    if (filters?.client) {
      query = query.eq('client_name', filters.client);
    }
    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }
    if (filters?.payee) {
      query = query.or(`payee_name.ilike.%${filters.payee}%,vendor_name.ilike.%${filters.payee}%`);
    }
    if (filters?.accountId) {
      query = query.eq('account_id', filters.accountId);
    }


    if (filters?.month) {
      const startDate = `${filters.month}-01`;
      const nextMonth = new Date(filters.month + '-01');
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().substring(0, 10);
      query = query.gte('transaction_date', startDate).lt('transaction_date', nextMonthStr);
    }

    if (filters?.dateFrom) {
      query = query.gte('transaction_date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('transaction_date', filters.dateTo);
    }

    query = query
      .order('transaction_date', { ascending: false })
      .order('id', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw handleDatabaseError(error, 'fetch ledger entries');
  }
}

/**
 * Fetch a single ledger entry by ID
 */
export async function getLedgerEntryById(id: number): Promise<FinancialLedgerEntry | null> {
  const { data, error } = await supabase
    .from('financial_ledger')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Add a financial ledger entry
 */
export async function insertLedgerEntry(
  data: LedgerFormData,
  userId: number,
): Promise<FinancialLedgerEntry> {
  try {
    const { data: entry, error } = await supabase
      .from('financial_ledger')
      .insert({
        ...data,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return entry;
  } catch (error) {
    throw handleDatabaseError(error, 'insert ledger entry');
  }
}

/**
 * Update a financial ledger entry
 */
export async function updateLedgerEntryById(
  id: number,
  data: Partial<LedgerFormData>,
  userId: number,
): Promise<FinancialLedgerEntry> {
  try {
    const { data: entry, error } = await supabase
      .from('financial_ledger')
      .update({
        ...data,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return entry;
  } catch (error) {
    throw handleDatabaseError(error, 'update ledger entry');
  }
}

/**
 * Delete a financial ledger entry
 */
export async function deleteLedgerEntryById(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('financial_ledger')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    throw handleDatabaseError(error, 'delete ledger entry');
  }
}

/**
 * Approve or reject a ledger entry
 */
export async function approveLedgerEntry(
  id: number,
  status: 'pending' | 'approved' | 'rejected' | 'paid',
  userId: number,
  comments?: string,
): Promise<FinancialLedgerEntry> {
  try {
    const updateData: any = {
      approval_status: status,
      approved_by: userId,
      approved_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (comments) {
      updateData.notes = comments;
    }

    if (status === 'paid') {
      updateData.payment_status = 'completed';
    }

    const { data: entry, error } = await supabase
      .from('financial_ledger')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If this entry was connected to an expense record, update that too
    if (entry.expense_id) {
      await supabase
        .from('expenses')
        .update({
          status,
          approved_by: userId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', entry.expense_id);
    }

    return entry;
  } catch (error) {
    throw handleDatabaseError(error, 'approve ledger entry');
  }
}

/**
 * Fetch stats summaries for dashboard and reporting
 */
export async function getFinanceSummary(
  userId: number,
  userRole: string,
  filters?: { month?: string; dateFrom?: string; dateTo?: string },
): Promise<{
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  clientIncome: number;
  investments: number;
  pendingReimbursements: number;
  payrollOutflow: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
}> {
  try {
    // Read all ledger entries matching user role
    const allEntries = await getLedgerEntries(userId, userRole, filters);

    // Compute basic statistics
    let totalIncome = 0;
    let totalExpenses = 0;
    let clientIncome = 0;
    let investments = 0;
    let pendingReimbursements = 0;
    let payrollOutflow = 0;

    allEntries.forEach((entry) => {
      const amt = Number(entry.amount || 0);
      
      if (entry.direction === 'inflow') {
        // Invoice income sits pending until an admin approves it in
        // Finances, so it shouldn't inflate totals before that review.
        const isUnapprovedInvoice = entry.transaction_type === 'income' && entry.approval_status === 'pending';

        if (entry.payment_status === 'completed' && !isUnapprovedInvoice) {
          totalIncome += amt;
        }
        if (entry.transaction_type === 'income' && entry.payment_status === 'completed' && !isUnapprovedInvoice) {
          clientIncome += amt;
        }
        if (entry.transaction_type === 'investment' && entry.payment_status === 'completed') {
          investments += amt;
        }
      } else if (entry.direction === 'outflow') {
        if (entry.payment_status === 'completed' || entry.payment_status === 'pending') {
          totalExpenses += amt;
        }
        if (entry.transaction_type === 'payroll' && entry.payment_status === 'completed') {
          payrollOutflow += amt;
        }
        if (entry.transaction_type === 'reimbursement' && entry.approval_status === 'pending') {
          pendingReimbursements += amt;
        }
      }
    });

    // Compute this month income and expenses
    const today = new Date();
    const thisMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthEntries = await getLedgerEntries(userId, userRole, { month: thisMonthStr });
    
    let thisMonthIncome = 0;
    let thisMonthExpenses = 0;

    thisMonthEntries.forEach((entry) => {
      const amt = Number(entry.amount || 0);
      const isUnapprovedInvoice = entry.transaction_type === 'income' && entry.approval_status === 'pending';
      if (entry.direction === 'inflow' && entry.payment_status === 'completed' && !isUnapprovedInvoice) {
        thisMonthIncome += amt;
      } else if (entry.direction === 'outflow' && (entry.payment_status === 'completed' || entry.payment_status === 'pending')) {
        thisMonthExpenses += amt;
      }
    });

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      clientIncome,
      investments,
      pendingReimbursements,
      payrollOutflow,
      thisMonthIncome,
      thisMonthExpenses,
    };
  } catch (error) {
    throw handleDatabaseError(error, 'calculate finance summary');
  }
}
