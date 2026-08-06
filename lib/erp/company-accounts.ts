/**
 * Data layer for Company Accounts (Supabase)
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { CompanyAccount, FinancialLedgerEntry } from '@/types/erp';
import { handleDatabaseError } from './error-handler';

/**
 * Get all active company accounts
 */
export async function getCompanyAccounts(): Promise<CompanyAccount[]> {
  try {
    const { data, error } = await supabase
      .from('company_accounts')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw handleDatabaseError(error, 'fetch company accounts');
  }
}

/**
 * Get a single company account by ID
 */
export async function getCompanyAccountById(id: number): Promise<CompanyAccount | null> {
  try {
    const { data, error } = await supabase
      .from('company_accounts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleDatabaseError(error, 'fetch company account');
  }
}

/**
 * Compute live balance for an account:
 *   opening_balance + sum(inflows) - sum(outflows) for completed/pending transactions
 */
export async function getAccountBalance(accountId: number): Promise<{
  openingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  currentBalance: number;
  pendingOutflow: number;
}> {
  try {
    const account = await getCompanyAccountById(accountId);
    if (!account) throw new Error('Account not found');

    const { data: entries, error } = await supabase
      .from('financial_ledger')
      .select('direction, amount, payment_status')
      .eq('account_id', accountId);

    if (error) throw error;

    let totalInflow = 0;
    let totalOutflow = 0;
    let pendingOutflow = 0;

    (entries || []).forEach((entry) => {
      const amt = Number(entry.amount || 0);
      if (entry.direction === 'inflow' && entry.payment_status === 'completed') {
        totalInflow += amt;
      } else if (entry.direction === 'outflow') {
        if (entry.payment_status === 'completed') {
          totalOutflow += amt;
        } else if (entry.payment_status === 'pending') {
          pendingOutflow += amt;
        }
      }
    });

    const openingBalance = Number(account.opening_balance || 0);
    const currentBalance = openingBalance + totalInflow - totalOutflow;

    return { openingBalance, totalInflow, totalOutflow, currentBalance, pendingOutflow };
  } catch (error) {
    throw handleDatabaseError(error, 'calculate account balance');
  }
}

/**
 * Get all transactions linked to an account
 */
export async function getAccountTransactions(
  accountId: number,
  filters?: {
    month?: string;
    type?: string;
  },
): Promise<FinancialLedgerEntry[]> {
  try {
    let query = supabase
      .from('financial_ledger')
      .select('*')
      .eq('account_id', accountId);

    if (filters?.type) {
      query = query.eq('transaction_type', filters.type);
    }

    if (filters?.month) {
      const startDate = `${filters.month}-01`;
      const nextMonth = new Date(filters.month + '-01');
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().substring(0, 10);
      query = query.gte('transaction_date', startDate).lt('transaction_date', nextMonthStr);
    }

    query = query
      .order('transaction_date', { ascending: false })
      .order('id', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw handleDatabaseError(error, 'fetch account transactions');
  }
}
