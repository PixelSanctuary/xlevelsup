'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ClientFinanceForm from './ClientFinanceForm';
import { EditIcon, DeleteIcon } from './ActionIcons';
import MonthPicker from './MonthPicker';
import SensitiveValue from './SensitiveValue';
import type { ClientTransaction } from '@/types/finance';
import {
  formatCurrency,
  formatDisplayDate,
  getCurrentMonth,
} from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import { deleteClientTransactionAction, recordTransactionPaymentAction } from '@/actions/erp/client-finances';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types/finance';

interface ClientFinanceManagerProps {
  transactions: ClientTransaction[];
  clients: string[];
  initialMonth: string;
  initialType?: string;
  initialClient?: string;
  initialCategory?: string;
  initialStatus?: string;
  summary: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    pendingIncome: number;
    pendingExpense: number;
    advanceIncome: number;
    pendingFromAdvance: number;
  };
}

export default function ClientFinanceManager({
  transactions,
  clients,
  initialMonth,
  initialType,
  initialClient,
  initialCategory,
  initialStatus,
  summary,
}: ClientFinanceManagerProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ClientTransaction | null>(null);
  
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [recordPaymentTransaction, setRecordPaymentTransaction] = useState<ClientTransaction | null>(null);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [month, setMonth] = useState(initialMonth);
  const [type, setType] = useState(initialType || '');
  const [client, setClient] = useState(initialClient || '');
  const [category, setCategory] = useState(initialCategory || '');
  const [status, setStatus] = useState(initialStatus || '');

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    params.set('month', month);
    if (type) params.set('type', type);
    if (client) params.set('client', client);
    if (category) params.set('category', category);
    if (status) params.set('status', status);

    router.push(`/erp/client-finances?${params.toString()}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    const result = await deleteClientTransactionAction(id);
    if (result.success) {
      toast.success('Transaction deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete transaction');
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordPaymentTransaction) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid positive payment amount');
      return;
    }

    setIsSubmittingPayment(true);
    const result = await recordTransactionPaymentAction(recordPaymentTransaction.id, amt);
    setIsSubmittingPayment(false);

    if (result.success) {
      toast.success('Payment recorded successfully!');
      setShowRecordPaymentModal(false);
      setRecordPaymentTransaction(null);
      setPaymentAmount('');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to record payment');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-500/20 text-green-400',
      advance: 'bg-blue-500/20 text-blue-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      cancelled: 'bg-gray-500/20 text-gray-400',
    };
    const labels: Record<string, string> = {
      completed: '✓ Full Payment',
      advance: '◑ Advance',
      pending: '⏳ Pending',
      cancelled: '✕ Cancelled',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>Client Finances</h1>
          <p className='text-gray-400 mt-2'>
            Track income and expenses for client projects
          </p>
        </div>
        <Button
          variant='primary'
          onClick={() => setShowAddModal(true)}
          className='whitespace-nowrap'
        >
          + Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-6 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Month</label>
            <MonthPicker value={month} onChange={setMonth} />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Types</option>
              <option value='income'>Income</option>
              <option value='expense'>Expense</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Client</label>
            <select
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Clients</option>
              {clients.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Statuses</option>
              <option value='completed'>Full Payment</option>
              <option value='advance'>Advance Received</option>
              <option value='pending'>Pending</option>
              <option value='cancelled'>Cancelled</option>
            </select>
          </div>
          <div className='flex items-end'>
            <Button
              variant='secondary'
              onClick={handleFilterChange}
              className='w-full'
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Income</p>
          <p className='text-2xl font-bold text-green-400 mt-1'>
            <SensitiveValue>{formatCurrency(summary.totalIncome)}</SensitiveValue>
          </p>
          <p className='text-xs text-gray-500 mt-1'>Total received (Full + Advances)</p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Expense</p>
          <p className='text-2xl font-bold text-red-400 mt-1'>
            <SensitiveValue>{formatCurrency(summary.totalExpense)}</SensitiveValue>
          </p>
          <p className='text-xs text-gray-500 mt-1'>Completed expenses</p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Net Profit</p>
          <p
            className={`text-2xl font-bold mt-1 ${summary.netProfit >= 0 ? 'text-cyan' : 'text-red-400'}`}
          >
            <SensitiveValue>{formatCurrency(summary.netProfit)}</SensitiveValue>
          </p>
          <p className='text-xs text-gray-500 mt-1'>Income − Expense</p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Pending Income</p>
          <p className='text-2xl font-bold text-yellow-400 mt-1'>
            <SensitiveValue>{formatCurrency(summary.pendingIncome)}</SensitiveValue>
          </p>
          <p className='text-xs text-gray-500 mt-1'>Total pending (Pending + Balances)</p>
        </div>
      </div>

      <div className='mb-6' />

      {/* Cashflow Comparison Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 select-none'>
        {/* SVG/CSS Bar Chart Card */}
        <div className='glass p-6 rounded-lg lg:col-span-2 flex flex-col justify-between'>
          <div>
            <h3 className='text-sm font-semibold text-white mb-4'>Monthly Cashflow Comparison</h3>
            <div className='space-y-4'>
              {/* Income Bar */}
              <div>
                <div className='flex justify-between text-xs mb-1.5'>
                  <span className='text-gray-400'>Total Income</span>
                  <span className='text-green-400 font-semibold'><SensitiveValue>{formatCurrency(summary.totalIncome)}</SensitiveValue></span>
                </div>
                <div className='w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-800/80'>
                  <div
                    className='h-full bg-green-500 transition-all duration-500'
                    style={{
                      width: `${
                        summary.totalIncome + summary.totalExpense > 0
                          ? (summary.totalIncome / (summary.totalIncome + summary.totalExpense)) * 100
                          : 50
                      }%`,
                    }}
                  />
                </div>
              </div>
              
              {/* Expense Bar */}
              <div>
                <div className='flex justify-between text-xs mb-1.5'>
                  <span className='text-gray-400'>Total Expense</span>
                  <span className='text-red-400 font-semibold'><SensitiveValue>{formatCurrency(summary.totalExpense)}</SensitiveValue></span>
                </div>
                <div className='w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-800/80'>
                  <div
                    className='h-full bg-red-500 transition-all duration-500'
                    style={{
                      width: `${
                        summary.totalIncome + summary.totalExpense > 0
                          ? (summary.totalExpense / (summary.totalIncome + summary.totalExpense)) * 100
                          : 50
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className='flex items-center justify-between text-xs text-gray-500 mt-6 pt-4 border-t border-gray-800/80'>
            <span>Ratio: {summary.totalIncome + summary.totalExpense > 0 ? ((summary.totalIncome / (summary.totalIncome + summary.totalExpense)) * 100).toFixed(0) : 0}% Income / {summary.totalIncome + summary.totalExpense > 0 ? ((summary.totalExpense / (summary.totalIncome + summary.totalExpense)) * 100).toFixed(0) : 0}% Expense</span>
            <span className={summary.netProfit >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
              Net Profit: <SensitiveValue>{formatCurrency(summary.netProfit)}</SensitiveValue>
            </span>
          </div>
        </div>

        {/* Operating Margin Donut Chart */}
        <div className='glass p-6 rounded-lg flex flex-col items-center justify-center text-center'>
          <h3 className='text-sm font-semibold text-white mb-4 self-start'>Operating Margin</h3>
          <div className='relative w-32 h-32 flex items-center justify-center'>
            <svg className='w-full h-full transform -rotate-90' viewBox='0 0 36 36'>
              {/* Background circle */}
              <circle
                cx='18'
                cy='18'
                r='15.915'
                fill='none'
                stroke='#111115'
                strokeWidth='3.5'
              />
              {/* Foreground circle */}
              <circle
                cx='18'
                cy='18'
                r='15.915'
                fill='none'
                stroke={summary.netProfit >= 0 ? '#00ffff' : '#ef4444'}
                strokeWidth='3.5'
                strokeDasharray={`${
                  summary.totalIncome > 0
                    ? Math.max(0, Math.min(100, (summary.netProfit / summary.totalIncome) * 100))
                    : 0
                } ${
                  100 -
                  Math.max(0, Math.min(100, (summary.netProfit / (summary.totalIncome || 1)) * 100))
                }`}
              />
            </svg>
            <div className='absolute flex flex-col items-center justify-center'>
              <span className='text-xl font-bold text-white'>
                {summary.totalIncome > 0
                  ? `${Math.max(0, Math.round((summary.netProfit / summary.totalIncome) * 100))}%`
                  : '0%'}
              </span>
              <span className='text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1'>Profit Margin</span>
            </div>
          </div>
          <p className='text-xs text-gray-400 mt-4 leading-relaxed'>
            Operating profit margins indicate the efficiency of client contract conversions.
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {transactions.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400 mb-4'>No transactions found</p>
            <Button variant='primary' onClick={() => setShowAddModal(true)}>
              Add First Transaction
            </Button>
          </div>
        ) : (
          <Table
            headers={[
              'Date',
              'Type',
              'Client / Ref #',
              'Project',
              'Category',
              'Amount',
              'Advance',
              'Pending',
              'Status',
              'Actions',
            ]}
          >
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {formatDisplayDate(transaction.transaction_date)}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.type === 'income'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {transaction.type === 'income' ? '↑ Income' : '↓ Expense'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className='font-medium text-white'>
                    {transaction.client_name}
                  </div>
                  {(transaction.reference_number || transaction.invoice_number) && (
                    <div className='text-xs text-gray-500 font-mono'>
                      {transaction.reference_number || transaction.invoice_number}
                    </div>
                  )}
                </TableCell>
                <TableCell className='max-w-xs truncate'>
                  {transaction.project_name || '-'}
                </TableCell>
                <TableCell>
                  <span className='px-2 py-1 rounded text-xs font-medium bg-purple/20 text-purple'>
                    {transaction.category}
                  </span>
                </TableCell>
                <TableCell>
                  <div
                    className={`font-bold ${
                      transaction.type === 'income'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    <SensitiveValue>{formatCurrency(transaction.amount)}</SensitiveValue>
                  </div>
                  {transaction.payment_mode && (
                    <div className='text-xs text-gray-500'>
                      {transaction.payment_mode}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.advance_amount ? (
                    <span className='text-blue-400 font-semibold'>
                      <SensitiveValue>{formatCurrency(transaction.advance_amount)}</SensitiveValue>
                    </span>
                  ) : (
                    <span className='text-gray-600'>—</span>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.pending_amount != null && transaction.pending_amount > 0 ? (
                    <span className='text-orange-400 font-semibold'>
                      <SensitiveValue>{formatCurrency(transaction.pending_amount)}</SensitiveValue>
                    </span>
                  ) : transaction.payment_status === 'pending' ? (
                    <span className='text-yellow-400 font-semibold'>
                      <SensitiveValue>{formatCurrency(transaction.amount)}</SensitiveValue>
                    </span>
                  ) : (
                    <span className='text-gray-600'>—</span>
                  )}
                </TableCell>
                <TableCell>
                  {getStatusBadge(transaction.payment_status)}
                </TableCell>
                <TableCell>
                  <div className='flex flex-wrap items-center gap-2'>
                    {transaction.type === 'income' && (transaction.payment_status === 'pending' || transaction.payment_status === 'advance') && (
                      <button
                        onClick={() => {
                          setRecordPaymentTransaction(transaction);
                          setShowRecordPaymentModal(true);
                        }}
                        className='text-cyan hover:text-cyan/80 transition-colors text-xs font-semibold bg-cyan/10 px-2.5 py-1 rounded border border-cyan/20 hover:border-cyan/30'
                        title="Record payment toward pending balance"
                      >
                        Record Payment
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingTransaction(transaction);
                        setShowEditModal(true);
                      }}
                      title='Edit'
                      aria-label='Edit'
                      className='text-purple hover:text-purple/80 transition-colors bg-purple/10 p-1.5 rounded border border-purple/20 hover:border-purple/30'
                    >
                      <EditIcon className='w-3.5 h-3.5' />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      title='Delete'
                      aria-label='Delete'
                      className='text-red-400 hover:text-red-300 transition-colors bg-red-500/10 p-1.5 rounded border border-red-500/20 hover:border-red-500/30'
                    >
                      <DeleteIcon className='w-3.5 h-3.5' />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title='Add Transaction'
      >
        <ClientFinanceForm
          clients={clients}
          onSuccess={() => {
            setShowAddModal(false);
            router.refresh();
          }}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTransaction(null);
        }}
        title='Edit Transaction'
      >
        {editingTransaction && (
          <ClientFinanceForm
            clients={clients}
            transaction={editingTransaction}
            onSuccess={() => {
              setShowEditModal(false);
              setEditingTransaction(null);
              router.refresh();
            }}
          />
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showRecordPaymentModal}
        onClose={() => {
          setShowRecordPaymentModal(false);
          setRecordPaymentTransaction(null);
          setPaymentAmount('');
        }}
        title="Record Payment Received"
      >
        {recordPaymentTransaction && (
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
            <div className="bg-dark-800 p-4 rounded-lg border border-gray-700/50 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Client:</span>
                <span className="text-white font-semibold">{recordPaymentTransaction.client_name}</span>
              </div>
              {recordPaymentTransaction.project_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Project:</span>
                  <span className="text-white">{recordPaymentTransaction.project_name}</span>
                </div>
              )}
              <div className="border-t border-gray-700/50 my-2 pt-2 flex justify-between text-sm">
                <span className="text-gray-400">Total Transaction Amount:</span>
                <span className="text-white font-bold"><SensitiveValue>{formatCurrency(recordPaymentTransaction.amount)}</SensitiveValue></span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Already Received:</span>
                <span className="text-green-400 font-semibold">
                  <SensitiveValue>{formatCurrency(recordPaymentTransaction.advance_amount ?? 0)}</SensitiveValue>
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Remaining Pending:</span>
                <span className="text-orange-400 font-semibold">
                  <SensitiveValue>
                    {formatCurrency(
                      recordPaymentTransaction.payment_status === 'pending'
                        ? recordPaymentTransaction.amount
                        : (recordPaymentTransaction.pending_amount ?? 0)
                    )}
                  </SensitiveValue>
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="payment_amount" className="block text-sm font-medium mb-2">
                New Payment Amount Received (₹) *
              </label>
              <input
                type="number"
                id="payment_amount"
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the amount received in this installment. If it equals or exceeds the remaining balance, the transaction status will be marked as Completed.
              </p>
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowRecordPaymentModal(false);
                  setRecordPaymentTransaction(null);
                  setPaymentAmount('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isSubmittingPayment}
              >
                {isSubmittingPayment ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
