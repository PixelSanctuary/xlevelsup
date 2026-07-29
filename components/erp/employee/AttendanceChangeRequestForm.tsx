'use client';

/**
 * Attendance Change Request Form Component
 */

import { useActionState, useEffect, useState } from 'react';
import {
  createAttendanceChangeRequestAction,
  createAttendanceRegularisationRequestAction,
} from '@/actions/erp/attendance-change-requests';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { toast } from 'react-hot-toast';
import type { AttendanceRegularisationType } from '@/types/erp';

interface AttendanceChangeRequestFormProps {
  employeeId: number;
  initialDate?: string;
  initialIsMissed?: boolean;
  /** Populated when a day with an existing attendance record was picked from the calendar. */
  initialAttendanceId?: number | null;
  initialCurrentStatus?: string | null;
}

export default function AttendanceChangeRequestForm({
  employeeId,
  initialDate,
  initialIsMissed,
  initialAttendanceId,
  initialCurrentStatus,
}: AttendanceChangeRequestFormProps) {
  const [requestedStatus, setRequestedStatus] = useState(initialIsMissed ? 'present' : '');
  const [halfDayPeriod, setHalfDayPeriod] = useState('');
  const [selectedDate, setSelectedDate] = useState(initialDate || '');
  const [clockInTime, setClockInTime] = useState('');
  const [clockOutTime, setClockOutTime] = useState('');
  const [attendanceId, setAttendanceId] = useState<number | null>(initialAttendanceId ?? null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(initialCurrentStatus ?? null);

  // Handle updates to props (e.g. a date picked from the calendar)
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
      setClockInTime('');
      setClockOutTime('');
    }
    if (initialIsMissed) {
      setRequestedStatus('present');
    }
    setAttendanceId(initialAttendanceId ?? null);
    setCurrentStatus(initialCurrentStatus ?? null);
  }, [initialDate, initialIsMissed, initialAttendanceId, initialCurrentStatus]);

  const handleFormAction = async (prevState: any, formData: FormData) => {
    // Validate date selection
    if (!selectedDate) {
      return { success: false, error: 'Please select a date' };
    }

    formData.set('request_date', selectedDate);

    const hasClockIn = requestedStatus === 'present' && !!clockInTime;
    const hasClockOut = requestedStatus === 'present' && !!clockOutTime;

    if (hasClockIn || hasClockOut) {
      // Clock times were provided — route through the regularisation
      // pipeline instead of the plain status-change one, since that's the
      // path that already knows how to create a new attendance record (and
      // time log) for the day when none exists yet.
      const requestType: AttendanceRegularisationType =
        hasClockIn && hasClockOut
          ? 'missed_both'
          : hasClockIn
            ? 'missed_clock_in'
            : 'missed_clock_out';

      formData.set('request_type', requestType);
      if (hasClockIn) {
        formData.set('requested_clock_in_time', new Date(`${selectedDate}T${clockInTime}`).toISOString());
      }
      if (hasClockOut) {
        formData.set('requested_clock_out_time', new Date(`${selectedDate}T${clockOutTime}`).toISOString());
      }

      return await createAttendanceRegularisationRequestAction(
        employeeId,
        prevState,
        formData,
      );
    }

    return await createAttendanceChangeRequestAction(
      employeeId,
      prevState,
      formData,
    );
  };

  const [state, formAction] = useActionState(handleFormAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success('Change request submitted successfully!');
      // Reset form
      const form = document.getElementById(
        'change-request-form',
      ) as HTMLFormElement;
      if (form) {
        form.reset();
        setRequestedStatus('');
        setHalfDayPeriod('');
        setSelectedDate('');
        setClockInTime('');
        setClockOutTime('');
        setAttendanceId(null);
        setCurrentStatus(null);
      }
      // Reload page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form id='change-request-form' action={formAction} className='space-y-4'>
      {/* Request Date - Calendar Picker */}
      <DatePicker
        label='Date'
        value={selectedDate}
        onChange={setSelectedDate}
        maxDate={(() => {
          // Local getters, not toISOString() — the latter converts to UTC
          // first, which shifts the date by a day in timezones ahead of UTC (e.g. IST).
          const d = new Date();
          d.setDate(d.getDate() - 1);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })()}
        required
        placeholder='Select the date for attendance change'
        helperText='Select the date for attendance change'
      />

      {/* Hidden field for form submission */}
      <input type='hidden' name='request_date' value={selectedDate} />

      {/* Hidden fields for modification requests (populated when a day is picked from the calendar) */}
      <input type='hidden' name='current_status' value={currentStatus || ''} />
      <input type='hidden' name='attendance_id' value={attendanceId ?? ''} />

      {/* Requested Status */}
      <div>
        <label
          htmlFor='requested_status'
          className='block text-sm font-medium mb-2'
        >
          Requested Status <span className='text-red-500'>*</span>
        </label>
        <select
          id='requested_status'
          name='requested_status'
          required
          value={requestedStatus}
          onChange={(e) => {
            setRequestedStatus(e.target.value);
            if (e.target.value !== 'half-day') setHalfDayPeriod('');
          }}
          className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white'
        >
          <option value=''>Select status</option>
          <option value='present'>Present</option>
          <option value='absent'>Absent</option>
          <option value='half-day'>Half Day</option>
          <option value='paid-leave'>Paid Leave</option>
          <option value='unpaid-leave'>Unpaid Leave</option>
          <option value='holiday'>Holiday</option>
        </select>
      </div>

      {/* Half Day Period (only shown when Half Day is selected) */}
      {requestedStatus === 'half-day' && (
        <div>
          <label htmlFor='half_day_period' className='block text-sm font-medium mb-2'>
            Which Half? <span className='text-red-500'>*</span>
          </label>
          <select
            id='half_day_period'
            name='half_day_period'
            required
            value={halfDayPeriod}
            onChange={(e) => setHalfDayPeriod(e.target.value)}
            className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white'
          >
            <option value=''>Select half</option>
            <option value='first_half'>First Half (Morning)</option>
            <option value='second_half'>Second Half (Afternoon)</option>
          </select>
        </div>
      )}

      {/* Leave Type (only shown when Paid Leave is selected) */}
      {requestedStatus === 'paid-leave' && (
        <div>
          <label
            htmlFor='leave_type'
            className='block text-sm font-medium mb-2'
          >
            Leave Type <span className='text-red-500'>*</span>
          </label>
          <select
            id='leave_type'
            name='leave_type'
            required
            className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white'
          >
            <option value=''>Select leave type</option>
            <option value='sick'>Sick Leave</option>
            <option value='casual'>Casual Leave</option>
            <option value='floater'>Floater Leave</option>
            <option value='earned'>Earned Leave (OT)</option>
            <option value='maternity'>Maternity Leave</option>
            <option value='paternity'>Paternity Leave</option>
            <option value='other'>Other</option>
          </select>
          <p className='text-xs text-gray-500 mt-1'>
            Select which leave balance to deduct from
          </p>
        </div>
      )}

      {/* Clock-In / Clock-Out Time — optional, for missed or incorrect punches on this day.
          Providing either (or both) will also create the day's attendance/time-log
          record on approval if one doesn't already exist. */}
      {requestedStatus === 'present' && selectedDate && (
        <>
          <div>
            <label
              htmlFor='requested_clock_in_time'
              className='block text-sm font-medium mb-2'
            >
              Requested Clock-In Time{' '}
              <span className='text-gray-500 text-xs font-normal'>(optional)</span>
            </label>
            <input
              type='time'
              id='requested_clock_in_time'
              value={clockInTime}
              onChange={(e) => setClockInTime(e.target.value)}
              className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white [color-scheme:dark]'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Fill this in if you missed clocking in, or need to correct the time, for this day
            </p>
          </div>

          <div>
            <label
              htmlFor='requested_clock_out_time'
              className='block text-sm font-medium mb-2'
            >
              Requested Clock-Out Time{' '}
              <span className='text-gray-500 text-xs font-normal'>(optional)</span>
            </label>
            <input
              type='time'
              id='requested_clock_out_time'
              value={clockOutTime}
              onChange={(e) => setClockOutTime(e.target.value)}
              className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white [color-scheme:dark]'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Fill this in if you missed clocking out, or need to correct the time, for this day
            </p>
          </div>
        </>
      )}

      {/* Reason */}
      <div>
        <label htmlFor='reason' className='block text-sm font-medium mb-2'>
          Reason <span className='text-red-500'>*</span>
        </label>
        <textarea
          id='reason'
          name='reason'
          required
          minLength={5}
          rows={4}
          placeholder='Explain why you need this change (min 5 characters)'
          className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500 resize-none'
        />
        <p className='text-xs text-gray-500 mt-1'>
          Be specific about why this change is needed
        </p>
      </div>

      {/* Info Box */}
      <div className='bg-blue-900/20 border border-blue-700/30 rounded-lg p-3'>
        <p className='text-xs text-blue-300'>
          <strong>Note:</strong> Your request will be reviewed by HR/Admin.
        </p>
      </div>

      {/* Submit Button */}
      <Button type='submit' variant='primary' className='w-full'>
        Submit Request
      </Button>
    </form>
  );
}
