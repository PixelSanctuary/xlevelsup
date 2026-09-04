'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { DeleteIcon } from './ActionIcons';
import MonthPicker from './MonthPicker';
import SensitiveValue from './SensitiveValue';
import type { PayrollWithEmployee } from '@/types/erp';
import { formatCurrency, getMonthName } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import {
  generatePayrollAction,
  updatePayrollStatusAction,
  deletePayrollAction,
  deletePayrollForMonthAction,
} from '@/actions/erp/payroll';

interface PayrollManagerProps {
  payroll: PayrollWithEmployee[];
  initialMonth: string;
  initialStatus?: string;
}

/**
 * Unpaid days behind a record — working days the employee wasn't paid for.
 * Derived rather than stored: the payroll table has no lop column, so this
 * mirrors computeNetSalary() in lib/erp/utils.ts.
 */
function lopDaysOf(record: PayrollWithEmployee): number {
  return Math.max(0, record.total_working_days - record.payable_days);
}

/** Rupee value of those unpaid days — the gap between gross and net. */
function lopDeductionOf(record: PayrollWithEmployee): number {
  return record.per_day_salary * lopDaysOf(record);
}

export default function PayrollManager({
  payroll,
  initialMonth,
  initialStatus,
}: PayrollManagerProps) {
  const router = useRouter();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDeleteMonthModal, setShowDeleteMonthModal] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [status, setStatus] = useState(initialStatus || '');
  const [generating, setGenerating] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(initialMonth);
  const [deleteMonthValue, setDeleteMonthValue] = useState(initialMonth);
  const [deletingMonth, setDeletingMonth] = useState(false);

  const applyFilters = (overrides?: Partial<{ month: string; status: string }>) => {
    const next = { month, status, ...overrides };
    const params = new URLSearchParams();
    params.set('month', next.month);
    if (next.status) params.set('status', next.status);

    router.push(`/erp/payroll?${params.toString()}`);
  };

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGenerating(true);

    const formData = new FormData(e.currentTarget);
    const result = await generatePayrollAction(formData);

    setGenerating(false);

    if (result.success) {
      toast.success(
        `Payroll generated! ${result.payroll.generated} records created, ${result.payroll.skipped} skipped`,
        { duration: 3000 },
      );
      setShowGenerateModal(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to generate payroll');
    }
  };

  const handleStatusChange = async (
    id: number,
    newStatus: 'draft' | 'approved' | 'paid',
  ) => {
    const result = await updatePayrollStatusAction(id, newStatus);
    if (result.success) {
      toast.success('Status updated successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payroll record?'))
      return;

    const result = await deletePayrollAction(id);
    if (result.success) {
      toast.success('Payroll deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete payroll');
    }
  };

  const handleDeleteMonth = async () => {
    if (!deleteMonthValue) {
      toast.error('Select a month');
      return;
    }

    const monthLabel = getMonthName(deleteMonthValue);
    if (
      !confirm(
        `This will permanently delete ALL payroll records (draft, approved, and paid) for ${monthLabel}. Any linked financial ledger entries will be unlinked, not deleted. This cannot be undone. Continue?`,
      )
    ) {
      return;
    }

    setDeletingMonth(true);
    const result = await deletePayrollForMonthAction(deleteMonthValue);
    setDeletingMonth(false);

    if (result.success) {
      toast.success(
        `Deleted ${result.payroll.deletedCount} payroll record(s) for ${monthLabel}. You can now generate fresh ones for this month.`,
        { duration: 4000 },
      );
      setShowDeleteMonthModal(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete payroll for month');
    }
  };

  const totalPayable = payroll.reduce((sum, p) => sum + p.net_salary, 0);

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>
            Payroll Management
          </h1>
          <p className='text-gray-400 mt-2'>
            Generate and manage employee salaries
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='secondary'
            onClick={() => {
              setDeleteMonthValue(month);
              setShowDeleteMonthModal(true);
            }}
            className='whitespace-nowrap !text-red-400 !outline-red-500/60 hover:!outline-red-400'
          >
            Delete Month
          </Button>
          <Button
            variant='primary'
            onClick={() => {
              setGenerateMonth(month);
              setShowGenerateModal(true);
            }}
            className='whitespace-nowrap'
          >
            Generate Payroll
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className='glass p-4 rounded-lg mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>Month</label>
            <MonthPicker
              value={month}
              onChange={(next) => {
                setMonth(next);
                applyFilters({ month: next });
              }}
              required
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
              <option value='draft'>Draft</option>
              <option value='approved'>Approved</option>
              <option value='paid'>Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Records</p>
          <p className='text-2xl font-bold text-white mt-1'>{payroll.length}</p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Payable</p>
          <p className='text-2xl font-bold text-cyan mt-1'>
            <SensitiveValue>{formatCurrency(totalPayable)}</SensitiveValue>
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Approved</p>
          <p className='text-2xl font-bold text-green-400 mt-1'>
            {payroll.filter((p) => p.status === 'approved').length}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Paid</p>
          <p className='text-2xl font-bold text-blue-400 mt-1'>
            {payroll.filter((p) => p.status === 'paid').length}
          </p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className='glass rounded-lg overflow-hidden'>
        {payroll.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-400 mb-4'>No payroll records found</p>
            <Button
              variant='primary'
              onClick={() => setShowGenerateModal(true)}
            >
              Generate Payroll
            </Button>
          </div>
        ) : (
          <Table
            headers={[
              'Employee',
              'Department',
              'Working Days',
              'Payable Days',
              'Gross Salary',
              'Net Salary',
              'Status',
              'Actions',
            ]}
          >
            {payroll.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <div className='font-medium text-white'>
                    {record.employee_name}
                  </div>
                  <div className='text-xs text-gray-500'>
                    {record.employee_role}
                  </div>
                </TableCell>
                <TableCell>{record.employee_department}</TableCell>
                <TableCell>{record.total_working_days}</TableCell>
                <TableCell>
                  {record.payable_days.toFixed(1)}
                  <div className='text-xs text-gray-500'>
                    P:{record.present_days} H:{record.half_days} L:
                    {record.paid_leave_days}
                    {lopDaysOf(record) > 0 &&
                      ` A:${lopDaysOf(record).toFixed(1)}`}
                  </div>
                </TableCell>
                <TableCell><SensitiveValue>{formatCurrency(record.gross_salary)}</SensitiveValue></TableCell>
                <TableCell>
                  <div className='font-medium text-white'>
                    <SensitiveValue>{formatCurrency(record.net_salary)}</SensitiveValue>
                  </div>
                  {(record.bonus > 0 ||
                    record.deduction > 0 ||
                    lopDeductionOf(record) > 0) && (
                    <div className='text-xs text-gray-500'>
                      <SensitiveValue>
                        {lopDeductionOf(record) > 0 &&
                          `-${formatCurrency(lopDeductionOf(record))} LOP `}
                        {record.bonus > 0 && `+${formatCurrency(record.bonus)} `}
                        {record.deduction > 0 &&
                          `-${formatCurrency(record.deduction)}`}
                      </SensitiveValue>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <select
                    value={record.status}
                    onChange={(e) =>
                      handleStatusChange(record.id, e.target.value as any)
                    }
                    className='px-2 py-1 rounded text-xs font-medium bg-dark-800 border border-gray-700 text-white'
                  >
                    <option value='draft'>Draft</option>
                    <option value='approved'>Approved</option>
                    <option value='paid'>Paid</option>
                  </select>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleDelete(record.id)}
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

      {/* Generate Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title='Generate Payroll'
      >
        <form onSubmit={handleGenerate} className='space-y-4'>
          <p className='text-gray-300'>
            This will generate payroll records for all active employees for the
            selected month. Existing records will be skipped.
          </p>
          <div>
            <label className='block text-sm font-medium mb-2'>Month *</label>
            <MonthPicker value={generateMonth} onChange={setGenerateMonth} name='month' required />
          </div>
          <Button
            type='submit'
            variant='primary'
            className='w-full'
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Payroll'}
          </Button>
        </form>
      </Modal>

      {/* Delete Month Modal */}
      <Modal
        isOpen={showDeleteMonthModal}
        onClose={() => setShowDeleteMonthModal(false)}
        title='Delete Payroll for Month'
      >
        <div className='space-y-4'>
          <p className='text-gray-300'>
            This permanently deletes every payroll record for the selected
            month, regardless of status (draft, approved, or paid). Use this
            when you need to re-run payroll for a month from scratch — after
            deleting, use <span className='font-medium text-white'>Generate Payroll</span>{' '}
            to create fresh records for the same month.
          </p>
          <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300'>
            This cannot be undone. Financial ledger entries linked to deleted
            records will be unlinked, not deleted.
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Month *</label>
            <MonthPicker
              value={deleteMonthValue}
              onChange={setDeleteMonthValue}
              required
            />
          </div>
          <Button
            type='button'
            variant='secondary'
            className='w-full !text-red-400 !outline-red-500/60 hover:!outline-red-400'
            disabled={deletingMonth}
            onClick={handleDeleteMonth}
          >
            {deletingMonth ? 'Deleting...' : 'Delete Payroll for Month'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
