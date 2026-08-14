'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import FinanceForm from './FinanceForm';
import CompanyAccountManager from './CompanyAccountManager';
import { DeleteIcon } from './ActionIcons';
import MonthPicker from './MonthPicker';
import SensitiveValue from './SensitiveValue';
import { StatTile, BarBreakdown, TrendChart, type BarBreakdownItem } from './charts/FinanceCharts';
import type { FinancialLedgerEntry, Employee, CompanyAccount, Client } from '@/types/erp';
import { formatCurrency, formatDisplayDate } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import {
  deleteLedgerEntryAction,
  approveLedgerEntryAction,
  getReceiptUrlAction,
} from '@/actions/erp/finance';

interface FinanceManagerProps {
  initialEntries: FinancialLedgerEntry[];
  employees: Employee[];
  categories: string[];
  accounts: CompanyAccount[];
  accountTransactions: FinancialLedgerEntry[];
  clients: Client[];
  userRole: string;
  userId: number;
  /** Server-resolved "today" (IST) — the client initializes its default
   * period from these rather than computing its own `new Date()`, so the
   * default can't drift a day from what the server already fetched. */
  defaultMonth: string;
  defaultYear: string;
}

export default function FinanceManager({
  initialEntries,
  employees,
  categories,
  accounts,
  accountTransactions,
  clients = [],
  userRole,
  userId,
  defaultMonth,
  defaultYear,
}: FinanceManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense' | 'investment'>('expense');

  // Ledger Filter states
  const [filterType, setFilterType] = useState(searchParams.get('type') || '');
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '');
  // Period defaults to the current month (see defaultMonth) so the page
  // opens scoped to "now" rather than dumping the whole company history
  // into every tab; an explicit ?year= switches the picker into year mode.
  const [periodType, setPeriodType] = useState<'month' | 'year'>(searchParams.get('year') ? 'year' : 'month');
  const [filterMonth, setFilterMonth] = useState(
    searchParams.get('month') || (searchParams.get('year') ? '' : defaultMonth),
  );
  const [filterYear, setFilterYear] = useState(searchParams.get('year') || defaultYear);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterMode, setFilterMode] = useState(searchParams.get('mode') || '');
  const [filterPayee, setFilterPayee] = useState(searchParams.get('payee') || '');

  const yearOptions = Array.from({ length: 6 }, (_, i) => String(Number(defaultYear) - i));

  // Apply filters to URL query params — accepts overrides so a field's
  // onChange can push its new value immediately without waiting for
  // the (async) state update to land. Month and year are mutually
  // exclusive in the URL — only whichever periodType is active gets set.
  const applyFilters = (overrides?: Partial<{
    type: string;
    category: string;
    periodType: 'month' | 'year';
    month: string;
    year: string;
    status: string;
    mode: string;
    payee: string;
  }>) => {
    const next = {
      type: filterType,
      category: filterCategory,
      periodType,
      month: filterMonth,
      year: filterYear,
      status: filterStatus,
      mode: filterMode,
      payee: filterPayee,
      ...overrides,
    };
    const params = new URLSearchParams();
    params.set('tab', currentTab);
    if (next.type) params.set('type', next.type);
    if (next.category) params.set('category', next.category);
    if (next.periodType === 'year') {
      if (next.year) params.set('year', next.year);
    } else if (next.month) {
      params.set('month', next.month);
    }
    if (next.status) params.set('status', next.status);
    if (next.mode) params.set('mode', next.mode);
    if (next.payee) params.set('payee', next.payee);
    router.push(`/erp/finances?${params.toString()}`);
  };

  const handlePeriodTypeChange = (type: 'month' | 'year') => {
    setPeriodType(type);
    applyFilters({ periodType: type });
  };

  // Resets back to the default view (current month) rather than an
  // unbounded all-time view — a fresh company-wide dump isn't a useful
  // "cleared" state for a finance dashboard.
  const handleClearFilters = () => {
    setFilterType('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterMode('');
    setFilterPayee('');
    setPeriodType('month');
    setFilterMonth(defaultMonth);
    setFilterYear(defaultYear);
    router.push(`/erp/finances?tab=${currentTab}&month=${defaultMonth}`);
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

  const [viewingReceiptId, setViewingReceiptId] = useState<number | null>(null);

  const handleViewReceipt = async (entryId: number, path: string) => {
    setViewingReceiptId(entryId);
    try {
      const { url } = await getReceiptUrlAction(path);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Could not open receipt — it may have been removed.');
      }
    } finally {
      setViewingReceiptId(null);
    }
  };

  // For Overview/Analytics in month mode, `initialEntries` arrives already
  // scoped to every filter except month (see app/erp/finances/page.tsx — a
  // trend chart needs more than one month of data); month is applied here
  // instead, client-side, so KPIs/breakdowns respect it while the trend
  // chart can still show the full range it was fetched for. Year mode is
  // already bounded to the selected year server-side, for every tab, so
  // this is a no-op subset there. Both branches just prefix-match on
  // transaction_date since 'YYYY' is itself a prefix of 'YYYY-MM-DD'.
  const periodFilteredEntries = useMemo(() => {
    const prefix = periodType === 'year' ? filterYear : filterMonth;
    if (!prefix) return initialEntries;
    return initialEntries.filter((e) => e.transaction_date.startsWith(prefix));
  }, [initialEntries, periodType, filterMonth, filterYear]);

  const stats = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    let clientIncome = 0;
    let investments = 0;
    let payrollOutflow = 0;
    let pendingReimbursements = 0;
    let pendingApprovalCount = 0;
    let pendingApprovalAmount = 0;

    const categoryExpense: Record<string, number> = {};
    const categoryIncome: Record<string, number> = {};
    const modeBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};
    const vendorTotals: Record<string, number> = {};
    const clientTotals: Record<string, number> = {};

    for (const e of periodFilteredEntries) {
      const amt = Number(e.amount || 0);
      // Invoice income sits pending until an admin approves it, so it
      // shouldn't inflate totals before that review clears.
      const isUnapprovedInvoice = e.transaction_type === 'income' && e.approval_status === 'pending';
      const completed = e.payment_status === 'completed' && !isUnapprovedInvoice;

      if (e.direction === 'inflow' && completed) totalInflow += amt;
      if (e.direction === 'outflow' && (completed || e.payment_status === 'pending')) totalOutflow += amt;

      if (e.transaction_type === 'income' && completed) clientIncome += amt;
      if (e.transaction_type === 'investment' && completed) investments += amt;
      if (e.transaction_type === 'payroll' && completed) payrollOutflow += amt;
      if (e.transaction_type === 'reimbursement' && e.approval_status === 'pending') pendingReimbursements += amt;

      if (e.approval_status === 'pending') {
        pendingApprovalCount += 1;
        pendingApprovalAmount += amt;
      }

      if (e.direction === 'outflow' && completed) {
        categoryExpense[e.category] = (categoryExpense[e.category] || 0) + amt;
        const vendorKey = e.vendor_name || e.payee_name;
        if (vendorKey) vendorTotals[vendorKey] = (vendorTotals[vendorKey] || 0) + amt;
      }
      if (e.direction === 'inflow' && completed) {
        categoryIncome[e.category] = (categoryIncome[e.category] || 0) + amt;
        if (e.client_name) clientTotals[e.client_name] = (clientTotals[e.client_name] || 0) + amt;
      }

      if (e.payment_mode) modeBreakdown[e.payment_mode] = (modeBreakdown[e.payment_mode] || 0) + amt;
      typeBreakdown[e.transaction_type] = (typeBreakdown[e.transaction_type] || 0) + amt;

      const status = e.approval_status || e.payment_status || 'completed';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + amt;
    }

    return {
      totalInflow,
      totalOutflow,
      netBalance: totalInflow - totalOutflow,
      transactionCount: periodFilteredEntries.length,
      avgTransactionValue: periodFilteredEntries.length
        ? (totalInflow + totalOutflow) / periodFilteredEntries.length
        : 0,
      clientIncome,
      investments,
      payrollOutflow,
      pendingReimbursements,
      pendingApprovalCount,
      pendingApprovalAmount,
      categoryExpense,
      categoryIncome,
      modeBreakdown,
      typeBreakdown,
      statusBreakdown,
      vendorTotals,
      clientTotals,
    };
  }, [periodFilteredEntries]);

  const toBarItems = (record: Record<string, number>): BarBreakdownItem[] =>
    Object.entries(record).map(([key, value]) => ({ key, label: key, value }));

  // Cash-flow trend granularity steps down with how narrow the period is:
  // a whole year selected -> monthly bars (Jan-Dec, zero-filled); a specific
  // month selected -> daily bars within it; no period pinned -> monthly
  // across the last 12 months present in the full (unbounded) slice.
  const trendData = useMemo(() => {
    if (periodType === 'year' && filterYear) {
      const byMonth: Record<string, { inflow: number; outflow: number }> = {};
      for (let m = 1; m <= 12; m++) byMonth[String(m).padStart(2, '0')] = { inflow: 0, outflow: 0 };
      for (const e of periodFilteredEntries) {
        if (e.payment_status !== 'completed') continue;
        if (e.transaction_type === 'income' && e.approval_status === 'pending') continue;
        const m = e.transaction_date.slice(5, 7);
        if (!byMonth[m]) continue;
        const amt = Number(e.amount || 0);
        if (e.direction === 'inflow') byMonth[m].inflow += amt;
        else byMonth[m].outflow += amt;
      }
      return Object.entries(byMonth).map(([m, v]) => {
        const label = new Date(Number(filterYear), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
        return { label, ...v };
      });
    }

    if (filterMonth) {
      const byDay: Record<string, { inflow: number; outflow: number }> = {};
      for (const e of periodFilteredEntries) {
        if (e.payment_status !== 'completed') continue;
        if (e.transaction_type === 'income' && e.approval_status === 'pending') continue;
        const day = e.transaction_date.slice(8, 10);
        if (!byDay[day]) byDay[day] = { inflow: 0, outflow: 0 };
        const amt = Number(e.amount || 0);
        if (e.direction === 'inflow') byDay[day].inflow += amt;
        else byDay[day].outflow += amt;
      }
      return Object.entries(byDay)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, v]) => ({ label: day, ...v }));
    }

    const byMonth: Record<string, { inflow: number; outflow: number }> = {};
    for (const e of initialEntries) {
      if (e.payment_status !== 'completed') continue;
      const month = e.transaction_date.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { inflow: 0, outflow: 0 };
      const amt = Number(e.amount || 0);
      if (e.direction === 'inflow') byMonth[month].inflow += amt;
      else byMonth[month].outflow += amt;
    }
    return Object.keys(byMonth)
      .sort()
      .slice(-12)
      .map((m) => {
        const [y, mo] = m.split('-').map(Number);
        const label = new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return { label, ...byMonth[m] };
      });
  }, [initialEntries, periodFilteredEntries, periodType, filterMonth, filterYear]);

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

  // Shared filter row — one row above everything it scopes, reused by the
  // Overview/Analytics tabs (which now filter too) and the table tabs.
  const filterPanel = (
    <div className='glass p-4 rounded-lg'>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 items-end'>
        {(currentTab === 'ledger' || currentTab === 'overview' || currentTab === 'reports') && (
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
              <option value='reimbursement'>Reimbursement</option>
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
          <div className='flex items-center justify-between mb-2'>
            <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider'>Period</label>
            <div className='flex rounded-md overflow-hidden border border-gray-700 text-[10px]'>
              <button
                type='button'
                onClick={() => handlePeriodTypeChange('month')}
                className={`px-2 py-0.5 font-semibold transition-colors ${
                  periodType === 'month' ? 'bg-[var(--cyan)] text-black' : 'bg-dark-800 text-gray-400 hover:text-white'
                }`}
              >
                Month
              </button>
              <button
                type='button'
                onClick={() => handlePeriodTypeChange('year')}
                className={`px-2 py-0.5 font-semibold transition-colors ${
                  periodType === 'year' ? 'bg-[var(--cyan)] text-black' : 'bg-dark-800 text-gray-400 hover:text-white'
                }`}
              >
                Year
              </button>
            </div>
          </div>
          {periodType === 'month' ? (
            <MonthPicker
              compact
              value={filterMonth}
              onChange={(next) => {
                setFilterMonth(next);
                applyFilters({ periodType: 'month', month: next });
              }}
            />
          ) : (
            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                applyFilters({ periodType: 'year', year: e.target.value });
              }}
              className='w-full px-3 py-1.5 text-sm rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan'
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>Mode</label>
          <select
            value={filterMode}
            onChange={(e) => {
              setFilterMode(e.target.value);
              applyFilters({ mode: e.target.value });
            }}
            className='w-full px-3 py-1.5 text-sm rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan'
          >
            <option value=''>All Modes</option>
            <option value='Bank Transfer'>Bank Transfer</option>
            <option value='UPI'>UPI</option>
            <option value='Credit Card'>Credit Card</option>
            <option value='Debit Card'>Debit Card</option>
            <option value='Cash'>Cash</option>
            <option value='Cheque'>Cheque</option>
            <option value='PayPal'>PayPal</option>
            <option value='Stripe'>Stripe</option>
            <option value='Other'>Other</option>
          </select>
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
        <div className='flex gap-2'>
          <Button variant='secondary' onClick={handleClearFilters} className='w-full text-xs py-2!'>
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );

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
          {filterPanel}

          {/* Primary KPIs — respect every active filter */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            <StatTile
              label='Total Inflow'
              value={<SensitiveValue>{formatCurrency(stats.totalInflow)}</SensitiveValue>}
              accentClassName='border-green-500'
            />
            <StatTile
              label='Total Outflow'
              value={<span className='text-red-400'><SensitiveValue>{formatCurrency(stats.totalOutflow)}</SensitiveValue></span>}
              accentClassName='border-red-400'
            />
            <StatTile
              label='Net Balance'
              value={
                <span className={stats.netBalance >= 0 ? 'text-cyan' : 'text-orange-400'}>
                  <SensitiveValue>{formatCurrency(stats.netBalance)}</SensitiveValue>
                </span>
              }
              accentClassName='border-cyan'
            />
            <StatTile
              label='Transactions'
              value={stats.transactionCount.toLocaleString('en-IN')}
              sublabel={`Avg ${formatCurrency(stats.avgTransactionValue)} / entry`}
              accentClassName='border-purple'
            />
          </div>

          {/* Secondary KPIs */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            <StatTile
              label='Client Income'
              value={<SensitiveValue>{formatCurrency(stats.clientIncome)}</SensitiveValue>}
              sublabel='From project milestones'
            />
            <StatTile
              label='Investments'
              value={<SensitiveValue>{formatCurrency(stats.investments)}</SensitiveValue>}
              sublabel='Capital injected'
            />
            <StatTile
              label='Payroll Outflow'
              value={<SensitiveValue>{formatCurrency(stats.payrollOutflow)}</SensitiveValue>}
              sublabel='Salary disbursed'
            />
            <StatTile
              label='Pending Approvals'
              value={<span className='text-yellow-400'>{stats.pendingApprovalCount}</span>}
              sublabel={`Worth ${formatCurrency(stats.pendingApprovalAmount)}`}
            />
          </div>

          {/* Cash-flow trend */}
          <div className='glass p-6 rounded-lg'>
            <h3 className='text-sm font-semibold text-white mb-1'>
              {periodType === 'year' ? `Monthly Cash Flow — ${filterYear}` : filterMonth ? 'Daily Cash Flow' : 'Cash Flow Trend'}
            </h3>
            <p className='text-xs text-gray-500 mb-4'>
              {periodType === 'year'
                ? `Inflow vs outflow by month, within ${filterYear}`
                : filterMonth
                ? `Inflow vs outflow by day, within the selected month`
                : `Inflow vs outflow across the last ${trendData.length} month${trendData.length === 1 ? '' : 's'} of activity`}
            </p>
            <TrendChart data={trendData} formatValue={formatCurrency} />
          </div>
        </div>
      )}

      {/* Ledger Table & Lists Tab */}
      {(currentTab === 'ledger' || currentTab === 'income' || currentTab === 'expenses' || currentTab === 'investments') && (
        <div className='space-y-6'>
          {filterPanel}

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
                  'Receipt',
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
                          entry.approval_status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : entry.approval_status === 'rejected'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}
                      >
                        {entry.approval_status || entry.payment_status || 'completed'}
                      </span>
                    </TableCell>
                    <TableCell className='font-bold text-white whitespace-nowrap'><SensitiveValue>{formatCurrency(entry.amount)}</SensitiveValue></TableCell>
                    <TableCell>
                      {entry.receipt_path ? (
                        <button
                          onClick={() => handleViewReceipt(entry.id, entry.receipt_path!)}
                          disabled={viewingReceiptId === entry.id}
                          className='px-2 py-1 rounded text-[10px] font-bold uppercase bg-cyan/10 text-cyan border border-cyan/30 hover:bg-cyan/20 transition-colors disabled:opacity-50'
                        >
                          {viewingReceiptId === entry.id ? 'Opening…' : '📎 View'}
                        </button>
                      ) : (
                        <span className='text-xs text-gray-600'>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {entry.approval_status === 'pending' &&
                          (entry.transaction_type !== 'income' || userRole === 'admin') && (
                            <>
                              <button
                                onClick={() => handleApproval(entry.id, 'approved')}
                                title='Approve'
                                className='px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors'
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproval(entry.id, 'rejected')}
                                title='Reject'
                                className='px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors'
                              >
                                Reject
                              </button>
                            </>
                          )}
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
          {filterPanel}

          {/* Approval pipeline — quick pulse on what needs attention */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            {(['pending', 'approved', 'rejected', 'paid'] as const).map((status) => (
              <StatTile
                key={status}
                label={status[0].toUpperCase() + status.slice(1)}
                value={<SensitiveValue>{formatCurrency(stats.statusBreakdown[status] || 0)}</SensitiveValue>}
                accentClassName={
                  status === 'pending'
                    ? 'border-yellow-500'
                    : status === 'rejected'
                    ? 'border-red-500'
                    : 'border-green-500'
                }
              />
            ))}
          </div>

          {/* Category breakdowns — expense vs income, side by side */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <div className='glass p-6 rounded-lg'>
              <h3 className='text-sm font-semibold text-white mb-1'>Expenses by Category</h3>
              <p className='text-xs text-gray-500 mb-4'>Completed outflows, current filter</p>
              <BarBreakdown items={toBarItems(stats.categoryExpense)} formatValue={formatCurrency} />
            </div>
            <div className='glass p-6 rounded-lg'>
              <h3 className='text-sm font-semibold text-white mb-1'>Income by Category</h3>
              <p className='text-xs text-gray-500 mb-4'>Completed inflows, current filter</p>
              <BarBreakdown items={toBarItems(stats.categoryIncome)} formatValue={formatCurrency} />
            </div>
          </div>

          {/* Payment mode + transaction type breakdowns */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <div className='glass p-6 rounded-lg'>
              <h3 className='text-sm font-semibold text-white mb-1'>By Payment Mode</h3>
              <p className='text-xs text-gray-500 mb-4'>All transaction amounts, current filter</p>
              <BarBreakdown items={toBarItems(stats.modeBreakdown)} formatValue={formatCurrency} emptyLabel='No payment mode recorded' />
            </div>
            <div className='glass p-6 rounded-lg'>
              <h3 className='text-sm font-semibold text-white mb-1'>By Transaction Type</h3>
              <p className='text-xs text-gray-500 mb-4'>Income, expense, payroll, investment, reimbursement</p>
              <BarBreakdown items={toBarItems(stats.typeBreakdown)} formatValue={formatCurrency} />
            </div>
          </div>

          {/* Top vendors / clients */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <div className='glass rounded-lg overflow-hidden'>
              <h3 className='text-sm font-semibold text-white p-6 pb-0 mb-4'>Top Vendors / Payees</h3>
              {Object.keys(stats.vendorTotals).length === 0 ? (
                <p className='text-sm text-gray-500 text-center py-8'>No vendor spend recorded for this filter</p>
              ) : (
                <Table headers={['Vendor / Payee', 'Total Spent']}>
                  {Object.entries(stats.vendorTotals)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([name, amount]) => (
                      <TableRow key={name}>
                        <TableCell className='text-gray-300 font-medium'>{name}</TableCell>
                        <TableCell className='font-bold text-white'><SensitiveValue>{formatCurrency(amount)}</SensitiveValue></TableCell>
                      </TableRow>
                    ))}
                </Table>
              )}
            </div>
            <div className='glass rounded-lg overflow-hidden'>
              <h3 className='text-sm font-semibold text-white p-6 pb-0 mb-4'>Top Clients</h3>
              {Object.keys(stats.clientTotals).length === 0 ? (
                <p className='text-sm text-gray-500 text-center py-8'>No client income recorded for this filter</p>
              ) : (
                <Table headers={['Client', 'Total Income']}>
                  {Object.entries(stats.clientTotals)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([name, amount]) => (
                      <TableRow key={name}>
                        <TableCell className='text-gray-300 font-medium'>{name}</TableCell>
                        <TableCell className='font-bold text-white'><SensitiveValue>{formatCurrency(amount)}</SensitiveValue></TableCell>
                      </TableRow>
                    ))}
                </Table>
              )}
            </div>
          </div>
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
