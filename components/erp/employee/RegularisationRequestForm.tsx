'use client';

/**
 * RegularisationRequestForm
 * Employee-facing form for submitting clock-in / clock-out regularisation requests.
 * Supports: missed_clock_in | missed_clock_out | missed_both | clock_in_correction | clock_out_correction
 */

import { useActionState, useEffect, useState, useTransition } from 'react';
import {
  createAttendanceRegularisationRequestAction,
  getAttendanceForRegularisationDateAction,
} from '@/actions/erp/attendance-change-requests';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { toast } from 'react-hot-toast';
import type { AttendanceRegularisationType } from '@/types/erp';

interface RegularisationRequestFormProps {
  employeeId: number;
  /** Pre-fill the date (e.g. when navigated from clock-out reminder) */
  initialDate?: string;
  /** Pre-fill the request type */
  initialType?: AttendanceRegularisationType;
}

const REQUEST_TYPE_OPTIONS: { value: AttendanceRegularisationType; label: string; description: string }[] = [
  {
    value: 'missed_clock_in',
    label: 'Missed Clock-In',
    description: 'I forgot to clock in but did clock out',
  },
  {
    value: 'missed_clock_out',
    label: 'Missed Clock-Out',
    description: 'I clocked in but forgot to clock out',
  },
  {
    value: 'missed_both',
    label: 'Missed Both Clock-In & Clock-Out',
    description: 'I forgot to clock in and clock out',
  },
  {
    value: 'clock_in_correction',
    label: 'Incorrect Clock-In Time',
    description: 'My clock-in time was incorrect and needs correction',
  },
  {
    value: 'clock_out_correction',
    label: 'Incorrect Clock-Out Time',
    description: 'My clock-out time was incorrect and needs correction',
  },
];

/** Extract just the HH:MM time portion of a TIMESTAMPTZ string, for a time-only input (the date is already fixed by the Attendance Date field above it). */
function toTimeOnly(isoString: string | null | undefined): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

