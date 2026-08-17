'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { bulkUpdateAttendanceAction } from '@/actions/erp/attendance';
import type { AttendanceStatus, Employee } from '@/types/erp';

interface BulkAttendanceFormProps {
  employees: Employee[];
  onSuccess?: () => void;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half-day', label: 'Half Day' },
  { value: 'paid-leave', label: 'Paid Leave' },
  { value: 'unpaid-leave', label: 'Unpaid Leave' },
  { value: 'holiday', label: 'Holiday' },
];

export default function BulkAttendanceForm({ employees, onSuccess }: BulkAttendanceFormProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<AttendanceStatus | ''>('');
  const [halfDayPeriod, setHalfDayPeriod] = useState<'' | 'first_half' | 'second_half'>('');
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(query) ||
        emp.employee_id.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query),
    );
  }, [employees, search]);

  const allFilteredSelected =
    filteredEmployees.length > 0 && filteredEmployees.every((emp) => selectedIds.has(emp.id));

  const toggleEmployee = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredEmployees.forEach((emp) => next.delete(emp.id));
      } else {
        filteredEmployees.forEach((emp) => next.add(emp.id));
      }
      return next;
    });
  };

  const canSubmit =
    selectedIds.size > 0 &&
    !!startDate &&
    !!endDate &&
    !!status &&
    (status !== 'half-day' || !!halfDayPeriod) &&
    endDate >= startDate &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !status) return;

    setIsSubmitting(true);
    try {
      const result = await bulkUpdateAttendanceAction({
        employeeIds: Array.from(selectedIds),
        startDate,
        endDate,
        status,
        halfDayPeriod: status === 'half-day' ? halfDayPeriod || null : null,
        notes: notes.trim() || null,
        skipWeekends,
      });

      if (result.success) {
        toast.success(
          `Submitted for approval — ${result.employeeCount ?? 0} employee(s), ${result.dateCount ?? 0} date(s). Another admin must approve before it applies.`,
        );
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to bulk update attendance');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-4'>
      {/* Employee multi-select */}
      <div>
        <div className='flex items-center justify-between mb-2'>
          <label className='block text-sm font-medium'>
            Employees <span className='text-red-500'>*</span>{' '}
            <span className='text-gray-500 text-xs font-normal'>({selectedIds.size} selected)</span>
          </label>
          <button
            type='button'
            onClick={toggleSelectAllFiltered}
            className='text-xs text-cyan hover:underline font-medium'
          >
            {allFilteredSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <input
          type='text'
          placeholder='Search by name, ID, or department...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full px-4 py-2 mb-2 rounded-lg bg-dark-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-cyan transition-colors'
        />
        <div className='max-h-48 overflow-y-auto rounded-lg border border-gray-700 divide-y divide-gray-800'>
          {filteredEmployees.length === 0 ? (
            <p className='text-xs text-gray-500 p-3'>No employees found</p>
          ) : (
            filteredEmployees.map((emp) => (
              <label
                key={emp.id}
                className='flex items-center gap-2.5 px-3 py-2 hover:bg-gray-900/40 cursor-pointer'
              >
                <input
                  type='checkbox'
                  checked={selectedIds.has(emp.id)}
                  onChange={() => toggleEmployee(emp.id)}
                  className='w-4 h-4 rounded border-gray-700 bg-dark-800 text-cyan focus:ring-cyan'
                />
                <span className='text-sm text-white'>{emp.name}</span>
                <span className='text-xs text-gray-500'>
                  ({emp.employee_id} · {emp.department})
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Date range */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div>
          <DatePicker label='Start Date' required value={startDate} onChange={setStartDate} />
        </div>
        <div>
          <DatePicker label='End Date' required value={endDate} onChange={setEndDate} minDate={startDate || undefined} />
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <input
          type='checkbox'
          id='skip_weekends'
          checked={skipWeekends}
          onChange={(e) => setSkipWeekends(e.target.checked)}
          className='w-4 h-4 rounded border-gray-700 bg-dark-800 text-cyan focus:ring-cyan'
        />
        <label htmlFor='skip_weekends' className='text-sm text-gray-300 select-none cursor-pointer'>
          Skip weekends (Sat/Sun) in the date range
        </label>
      </div>

      {/* Status */}
      <div>
        <label htmlFor='bulk_status' className='block text-sm font-medium mb-2'>
          Set Status To <span className='text-red-500'>*</span>
        </label>
        <select
          id='bulk_status'
          required
          value={status}
          onChange={(e) => {
            const next = e.target.value as AttendanceStatus;
            setStatus(next);
            if (next !== 'half-day') setHalfDayPeriod('');
          }}
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        >
          <option value=''>Select Status</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Half-day period — required whenever the bulk status is Half Day */}
      {status === 'half-day' && (
        <div>
          <label htmlFor='bulk_half_day_period' className='block text-sm font-medium mb-2'>
            Which Half? <span className='text-red-500'>*</span>
          </label>
          <select
            id='bulk_half_day_period'
            required
            value={halfDayPeriod}
            onChange={(e) => setHalfDayPeriod(e.target.value as 'first_half' | 'second_half')}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value=''>Select half</option>
            <option value='first_half'>First Half (Morning)</option>
            <option value='second_half'>Second Half (Afternoon)</option>
          </select>
          <p className='text-xs text-gray-500 mt-1'>Applied to every record in this bulk update.</p>
        </div>
      )}

      {/* Notes */}
      <div>
        <label htmlFor='bulk_notes' className='block text-sm font-medium mb-2'>
          Notes (Optional)
        </label>
        <textarea
          id='bulk_notes'
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          placeholder='Applied to every record created/updated by this bulk action...'
        />
      </div>

      <div className='bg-blue-900/20 border border-blue-700/30 rounded-lg p-3'>
        <p className='text-xs text-blue-300'>
          <strong>Note:</strong> This proposes creating a new attendance record for any
          employee/date that doesn&apos;t have one yet, and overwriting the status on any that
          already exist — but nothing is applied until a <em>different</em> admin approves it.
        </p>
      </div>

      <Button
        type='button'
        variant='primary'
        className='w-full'
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
      </Button>
    </div>
  );
}
