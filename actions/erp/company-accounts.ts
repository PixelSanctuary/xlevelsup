'use server';

import { requireAuth } from '@/lib/auth';
import {
  getCompanyAccounts,
  getAccountBalance,
  getAccountTransactions,
} from '@/lib/erp/company-accounts';
import type { CompanyAccount, FinancialLedgerEntry } from '@/types/erp';

export interface CompanyAccountActionResult {
  success: boolean;
  error?: string;
  account?: CompanyAccount;
  accounts?: CompanyAccount[];
}

/**
 * Get all company accounts
 */
export async function getCompanyAccountsAction(): Promise<CompanyAccount[]> {
  try {
    await requireAuth();
    return await getCompanyAccounts();
  } catch (error) {
    console.error('Get company accounts error:', error);
    return [];
  }
}

/**
 * Get balance stats for a company account
 */
export async function getAccountBalanceAction(accountId: number): Promise<{
  openingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  currentBalance: number;
  pendingOutflow: number;
} | null> {
  try {
    await requireAuth();
    return await getAccountBalance(accountId);
  } catch (error) {
    console.error('Get account balance error:', error);
    return null;
  }
}

/**
 * Get transactions for a specific account
 */
export async function getAccountTransactionsAction(
  accountId: number,
  filters?: { month?: string; type?: string },
): Promise<FinancialLedgerEntry[]> {
  try {
    await requireAuth();
    return await getAccountTransactions(accountId, filters);
  } catch (error) {
    console.error('Get account transactions error:', error);
    return [];
  }
}
