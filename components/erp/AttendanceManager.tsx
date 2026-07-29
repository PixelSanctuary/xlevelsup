'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { m as motion } from 'framer-motion';
import { Table, TableRow, TableCell } from './Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AttendanceForm from './AttendanceForm';
import BulkAttendanceForm from './BulkAttendanceForm';
import { DeleteIcon } from './ActionIcons';
import MonthPicker from './MonthPicker';
import type { Employee, Attendance } from '@/types/erp';
import { formatDisplayDate, getMonthName } from '@/lib/erp/utils';
import toast from 'react-hot-toast';
import { deleteAttendanceAction } from '@/actions/erp/attendance';
import Link from 'next/link';

interface AttendanceManagerProps {
  employees: Employee[];
  attendance: Attendance[];
  initialMonth: string;
  initialEmployeeId?: number;
}

export default function AttendanceManager({
  employees,
  attendance,
  initialMonth,
  initialEmployeeId,
}: AttendanceManagerProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const [employeeId, setEmployeeId] = useState<number | undefined>(
    initialEmployeeId,
  );
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [selectedDateStr, setSelectedDateStr] = useState('');

  const applyFilters = (overrides?: Partial<{ month: string; employeeId: number | undefined }>) => {
    const next = { month, employeeId, ...overrides };
    const params = new URLSearchParams();
    params.set('month', next.month);
    if (next.employeeId) params.set('employee_id', next.employeeId.toString());

    router.push(`/erp/attendance?${params.toString()}`);
  };

  const handleDelete = async (record: Attendance) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    const result = await deleteAttendanceAction(
      record.employee_id,
      record.date,
    );
    if (result.success) {
      toast.success('Attendance deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete attendance');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/20 text-green-400';
      case 'in_progress':
        return 'bg-amber-500/20 text-amber-400';
      case 'absent':
        return 'bg-red-500/20 text-red-400';
      case 'half-day':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'paid-leave':
        return 'bg-blue-500/20 text-blue-400';
      case 'unpaid-leave':
        return 'bg-orange-500/20 text-orange-400';
      case 'holiday':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  // Local YYYY-MM-DD key — never toISOString(), which shifts the date by a
  // day in timezones ahead of UTC (e.g. IST).
  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Group all (already month/employee-filtered) attendance records by date
  const attendanceByDate = new Map<string, Attendance[]>();
  attendance.forEach((record) => {
    const dateStr = record.date.split('T')[0];
    if (!attendanceByDate.has(dateStr)) attendanceByDate.set(dateStr, []);
    attendanceByDate.get(dateStr)!.push(record);
  });

  // Build a 42-cell (6-week) calendar grid for the selected month
  const getCalendarDays = () => {
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;

    const firstDayIndex = new Date(year, monthIdx, 1).getDay();
    const totalDays = new Date(year, monthIdx + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, monthIdx, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; dayNum: number }[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, monthIdx - 1, prevMonthTotalDays - i),
        isCurrentMonth: false,
        dayNum: prevMonthTotalDays - i,
      });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, monthIdx, i), isCurrentMonth: true, dayNum: i });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, monthIdx + 1, i), isCurrentMonth: false, dayNum: i });
    }
    return days;
  };

  const STATUS_ORDER: Attendance['status'][] = [
    'present',
    'in_progress',
    'absent',
    'half-day',
    'paid-leave',
    'unpaid-leave',
    'holiday',
  ];
  const STATUS_SHORT: Record<string, string> = {
    present: 'P',
    in_progress: 'IP',
    absent: 'A',
    'half-day': 'H',
    'paid-leave': 'PL',
    'unpaid-leave': 'UL',
    holiday: 'HO',
  };

  const calendarDays = getCalendarDays();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold gradient-text'>
            Attendance Management
          </h1>
          <p className='text-gray-400 mt-2'>
            Track daily attendance for all employees
          </p>
        </div>
        <div className='flex items-center gap-3 flex-wrap sm:flex-nowrap'>
          <Link href='/erp/attendance/sessions'>
            <Button variant='secondary' className='whitespace-nowrap'>
              🕒 View Login/Logout Sessions
            </Button>
          </Link>
          <Button
            variant='secondary'
            onClick={() => setShowBulkModal(true)}
            className='whitespace-nowrap'
          >
            🗓️ Bulk Update
          </Button>
          <Button
            variant='primary'
            onClick={() => setShowAddModal(true)}
            className='whitespace-nowrap'
          >
            + Add Attendance
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
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-2'>Employee</label>
            <select
              value={employeeId || ''}
              onChange={(e) => {
                const next = e.target.value ? parseInt(e.target.value) : undefined;
                setEmployeeId(next);
                applyFilters({ employeeId: next });
              }}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Total Records</p>
          <p className='text-2xl font-bold text-white mt-1'>
            {attendance.length}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Present</p>
          <p className='text-2xl font-bold text-green-400 mt-1'>
            {attendance.filter((a) => a.status === 'present').length}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Absent</p>
          <p className='text-2xl font-bold text-red-400 mt-1'>
            {attendance.filter((a) => a.status === 'absent').length}
          </p>
        </div>
        <div className='glass p-4 rounded-lg'>
          <p className='text-sm text-gray-400'>Leaves</p>
          <p className='text-2xl font-bold text-blue-400 mt-1'>
            {
              attendance.filter(
                (a) => a.status === 'paid-leave' || a.status === 'unpaid-leave',
              ).length
            }
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className='flex items-center gap-1 bg-[#0a0a0a] border border-gray-800 p-1 rounded-lg mb-6 w-fit'>
        <button
          onClick={() => setViewMode('table')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            viewMode === 'table'
              ? 'bg-gradient-to-r from-cyan to-purple text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📋 Table View
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            viewMode === 'calendar'
              ? 'bg-gradient-to-r from-cyan to-purple text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📅 Calendar View
        </button>
      </div>

      {/* Attendance Table */}
      {viewMode === 'table' && (
        <div className='glass rounded-lg overflow-hidden'>
          {attendance.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-gray-400 mb-4'>No attendance records found</p>
              <Button variant='primary' onClick={() => setShowAddModal(true)}>
                Add First Record
              </Button>
            </div>
          ) : (
            <Table
              headers={[
                'Date',
                'Employee',
                'Department',
                'Status',
                'Notes',
                'Actions',
              ]}
            >
              {attendance.map((record) => {
                const employee = employeeMap.get(record.employee_id);
                return (
                  <TableRow key={`${record.employee_id}-${record.date}`}>
                    <TableCell>
                      <div className='font-medium text-white'>
                        {formatDisplayDate(record.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='font-medium text-white'>
                        {employee?.name}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {employee?.employee_id}
                      </div>
                    </TableCell>
                    <TableCell>{employee?.department}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          record.status,
                        )}`}
                      >
                        {record.status.replace(/[-_]/g, ' ')}
                        {record.status === 'half-day' && record.half_day_period
                          ? ` (${record.half_day_period === 'first_half' ? 'Morning' : 'Afternoon'})`
                          : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='text-xs text-gray-400'>
                        {record.notes || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDelete(record)}
                        title='Delete'
                        aria-label='Delete'
                        className='text-red-400 hover:text-red-300 transition-colors'
                      >
                        <DeleteIcon />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </Table>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className='space-y-4'>
          <div className='bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 sm:p-4'>
            <p className='text-xs text-gray-500 mb-3'>
              Showing {getMonthName(month)} for{' '}
              <span className='text-gray-300 font-medium'>
                {employeeId ? employeeMap.get(employeeId)?.name || 'selected employee' : 'all employees'}
              </span>
              . Click a day to see the per-employee breakdown.
            </p>

            {/* Weekday headers */}
            <div className='grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-800/40 pb-2'>
              {weekdays.map((day) => (
                <div key={day} className='py-1'>
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className='grid grid-cols-7 gap-1 sm:gap-2'>
              {calendarDays.map((day, idx) => {
                const dateStr = formatDateKey(day.date);
                const dayRecords = attendanceByDate.get(dateStr) || [];
                const isToday = formatDateKey(new Date()) === dateStr;
                const isSelected = selectedDateStr === dateStr;

                const counts: Partial<Record<string, number>> = {};
                dayRecords.forEach((r) => {
                  counts[r.status] = (counts[r.status] || 0) + 1;
                });

                return (
                  <button
                    key={`${dateStr}-${idx}`}
                    onClick={() => day.isCurrentMonth && setSelectedDateStr(dateStr)}
                    disabled={!day.isCurrentMonth}
                    className={`flex flex-col justify-between items-start p-1 sm:p-2 h-16 sm:h-24 border rounded-lg transition-all text-left ${
                      day.isCurrentMonth
                        ? 'bg-[#111111]/30 hover:bg-[#1a1a1a]/60 border-gray-800/30 cursor-pointer'
                        : 'bg-transparent border-transparent opacity-20 pointer-events-none'
                    } ${isToday ? 'ring-2 ring-[var(--cyan)] ring-offset-2 ring-offset-black' : ''} ${
                      isSelected ? 'border-cyan' : ''
                    }`}
                  >
                    <div className='flex justify-between items-center w-full'>
                      <span
                        className={`text-xs font-bold ${
                          isToday ? 'text-[var(--cyan)]' : day.isCurrentMonth ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        {day.dayNum}
                      </span>
                      {isToday && (
                        <span className='text-[8px] bg-[var(--cyan)]/20 text-[var(--cyan)] px-1 rounded-sm hidden sm:inline'>
                          Today
                        </span>
                      )}
                    </div>

                    {dayRecords.length > 0 && (
                      <div className='w-full flex flex-wrap gap-0.5 mt-auto'>
                        {STATUS_ORDER.filter((s) => counts[s]).map((s) => (
                          <span
                            key={s}
                            className={`text-[8px] font-bold px-1 rounded leading-tight ${getStatusColor(s)}`}
                          >
                            {STATUS_SHORT[s]}&nbsp;{counts[s]}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className='flex flex-wrap gap-x-4 gap-y-2 bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-xs justify-center'>
            {STATUS_ORDER.map((s) => (
              <div key={s} className='flex items-center gap-1.5'>
                <span className={`h-3 w-3 rounded-md inline-block ${getStatusColor(s)}`}></span>
                <span className='text-gray-300'>
                  {STATUS_SHORT[s]} = {s.replace(/[-_]/g, ' ')}
                </span>
              </div>
            ))}
          </div>

          {/* Selected Date Breakdown */}
          {selectedDateStr && (
            <div className='bg-[#111111]/80 border border-gray-800 rounded-lg p-4 space-y-3'>
              <div className='flex items-center justify-between border-b border-gray-800 pb-2'>
                <h3 className='text-sm font-semibold text-white'>
                  📅 Attendance on {formatDisplayDate(selectedDateStr)}
                </h3>
                <button
                  onClick={() => setSelectedDateStr('')}
                  className='text-xs text-gray-400 hover:text-white transition-colors'
                >
                  Close ×
                </button>
              </div>

              {(() => {
                const dayRecords = attendanceByDate.get(selectedDateStr) || [];
                if (dayRecords.length === 0) {
                  return (
                    <p className='text-xs text-gray-500 italic'>
                      No attendance records for this date.
                    </p>
                  );
                }

                const recordedIds = new Set(dayRecords.map((r) => r.employee_id));
                const missingEmployees = employeeId
                  ? []
                  : employees.filter((e) => !recordedIds.has(e.id));

                return (
                  <>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                      {dayRecords.map((record) => {
                        const employee = employeeMap.get(record.employee_id);
                        return (
                          <div
                            key={record.id}
                            className='flex items-center justify-between bg-dark-800/40 border border-gray-800/60 rounded-lg px-3 py-2 text-xs'
                          >
                            <div>
                              <div className='font-medium text-white'>{employee?.name || 'Unknown'}</div>
                              <div className='text-gray-500'>
                                {employee?.employee_id} · {employee?.department}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-medium ${getStatusColor(
                                record.status,
                              )}`}
                            >
                              {record.status.replace(/[-_]/g, ' ')}
                              {record.status === 'half-day' && record.half_day_period
                                ? ` (${record.half_day_period === 'first_half' ? 'Morning' : 'Afternoon'})`
                                : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {missingEmployees.length > 0 && (
                      <div className='pt-2 border-t border-gray-800'>
                        <p className='text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5'>
                          No record for this date ({missingEmployees.length})
                        </p>
                        <div className='flex flex-wrap gap-1.5'>
                          {missingEmployees.map((e) => (
                            <span
                              key={e.id}
                              className='text-[10px] text-gray-400 bg-gray-800/60 px-2 py-1 rounded'
                            >
                              {e.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title='Add Attendance Record'
      >
        <AttendanceForm
          employees={employees}
          onSuccess={() => {
            setShowAddModal(false);
            router.refresh();
          }}
        />
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title='Bulk Update Attendance'
      >
        <BulkAttendanceForm
          employees={employees}
          onSuccess={() => {
            setShowBulkModal(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
