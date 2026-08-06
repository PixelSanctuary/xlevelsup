'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import FinanceForm from './FinanceForm';
import MonthPicker from './MonthPicker';
import SensitiveValue from './SensitiveValue';
import type { CompanyAccount, FinancialLedgerEntry, Employee, Client } from '@/types/erp';
import { formatCurrency, formatDisplayDate } from '@/lib/erp/utils';
import { getAccountBalanceAction } from '@/actions/erp/company-accounts';

interface AccountBalance {
  openingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  currentBalance: number;
  pendingOutflow: number;
}

interface CompanyAccountManagerProps {
  accounts: CompanyAccount[];
  transactions: FinancialLedgerEntry[];
  employees: Employee[];
  clients: Client[];
  userRole: string;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  stakeholder: 'Stakeholder',
  operations: 'Operations',
  reserve: 'Reserve',
};

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  general: 'text-gray-300 border-gray-600',
  stakeholder: 'text-blue-400 border-blue-400/40',
  operations: 'text-cyan border-cyan/40',
  reserve: 'text-green-400 border-green-400/40',
};

export default function CompanyAccountManager({
  accounts,
  transactions,
  employees,
  clients = [],
  userRole,
}: CompanyAccountManagerProps) {
  const router = useRouter();

  const [selectedAccountId, setSelectedAccountId] = useState<number>(accounts[0]?.id ?? 0);
  const [balances, setBalances] = useState<Record<number, AccountBalance>>({});
  const [loadingBalance, setLoadingBalance] = useState(false);

  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [addTxType, setAddTxType] = useState<'expense' | 'income' | 'investment'>('expense');
  const [filterMonth, setFilterMonth] = useState('');

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Load balances for all accounts on mount
  useEffect(() => {
    async function loadBalances() {
      setLoadingBalance(true);
      const results: Record<number, AccountBalance> = {};
      await Promise.all(
        accounts.map(async (acc) => {
          const b = await getAccountBalanceAction(acc.id);
          if (b) results[acc.id] = b;
        }),
      );
      setBalances(results);
      setLoadingBalance(false);
    }
    if (accounts.length > 0) loadBalances();
  }, [accounts]);

  // Filter transactions for selected account + optional month
  const accountTransactions = transactions.filter((t) => {
    if (t.account_id !== selectedAccountId) return false;
    if (filterMonth) {
      return t.transaction_date.startsWith(filterMonth);
    }
    return true;
  });

  const selectedBalance = balances[selectedAccountId];

  const handleOpenAddTx = (type: 'expense' | 'income' | 'investment') => {
    setAddTxType(type);
    setShowAddTxModal(true);
  };

  return (
    <div className='space-y-6'>
      {/* Account Selector Cards */}
      <div className='flex flex-wrap gap-3 items-center'>
        {accounts.map((acc) => {
          const bal = balances[acc.id];
          const isSelected = acc.id === selectedAccountId;
          const colorClass = ACCOUNT_TYPE_COLORS[acc.account_type] || ACCOUNT_TYPE_COLORS.general;
          return (
            <button
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`group flex flex-col items-start px-5 py-4 rounded-xl border transition-all duration-200 min-w-[180px] ${
                isSelected
                  ? `glass border-cyan/60 shadow-lg shadow-cyan/10 scale-[1.02]`
                  : `glass border-gray-800 hover:border-gray-600`
              }`}
            >
              <div className='flex items-center gap-2 mb-1'>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${colorClass}`}
                >
                  {ACCOUNT_TYPE_LABELS[acc.account_type] || acc.account_type}
                </span>
              </div>
              <p className='text-sm font-bold text-white truncate max-w-[160px]'>{acc.name}</p>
              {bal ? (
                <p
                  className={`text-xs font-semibold mt-1 ${bal.currentBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  <SensitiveValue>{formatCurrency(bal.currentBalance)}</SensitiveValue>
                </p>
              ) : (
                <p className='text-xs text-gray-500 mt-1'>{loadingBalance ? 'Loading…' : '—'}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Account Detail Panel */}
      {selectedAccount && (
        <div className='space-y-6'>
          {/* Balance Stats */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='glass p-5 rounded-xl border border-cyan/10'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Current Balance
              </p>
              <p
                className={`text-2xl font-bold mt-1.5 ${
                  (selectedBalance?.currentBalance ?? 0) >= 0 ? 'text-cyan' : 'text-red-400'
                }`}
              >
                {loadingBalance ? '—' : <SensitiveValue>{formatCurrency(selectedBalance?.currentBalance ?? 0)}</SensitiveValue>}
              </p>
            </div>
            <div className='glass p-5 rounded-xl border border-green-500/10'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Total Deposits
              </p>
              <p className='text-2xl font-bold text-green-400 mt-1.5'>
                {loadingBalance ? '—' : <SensitiveValue>{formatCurrency(selectedBalance?.totalInflow ?? 0)}</SensitiveValue>}
              </p>
            </div>
            <div className='glass p-5 rounded-xl border border-red-500/10'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Total Spent
              </p>
              <p className='text-2xl font-bold text-red-400 mt-1.5'>
                {loadingBalance ? '—' : <SensitiveValue>{formatCurrency(selectedBalance?.totalOutflow ?? 0)}</SensitiveValue>}
              </p>
            </div>
            <div className='glass p-5 rounded-xl border border-yellow-500/10'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                Pending Outflow
              </p>
              <p className='text-2xl font-bold text-yellow-400 mt-1.5'>
                {loadingBalance ? '—' : <SensitiveValue>{formatCurrency(selectedBalance?.pendingOutflow ?? 0)}</SensitiveValue>}
              </p>
            </div>
          </div>

          {/* Quick Actions + Filter row */}
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='flex gap-2 flex-wrap'>
              {userRole !== 'employee' && (
                <>
                  <Button
                    variant='primary'
                    onClick={() => handleOpenAddTx('income')}
                    className='text-sm whitespace-nowrap'
                  >
                    + Deposit / Credit
                  </Button>
                  <Button
                    variant='primary'
                    onClick={() => handleOpenAddTx('expense')}
                    className='text-sm whitespace-nowrap'
                  >
                    + Record Expense
                  </Button>
                  <Button
                    variant='secondary'
                    onClick={() => handleOpenAddTx('investment')}
                    className='text-sm whitespace-nowrap'
                  >
                    + Investment
                  </Button>
                </>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <label className='text-xs text-gray-400 font-medium'>Month:</label>
              <div className='w-40'>
                <MonthPicker value={filterMonth} onChange={setFilterMonth} />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className='glass rounded-xl overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-800 flex items-center justify-between'>
              <h3 className='text-sm font-bold text-white'>
                {selectedAccount.name} — Transaction History
              </h3>
              <span className='text-xs text-gray-500'>{accountTransactions.length} records</span>
            </div>

            {accountTransactions.length === 0 ? (
              <div className='text-center py-16'>
                <div className='text-4xl mb-3'>🏦</div>
                <p className='text-gray-400 mb-2 font-medium'>No transactions yet</p>
                <p className='text-xs text-gray-600'>
                  Add your first deposit or expense to this account
                </p>
              </div>
            ) : (
              <Table
                headers={['Date', 'Type', 'Category', 'Direction', 'Description', 'Mode', 'Status', 'Amount']}
              >
                {accountTransactions.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className='whitespace-nowrap text-xs'>
                      {formatDisplayDate(entry.transaction_date)}
                    </TableCell>
                    <TableCell>
                      <span className='px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-dark-800 text-cyan border border-cyan/15'>
                        {entry.transaction_type}
                      </span>
                    </TableCell>
                    <TableCell className='text-gray-300 text-xs font-medium'>
                      {entry.category}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-bold ${
                          entry.direction === 'inflow' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {entry.direction === 'inflow' ? '↓ Credit' : '↑ Debit'}
                      </span>
                    </TableCell>
                    <TableCell className='max-w-[200px]'>
                      <div className='truncate text-xs text-gray-400' title={entry.description || ''}>
                        {entry.vendor_name && (
                          <span className='text-gray-300 font-medium'>{entry.vendor_name} — </span>
                        )}
                        {entry.description || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className='text-xs text-gray-400'>
                      {entry.payment_mode || '—'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          entry.payment_status === 'completed'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : entry.payment_status === 'failed' || entry.payment_status === 'cancelled'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}
                      >
                        {entry.payment_status || 'completed'}
                      </span>
                    </TableCell>
                    <TableCell className='font-bold text-white whitespace-nowrap'>
                      <span className={entry.direction === 'inflow' ? 'text-green-400' : 'text-red-400'}>
                        {entry.direction === 'inflow' ? '+' : '-'}
                        <SensitiveValue>{formatCurrency(entry.amount)}</SensitiveValue>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={showAddTxModal}
        onClose={() => setShowAddTxModal(false)}
        title={`Add ${addTxType === 'income' ? 'Deposit / Credit' : addTxType === 'investment' ? 'Investment' : 'Expense'} — ${selectedAccount?.name}`}
      >
        <div className='mb-4 px-1'>
          <p className='text-xs text-gray-500'>
            {addTxType === 'investment'
              ? <>Investment will be <span className='text-green-400 font-semibold'>received into</span> <span className='text-cyan font-semibold'>{selectedAccount?.name}</span> and increase its balance.</>
              : addTxType === 'expense'
              ? <>Expense will be <span className='text-red-400 font-semibold'>deducted from</span> <span className='text-cyan font-semibold'>{selectedAccount?.name}</span> and reduce its balance.</>
              : <>Transaction will be linked to <span className='text-cyan font-semibold'>{selectedAccount?.name}</span>.</>
            }
          </p>
        </div>
        <FinanceForm
          type={addTxType}
          employees={employees}
          accounts={accounts}
          clients={clients}
          defaultAccountId={selectedAccountId}
          userRole={userRole}
          onSuccess={() => {
            setShowAddTxModal(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
