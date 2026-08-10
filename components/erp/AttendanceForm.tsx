'use client';

import { useFormStatus } from 'react-dom';
import { useState, useEffect, useActionState, useRef } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { saveAttendanceAction } from '@/actions/erp/attendance';
import { restoreFormValues } from '@/lib/utils/form';
import type { Employee } from '@/types/erp';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type='submit'
      variant='primary'
      className='w-full'
      disabled={pending}
    >
      {pending ? 'Saving...' : 'Save Attendance'}
    </Button>
  );
}

interface AttendanceFormProps {
  employees: Employee[];
  onSuccess?: () => void;
}

export default function AttendanceForm({
  employees,
  onSuccess,
}: AttendanceFormProps) {
  const [status, setStatus] = useState('');
  const [halfDayPeriod, setHalfDayPeriod] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const lastFormData = useRef<FormData | null>(null);

  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      lastFormData.current = formData;
      return await saveAttendanceAction(formData);
    },
    { success: false },
  );

  useEffect(() => {
    if (state.success) {
      toast.success('Attendance saved successfully!', {
        duration: 2000,
        position: 'top-center',
      });
      onSuccess?.();
    } else if (state.error) {
      toast.error(state.error, {
        duration: 3000,
        position: 'top-center',
      });
      // React resets uncontrolled fields once the action resolves, even
      // though this is an error — put the user's input back.
      restoreFormValues(formRef.current, lastFormData.current);
    }
  }, [state, onSuccess]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <form ref={formRef} action={formAction} className='space-y-4'>
      <div>
        <label htmlFor='employee_id' className='block text-sm font-medium mb-2'>
          Employee *
        </label>
        <select
          id='employee_id'
          name='employee_id'
          required
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        >
          <option value=''>Select Employee</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} ({emp.employee_id})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor='date' className='block text-sm font-medium mb-2'>
          Date *
        </label>
        <input
          type='date'
          id='date'
          name='date'
          required
          defaultValue={today}
          max={today}
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>

      <div>
        <label htmlFor='status' className='block text-sm font-medium mb-2'>
          Status *
        </label>
        <select
          id='status'
          name='status'
          required
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            if (e.target.value !== 'half-day') setHalfDayPeriod('');
          }}
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        >
          <option value=''>Select Status</option>
          <option value='present'>Present</option>
          <option value='absent'>Absent</option>
          <option value='half-day'>Half Day</option>
          <option value='paid-leave'>Paid Leave</option>
          <option value='unpaid-leave'>Unpaid Leave</option>
          <option value='holiday'>Holiday</option>
        </select>
      </div>

      {status === 'half-day' && (
        <div>
          <label htmlFor='half_day_period' className='block text-sm font-medium mb-2'>
            Which Half? *
          </label>
          <select
            id='half_day_period'
            name='half_day_period'
            required
            value={halfDayPeriod}
            onChange={(e) => setHalfDayPeriod(e.target.value)}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value=''>Select half</option>
            <option value='first_half'>First Half (Morning)</option>
            <option value='second_half'>Second Half (Afternoon)</option>
          </select>
        </div>
      )}

      <div>
        <label
          htmlFor='overtime_hours'
          className='block text-sm font-medium mb-2'
        >
          Overtime Hours (Optional)
        </label>
        <input
          type='number'
          id='overtime_hours'
          name='overtime_hours'
          min='0'
          max='24'
          step='0.5'
          placeholder='e.g., 2.5'
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
        <p className='text-xs text-gray-400 mt-1'>
          💡 8 OT hours = 1 earned leave day
        </p>
      </div>

      <div>
        <label htmlFor='notes' className='block text-sm font-medium mb-2'>
          Notes (Optional)
        </label>
        <textarea
          id='notes'
          name='notes'
          rows={3}
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          placeholder='Any additional notes...'
        />
      </div>

      <div className='pt-4'>
        <SubmitButton />
      </div>
    </form>
  );
}
