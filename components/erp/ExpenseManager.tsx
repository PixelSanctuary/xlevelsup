'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ExpenseForm from './ExpenseForm';
import { DeleteIcon } from './ActionIcons';
import MonthPicker from './MonthPicker';
import SensitiveValue from './SensitiveValue';
import type { Expense, Employee } from '@/types/erp';
import { formatCurrency, formatDisplayDate } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import {
  updateExpenseStatusAction,
  deleteExpenseAction,
  markExpenseReimbursedAction,
} from '@/actions/erp/expenses';

interface ExpenseManagerProps {
  expenses: Expense[];
  categories: string[];
  employees: Employee[];
  initialMonth: string;
  initialStatus?: string;
  initialCategory?: string;
  initialPaidBy?: string;
}

export default function ExpenseManager({
  expenses,
  categories,
  employees,
  initialMonth,
  initialStatus,
  initialCategory,
  initialPaidBy,
}: ExpenseManagerProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [status, setStatus] = useState(initialStatus || '');
  const [category, setCategory] = useState(initialCategory || '');
  const [paidBy, setPaidBy] = useState(initialPaidBy || '');

  // Accepts overrides so a field's onChange can push its new value
  // immediately without waiting for the (async) state update to land.
  const applyFilters = (overrides?: Partial<{
    month: string;
    status: string;
    category: string;
    paidBy: string;
  }>) => {
    const next = { month, status, category, paidBy, ...overrides };
    const params = new URLSearchParams();
    if (next.month) params.set('month', next.month);
    if (next.status) params.set('status', next.status);
    if (next.category) params.set('category', next.category);
    if (next.paidBy) params.set('paidBy', next.paidBy);

    router.push(`/erp/expenses${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleStatusChange = async (id: number, newStatus: any) => {
    const result = await updateExpenseStatusAction(id, newStatus);
    if (result.success) {
      toast.success('Status updated successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    const result = await deleteExpenseAction(id);
    if (result.success) {
      toast.success('Expense deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete expense');
    }
  };

  const handleMarkReimbursed = async (id: number) => {
    if (!confirm('Mark this expense as reimbursed?')) return;

    const result = await markExpenseReimbursedAction(id);
    if (result.success) {
      toast.success('Expense marked as reimbursed');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to mark as reimbursed');
    }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = expenses
    .filter((e) => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);
  const reimbursableAmount = expenses
    .filter(
      (e) =>
        (e.status === 'approved' || e.status === 'paid') &&
        !e.reimbursed &&
        e.paid_by !== 'Company',
    )
    .reduce((sum, e) => sum + e.amount, 0);

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  // Sort categories by amount descending
  const sortedBreakdown = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: totalAmount > 0 ? (amt / totalAmount) * 100 : 0,
    }));

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>Expense Tracking</h1>
          <p className='text-gray-400 mt-2'>
            Manage and track all business expenses
          </p>
        </div>
        <Button
          variant='primary'
          onClick={() => setShowAddModal(true)}
          className='whitespace-nowrap'
        >
          + Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* Month — ✕ overlaid inside the input */}
          <div>
            <label className='block text-sm font-medium mb-2'>
              Month
              {!month && (
                <span className='ml-2 text-xs font-normal text-gray-500'>(All)</span>
              )}
            </label>
            <MonthPicker
              value={month}
              onChange={(next) => {
                setMonth(next);
                applyFilters({ month: next });
              }}
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                applyFilters({ status: e.target.value });
              }}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Statuses</option>
              <option value='pending'>Pending</option>
              <option value='approved'>Approved</option>
              <option value='rejected'>Rejected</option>
              <option value='paid'>Paid</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                applyFilters({ category: e.target.value });
              }}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
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
            <label className='block text-sm font-medium mb-2'>Paid By</label>
            <select
              value={paidBy}
              onChange={(e) => {
                setPaidBy(e.target.value);
                applyFilters({ paidBy: e.target.value });
              }}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.name}>
                  {employee.name}
                </option>
              ))}
              <option value='Company'>Company</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Amount</p>
          <p className='text-2xl font-bold text-white mt-1'>
            <SensitiveValue>{formatCurrency(totalAmount)}</SensitiveValue>
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Pending</p>
          <p className='text-2xl font-bold text-yellow-400 mt-1'>
            <SensitiveValue>{formatCurrency(pendingAmount)}</SensitiveValue>
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>To Reimburse</p>
          <p className='text-2xl font-bold text-orange-400 mt-1'>
            <SensitiveValue>{formatCurrency(reimbursableAmount)}</SensitiveValue>
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Count</p>
          <p className='text-2xl font-bold text-cyan mt-1'>{expenses.length}</p>
        </div>
      </div>

      {/* Expense Category Breakdown Chart */}
      {expenses.length > 0 && sortedBreakdown.length > 0 && (
        <div className='glass p-6 rounded-lg mb-6 select-none'>
          <h3 className='text-sm font-semibold text-white mb-4'>Expense Distribution by Category</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 items-center'>
            {/* Left side: Category Progress Bars */}
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

            {/* Right side: SVG Donut Chart */}
            <div className='flex flex-col items-center justify-center'>
              <div className='relative w-36 h-36 flex items-center justify-center'>
                <svg className='w-full h-full transform -rotate-90' viewBox='0 0 36 36'>
                  {/* Base Circle */}
                  <circle cx='18' cy='18' r='15.915' fill='none' stroke='#111115' strokeWidth='4' />
                  {/* Segments */}
                  {(() => {
                    let accumulatedPercent = 0;
                    return sortedBreakdown.map((item, index) => {
                      const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                      const strokeDashoffset = 100 - accumulatedPercent;
                      accumulatedPercent += item.percentage;
                      
                      const colors = [
                        '#00ffff', // cyan
                        '#a855f7', // purple
                        '#3b82f6', // blue
                        '#22c55e', // green
                        '#eab308', // yellow
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
                  <span className='text-lg font-bold text-white'><SensitiveValue>{formatCurrency(totalAmount).split('.')[0]}</SensitiveValue></span>
                  <span className='text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1'>Total Spent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {expenses.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400 mb-4'>No expenses found</p>
            <Button variant='primary' onClick={() => setShowAddModal(true)}>
              Add First Expense
            </Button>
          </div>
        ) : (
          <Table
            headers={[
              'Date',
              'Category',
              'Amount',
              'Paid By',
              'Description',
              'Status',
              'Reimbursement',
              'Actions',
            ]}
          >
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{formatDisplayDate(expense.date)}</TableCell>
                <TableCell>
                  <span className='px-2 py-1 rounded text-xs font-medium bg-purple/20 text-purple'>
                    {expense.category}
                  </span>
                </TableCell>
                <TableCell>
                  <div className='font-medium text-white'>
                    <SensitiveValue>{formatCurrency(expense.amount)}</SensitiveValue>
                  </div>
                  <div className='text-xs text-gray-500'>
                    {expense.payment_mode}
                  </div>
                </TableCell>
                <TableCell>{expense.paid_by}</TableCell>
                <TableCell className='max-w-xs truncate'>
                  {expense.description}
                </TableCell>
                <TableCell>
                  <select
                    value={expense.status}
                    onChange={(e) =>
                      handleStatusChange(expense.id, e.target.value)
                    }
                    className='px-2 py-1 rounded text-xs font-medium bg-dark-800 border border-gray-700 text-white'
                  >
                    <option value='pending'>Pending</option>
                    <option value='approved'>Approved</option>
                    <option value='rejected'>Rejected</option>
                    <option value='paid'>Paid</option>
                  </select>
                </TableCell>
                <TableCell>
                  {expense.reimbursed ? (
                    <span className='px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400'>
                      Reimbursed
                    </span>
                  ) : expense.paid_by === 'Company' ? (
                    <span className='text-xs text-gray-500'>N/A</span>
                  ) : expense.status === 'approved' ||
                    expense.status === 'paid' ? (
                    <button
                      onClick={() => handleMarkReimbursed(expense.id)}
                      className='px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors'
                    >
                      Mark Reimbursed
                    </button>
                  ) : (
                    <span className='text-xs text-gray-500'>Pending</span>
                  )}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    title='Delete'
                    aria-label='Delete'
                    className='text-red-400 hover:text-red-300 transition-colors'
                  >
                    <DeleteIcon />
                  </button>
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
        title='Add Expense'
      >
        <ExpenseForm
          categories={categories}
          employees={employees}
          onSuccess={() => {
            setShowAddModal(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
