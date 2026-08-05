'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import FinanceForm from './FinanceForm';
import CompanyAccountManager from './CompanyAccountManager';
import { DeleteIcon } from './ActionIcons';
import MonthPicker from './MonthPicker';
import SensitiveValue from './SensitiveValue';
import type { FinancialLedgerEntry, Employee, CompanyAccount, Client } from '@/types/erp';
import { formatCurrency, formatDisplayDate } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import {
  deleteLedgerEntryAction,
  approveLedgerEntryAction,
} from '@/actions/erp/finance';

interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  clientIncome: number;
  investments: number;
  pendingReimbursements: number;
  payrollOutflow: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
}

interface FinanceManagerProps {
  initialEntries: FinancialLedgerEntry[];
  summary: FinanceSummary;
  employees: Employee[];
  categories: string[];
  accounts: CompanyAccount[];
  accountTransactions: FinancialLedgerEntry[];
  clients: Client[];
  userRole: string;
  userId: number;
}

export default function FinanceManager({
  initialEntries,
  summary,
  employees,
  categories,
  accounts,
  accountTransactions,
  clients = [],
  userRole,
  userId,
}: FinanceManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense' | 'investment'>('expense');

  // Ledger Filter states
  const [filterType, setFilterType] = useState(searchParams.get('type') || '');
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '');
  const [filterMonth, setFilterMonth] = useState(searchParams.get('month') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterPayee, setFilterPayee] = useState(searchParams.get('payee') || '');

  // Apply filters to URL query params — accepts overrides so a field's
  // onChange can push its new value immediately without waiting for
  // the (async) state update to land.
  const applyFilters = (overrides?: Partial<{
    type: string;
    category: string;
    month: string;
    status: string;
    payee: string;
  }>) => {
    const next = {
      type: filterType,
      category: filterCategory,
      month: filterMonth,
      status: filterStatus,
      payee: filterPayee,
      ...overrides,
    };
    const params = new URLSearchParams();
    params.set('tab', currentTab);
    if (next.type) params.set('type', next.type);
    if (next.category) params.set('category', next.category);
    if (next.month) params.set('month', next.month);
    if (next.status) params.set('status', next.status);
    if (next.payee) params.set('payee', next.payee);
    router.push(`/erp/finances?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setFilterType('');
    setFilterCategory('');
    setFilterMonth('');
    setFilterStatus('');
    setFilterPayee('');
    router.push(`/erp/finances?tab=${currentTab}`);
  };

  // Debounce the free-text payee filter so it applies automatically
  // without pushing a new URL on every keystroke.
  useEffect(() => {
    const currentPayee = searchParams.get('payee') || '';
    if (filterPayee === currentPayee) return;
    const timer = setTimeout(() => applyFilters({ payee: filterPayee }), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPayee]);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    router.push(`/erp/finances?${params.toString()}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this financial ledger entry?')) return;

    const result = await deleteLedgerEntryAction(id);
    if (result.success) {
      toast.success('Ledger entry deleted');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete entry');
    }
  };

  const handleApproval = async (id: number, status: 'approved' | 'rejected' | 'paid', comment?: string) => {
    const result = await approveLedgerEntryAction(id, status, comment);
    if (result.success) {
      toast.success(`Entry marked as ${status}`);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update approval state');
    }
  };

  const handleOpenAddModal = (formType: typeof modalType) => {
    setModalType(formType);
    setShowAddModal(true);
  };

  // Group ledger entries by category for expenses breakdown
  const expensesBreakdown = initialEntries
    .filter((e) => e.direction === 'outflow' && e.payment_status === 'completed')
    .reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + Number(entry.amount || 0);
      return acc;
    }, {} as Record<string, number>);

  const sortedBreakdown = Object.entries(expensesBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: summary.totalExpenses > 0 ? (amt / summary.totalExpenses) * 100 : 0,
    }));

  // Define tab navigation elements
  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'ledger', name: 'General Ledger' },
    { id: 'income', name: 'Client Income' },
    { id: 'expenses', name: 'Expenses' },
    { id: 'investments', name: 'Capital Inflow' },
    { id: 'accounts', name: 'Company Accounts' },
    { id: 'reports', name: 'Analytics' },
  ];

  return (
    <div>
      {/* Upper header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>Financial Center</h1>
          <p className='text-gray-400 mt-2'>
            Manage unified ledger accounts, company investment ledger, outflows, and operational expenses.
          </p>
        </div>
        <div className='flex gap-2.5 flex-wrap'>
          {userRole !== 'employee' && (
            <>
              <Button variant='primary' onClick={() => handleOpenAddModal('income')} className='whitespace-nowrap'>
                + Client Income
              </Button>
              <Button variant='primary' onClick={() => handleOpenAddModal('investment')} className='whitespace-nowrap'>
                + Investment
              </Button>
              <Button variant='primary' onClick={() => handleOpenAddModal('expense')} className='whitespace-nowrap'>
                + Expense
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Selector Navigation bar */}
      <div className='flex border-b border-gray-800 gap-1.5 overflow-x-auto mb-6 select-none'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-5 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              currentTab === tab.id
                ? 'border-cyan text-cyan bg-cyan/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-900/40'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Overview Dashboard Tab */}
      {currentTab === 'overview' && userRole !== 'employee' && (
        <div className='space-y-6'>
          {/* Top general statistics cards */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='glass p-5 rounded-lg'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>Total Revenue Inflow</p>
              <p className='text-2xl font-bold text-white mt-1.5'><SensitiveValue>{formatCurrency(summary.totalIncome)}</SensitiveValue></p>
              <div className='h-1 w-full bg-green-500/10 rounded-full overflow-hidden mt-3'>
                <div className='h-full bg-green-500 w-[65%]' />
              </div>
            </div>
            <div className='glass p-5 rounded-lg'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>Total Expenditures</p>
              <p className='text-2xl font-bold text-red-400 mt-1.5'><SensitiveValue>{formatCurrency(summary.totalExpenses)}</SensitiveValue></p>
              <div className='h-1 w-full bg-red-500/10 rounded-full overflow-hidden mt-3'>
                <div className='h-full bg-red-400 w-[45%]' />
              </div>
            </div>
            <div className='glass p-5 rounded-lg'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>Net Margin Balance</p>
              <p className={`text-2xl font-bold mt-1.5 ${summary.netBalance >= 0 ? 'text-cyan' : 'text-orange-400'}`}>
                <SensitiveValue>{formatCurrency(summary.netBalance)}</SensitiveValue>
              </p>
              <div className='h-1 w-full bg-cyan/10 rounded-full overflow-hidden mt-3'>
                <div className='h-full bg-cyan w-[80%]' />
              </div>
            </div>
          </div>

          {/* Secondary stats cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='glass p-5 rounded-lg border-l-4 border-purple'>
              <p className='text-sm text-gray-400 font-medium'>Milestone Income</p>
              <p className='text-2xl font-bold text-white mt-1'><SensitiveValue>{formatCurrency(summary.clientIncome)}</SensitiveValue></p>
              <p className='text-xs text-gray-500 mt-1.5'>Revenue generated from client project milestones</p>
            </div>
            <div className='glass p-5 rounded-lg border-l-4 border-blue-500'>
              <p className='text-sm text-gray-400 font-medium'>Founder Investments</p>
              <p className='text-2xl font-bold text-white mt-1'><SensitiveValue>{formatCurrency(summary.investments)}</SensitiveValue></p>
              <p className='text-xs text-gray-500 mt-1.5'>Capital injection/partners business reserves</p>
            </div>
            <div className='glass p-5 rounded-lg border-l-4 border-red-500'>
              <p className='text-sm text-gray-400 font-medium'>Payroll Outflow</p>
              <p className='text-2xl font-bold text-white mt-1'><SensitiveValue>{formatCurrency(summary.payrollOutflow)}</SensitiveValue></p>
              <p className='text-xs text-gray-500 mt-1.5'>Total salary expenditures disbursed</p>
            </div>
          </div>

          {/* Month progress cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='glass p-5 rounded-lg bg-gradient-to-br from-dark-900 to-green-950/20 border border-green-900/20'>
              <p className='text-sm text-green-400 font-semibold uppercase tracking-wider'>Revenue (This Month)</p>
              <p className='text-3xl font-bold text-white mt-2'><SensitiveValue>{formatCurrency(summary.thisMonthIncome)}</SensitiveValue></p>
              <p className='text-xs text-gray-400 mt-2'>Total standard earnings generated during the current month</p>
            </div>
            <div className='glass p-5 rounded-lg bg-gradient-to-br from-dark-900 to-red-950/20 border border-red-900/20'>
              <p className='text-sm text-red-400 font-semibold uppercase tracking-wider'>Outflows (This Month)</p>
              <p className='text-3xl font-bold text-white mt-2'><SensitiveValue>{formatCurrency(summary.thisMonthExpenses)}</SensitiveValue></p>
              <p className='text-xs text-gray-400 mt-2'>Total company expenditures processed during the current month</p>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table & Lists Tab */}
      {(currentTab === 'ledger' || currentTab === 'income' || currentTab === 'expenses' || currentTab === 'investments') && (
        <div className='space-y-6'>
          {/* Advanced Filter Panel */}
          <div className='glass p-4 rounded-lg'>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end'>
              {currentTab === 'ledger' && (
                <div>
                  <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                      applyFilters({ type: e.target.value });
                    }}
                    className='w-full px-3 py-1.5 text-sm rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan'
                  >
                    <option value=''>All Types</option>
                    <option value='income'>Income</option>
                    <option value='expense'>Expense</option>
                    <option value='investment'>Investment</option>
                    <option value='payroll'>Payroll</option>
                  </select>
                </div>
              )}
              <div>
                <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    applyFilters({ category: e.target.value });
                  }}
                  className='w-full px-3 py-1.5 text-sm rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan'
                >
                  <option value=''>All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>Month</label>
                <MonthPicker
                  value={filterMonth}
                  onChange={(next) => {
                    setFilterMonth(next);
                    applyFilters({ month: next });
                  }}
                />
              </div>
              {currentTab !== 'income' && (
                <div>
                  <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      applyFilters({ status: e.target.value });
                    }}
                    className='w-full px-3 py-1.5 text-sm rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan'
                  >
                    <option value=''>All Statuses</option>
                    <option value='pending'>Pending</option>
                    <option value='approved'>Approved</option>
                    <option value='rejected'>Rejected</option>
                    <option value='paid'>Paid</option>
                  </select>
                </div>
              )}
              <div>
                <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>Payee / Vendor</label>
                <input
                  type='text'
                  placeholder='Search payee...'
                  value={filterPayee}
                  onChange={(e) => setFilterPayee(e.target.value)}
                  className='w-full px-3 py-1.5 text-sm rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan placeholder-gray-500'
                />
              </div>
              <div className='flex gap-2 lg:col-span-1'>
                <Button variant='secondary' onClick={handleClearFilters} className='w-full text-xs py-2!'>
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Financial Ledger Data Table */}
          <div className='glass rounded-lg overflow-hidden'>
            {initialEntries.length === 0 ? (
              <div className='text-center py-16'>
                <p className='text-gray-400 mb-4'>No ledger transactions found</p>
                <Button variant='primary' onClick={() => handleOpenAddModal('expense')}>
                  Log First Ledger Entry
                </Button>
              </div>
            ) : (
              <Table
                headers={[
                  'Date',
                  'Type',
                  'Category',
                  'Inflow/Outflow',
                  'Party / Details',
                  'Description',
                  'Mode',
                  'Status',
                  'Amount',
                  'Actions',
                ]}
              >
                {initialEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className='whitespace-nowrap'>{formatDisplayDate(entry.transaction_date)}</TableCell>
                    <TableCell>
                      <span className='px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-dark-800 text-cyan border border-cyan/15'>
                        {entry.transaction_type}
                      </span>
                    </TableCell>
                    <TableCell className='font-semibold text-gray-300'>{entry.category}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                          entry.direction === 'inflow' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {entry.direction === 'inflow' ? '↓ Inflow' : '↑ Outflow'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.client_name && (
                        <div className='text-xs font-bold text-purple'>Client: {entry.client_name}</div>
                      )}
                      {entry.project_name && (
                        <div className='text-[10px] text-gray-500'>Proj: {entry.project_name}</div>
                      )}
                      {entry.payee_name && (
                        <div className='text-xs text-gray-400'>Payee: {entry.payee_name}</div>
                      )}
                      {entry.payer_name && (
                        <div className='text-xs text-gray-400'>Source: {entry.payer_name}</div>
                      )}
                    </TableCell>
                    <TableCell className='max-w-[200px] truncate text-xs text-gray-400'>
                      <div className="truncate" title={entry.description || ''}>
                        {entry.description || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className='text-xs text-gray-400'>{entry.payment_mode || 'N/A'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          entry.approval_status === 'approved' || entry.payment_status === 'completed'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : entry.approval_status === 'rejected'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}
                      >
                        {entry.approval_status || entry.payment_status || 'completed'}
                      </span>
                    </TableCell>
                    <TableCell className='font-bold text-white whitespace-nowrap'><SensitiveValue>{formatCurrency(entry.amount)}</SensitiveValue></TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {userRole === 'admin' && (
                          <button
                            onClick={() => handleDelete(entry.id)}
                            title='Delete'
                            aria-label='Delete'
                            className='text-red-400 hover:text-red-300 transition-colors'
                          >
                            <DeleteIcon />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            )}
          </div>
        </div>
      )}

      {/* Company Accounts Tab */}
      {currentTab === 'accounts' && userRole !== 'employee' && (
        <CompanyAccountManager
          accounts={accounts}
          transactions={accountTransactions}
          employees={employees}
          clients={clients}
          userRole={userRole}
        />
      )}

      {/* Analytics/Reports Tab */}
      {currentTab === 'reports' && userRole !== 'employee' && (
        <div className='space-y-6'>
          {/* Charts/SVG breakdown widgets */}
          {sortedBreakdown.length > 0 ? (
            <div className='glass p-6 rounded-lg select-none'>
              <h3 className='text-sm font-semibold text-white mb-4'>Expenses Distribution by Category</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8 items-center'>
                {/* Progress bars list */}
                <div className='space-y-4'>
                  {sortedBreakdown.slice(0, 5).map((item, index) => {
                    const colors = [
                      'bg-cyan',
                      'bg-purple',
                      'bg-blue-500',
                      'bg-green-500',
                      'bg-yellow-500',
                    ];
                    const color = colors[index % colors.length];
                    return (
                      <div key={item.category}>
                        <div className='flex justify-between items-center text-xs mb-1.5'>
                          <span className='font-medium text-gray-300'>{item.category}</span>
                          <span className='text-gray-400 font-semibold'>
                            <SensitiveValue>{formatCurrency(item.amount)}</SensitiveValue> ({item.percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div className='w-full h-2 bg-[#0c0c0e]/85 rounded-full overflow-hidden border border-gray-800/80'>
                          <div
                            className={`h-full ${color} transition-all duration-500`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Donut Chart SVG */}
                <div className='flex flex-col items-center justify-center'>
                  <div className='relative w-36 h-36 flex items-center justify-center'>
                    <svg className='w-full h-full transform -rotate-90' viewBox='0 0 36 36'>
                      <circle cx='18' cy='18' r='15.915' fill='none' stroke='#111115' strokeWidth='4' />
                      {(() => {
                        let accumulatedPercent = 0;
                        return sortedBreakdown.map((item, index) => {
                          const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                          const strokeDashoffset = 100 - accumulatedPercent;
                          accumulatedPercent += item.percentage;
                          
                          const colors = [
                            '#00ffff',
                            '#a855f7',
                            '#3b82f6',
                            '#22c55e',
                            '#eab308',
                          ];
                          const strokeColor = colors[index % colors.length];

                          return (
                            <circle
                              key={item.category}
                              cx='18'
                              cy='18'
                              r='15.915'
                              fill='none'
                              stroke={strokeColor}
                              strokeWidth='4'
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-500"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className='absolute flex flex-col items-center justify-center'>
                      <span className='text-lg font-bold text-white'><SensitiveValue>{formatCurrency(summary.totalExpenses).split('.')[0]}</SensitiveValue></span>
                      <span className='text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1'>Spent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='glass p-12 text-center text-gray-400 rounded-lg'>
              No expenditure data found to compute distribution graphs.
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={`Add ${modalType}`}>
        <FinanceForm
          type={modalType}
          employees={employees}
          accounts={accounts}
          clients={clients}
          userRole={userRole}
          onSuccess={() => {
            setShowAddModal(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