/** Format a TIMESTAMPTZ for display */
function formatDisplayTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export default function RegularisationRequestForm({
  employeeId,
  initialDate,
  initialType,
}: RegularisationRequestFormProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate || '');
  const [requestType, setRequestType] = useState<AttendanceRegularisationType | ''>(
    initialType || '',
  );
  const [clockInTime, setClockInTime] = useState('');
  const [clockOutTime, setClockOutTime] = useState('');

  // Fetched from DB for the selected date
  const [currentClockIn, setCurrentClockIn] = useState<string | null>(null);
  const [currentClockOut, setCurrentClockOut] = useState<string | null>(null);
  const [attendanceId, setAttendanceId] = useState<number | null>(null);
  const [isFetchingDate, startFetch] = useTransition();

  // Decide which fields to show based on request type
  const needsClockIn =
    requestType === 'missed_clock_in' ||
    requestType === 'missed_both' ||
    requestType === 'clock_in_correction';
  const needsClockOut =
    requestType === 'missed_clock_out' ||
    requestType === 'missed_both' ||
    requestType === 'clock_out_correction';

  // Sync the selected date when it's picked from the attendance calendar
  // (initialDate changes after that click updates the URL).
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
      setClockInTime('');
      setClockOutTime('');
    }
  }, [initialDate]);

  // Fetch attendance info when date or type changes
  useEffect(() => {
    if (!selectedDate) {
      setCurrentClockIn(null);
      setCurrentClockOut(null);
      setAttendanceId(null);
      return;
    }
    startFetch(async () => {
      const result = await getAttendanceForRegularisationDateAction(employeeId, selectedDate);
      if (result.success) {
        setCurrentClockIn(result.clockInTime || null);
        setCurrentClockOut(result.clockOutTime || null);
        setAttendanceId(result.attendanceId || null);
        // For correction types, pre-fill the input with current value
        if (requestType === 'clock_in_correction' && result.clockInTime) {
          setClockInTime(toTimeOnly(result.clockInTime));
        }
        if (requestType === 'clock_out_correction' && result.clockOutTime) {
          setClockOutTime(toTimeOnly(result.clockOutTime));
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const handleFormAction = async (prevState: any, formData: FormData) => {
    if (!selectedDate) return { success: false, error: 'Please select a date' };
    if (!requestType) return { success: false, error: 'Please select a request type' };

    formData.set('request_date', selectedDate);
    formData.set('request_type', requestType);

    // Combine the (already-selected) date with the entered time-only value
    if (clockInTime) {
      formData.set('requested_clock_in_time', new Date(`${selectedDate}T${clockInTime}`).toISOString());
    }
    if (clockOutTime) {
      formData.set('requested_clock_out_time', new Date(`${selectedDate}T${clockOutTime}`).toISOString());
    }

    // Pass current values for audit trail
    if (currentClockIn) formData.set('current_clock_in_time', currentClockIn);
    if (currentClockOut) formData.set('current_clock_out_time', currentClockOut);
    if (attendanceId) formData.set('attendance_id', String(attendanceId));

    return await createAttendanceRegularisationRequestAction(employeeId, prevState, formData);
  };

  const [state, formAction] = useActionState(handleFormAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success('Regularisation request submitted successfully!');
      setSelectedDate('');
      setRequestType('');
      setClockInTime('');
      setClockOutTime('');
      setCurrentClockIn(null);
      setCurrentClockOut(null);
      setAttendanceId(null);
      setTimeout(() => window.location.reload(), 1000);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  // Uses local getters, not toISOString() — the latter converts to UTC
  // first, which shifts the date by a day in timezones ahead of UTC (e.g. IST).
  const maxDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  return (
    <form id="regularisation-request-form" action={formAction} className="space-y-5">
      {/* Date Picker */}
      <DatePicker
        label="Attendance Date"
        value={selectedDate}
        onChange={(date) => {
          setSelectedDate(date);
          setClockInTime('');
          setClockOutTime('');
        }}
        maxDate={maxDate}
        required
        placeholder="Select the date to regularise"
        helperText="You can only regularise past dates"
      />
      <input type="hidden" name="request_date" value={selectedDate} />

      {/* Request Type Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Request Type <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {REQUEST_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                requestType === opt.value
                  ? 'border-[var(--cyan)] bg-[var(--cyan)]/5'
                  : 'border-gray-700 bg-[#0a0a0a] hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="request_type_radio"
                value={opt.value}
                checked={requestType === opt.value}
                onChange={() => {
                  setRequestType(opt.value);
                  setClockInTime('');
                  setClockOutTime('');
                }}
                className="mt-0.5 w-4 h-4 text-[var(--cyan)] focus:ring-[var(--cyan)] bg-gray-900 border-gray-600"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{opt.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Current Values Info Panel (shown when date is selected and data exists) */}
      {selectedDate && requestType && (currentClockIn || currentClockOut) && (
        <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Current Record for {selectedDate}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Current Clock-In</p>
              <p className={`text-sm font-semibold mt-0.5 ${currentClockIn ? 'text-blue-400' : 'text-gray-600'}`}>
                {currentClockIn ? formatDisplayTime(currentClockIn) : 'Not recorded'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current Clock-Out</p>
              <p className={`text-sm font-semibold mt-0.5 ${currentClockOut ? 'text-orange-400' : 'text-gray-600'}`}>
                {currentClockOut ? formatDisplayTime(currentClockOut) : 'Not recorded'}
              </p>
            </div>
          </div>
        </div>
      )}

      {isFetchingDate && selectedDate && (
        <p className="text-xs text-gray-500 animate-pulse">Fetching attendance info…</p>
      )}

      {/* Requested Clock-In Time */}
      {needsClockIn && selectedDate && (
        <div>
          <label htmlFor="reg_clock_in_time" className="block text-sm font-medium mb-2">
            Requested Clock-In Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="reg_clock_in_time"
            value={clockInTime}
            onChange={(e) => setClockInTime(e.target.value)}
            required={needsClockIn}
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white [color-scheme:dark]"
          />
          <p className="text-xs text-gray-500 mt-1">
            {requestType === 'clock_in_correction'
              ? 'Enter the corrected clock-in time'
              : 'Enter the time you actually started work'}
          </p>
        </div>
      )}

      {/* Requested Clock-Out Time */}
      {needsClockOut && selectedDate && (
        <div>
          <label htmlFor="reg_clock_out_time" className="block text-sm font-medium mb-2">
            Requested Clock-Out Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="reg_clock_out_time"
            value={clockOutTime}
            onChange={(e) => setClockOutTime(e.target.value)}
            required={needsClockOut}
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white [color-scheme:dark]"
          />
          <p className="text-xs text-gray-500 mt-1">
            {requestType === 'clock_out_correction'
              ? 'Enter the corrected clock-out time'
              : 'Enter the time you actually finished work'}
          </p>
        </div>
      )}

      {/* Reason */}
      {requestType && (
        <>
          <div>
            <label htmlFor="reg_reason" className="block text-sm font-medium mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reg_reason"
              name="reason"
              required
              minLength={5}
              rows={3}
              placeholder="Briefly explain why regularisation is needed (min 5 characters)"
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500 resize-none"
            />
          </div>

          <div>
            <label htmlFor="reg_employee_note" className="block text-sm font-medium mb-2">
              Additional Note{' '}
              <span className="text-gray-500 text-xs font-normal">(optional)</span>
            </label>
            <textarea
              id="reg_employee_note"
              name="employee_note"
              rows={2}
              placeholder="Any additional context for HR/Admin"
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500 resize-none"
            />
          </div>
        </>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          <strong>Note:</strong> Your request will be reviewed by HR/Admin. The attendance
          and time log records will only be updated after approval.
        </p>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={!selectedDate || !requestType}
      >
        Submit Regularisation Request
      </Button>
    </form>
  );
}
