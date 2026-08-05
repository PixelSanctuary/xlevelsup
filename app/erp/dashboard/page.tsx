import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import { getDashboardStats } from '@/lib/erp/dashboard';
import {
  getAllEmployeesTimeStatus,
  getTimeTrackingStats,
} from '@/lib/erp/time-tracking-admin';
import TimeTrackingOverview from '@/components/erp/admin/TimeTrackingOverview';
import { formatCurrency, formatDuration } from '@/lib/erp/utils';
import Link from 'next/link';
import SensitiveValue from '@/components/erp/SensitiveValue';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }

  const stats = await getDashboardStats();
  const employeesTimeStatus = await getAllEmployeesTimeStatus();
  const timeTrackingStats = await getTimeTrackingStats();

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold gradient-text'>ERP Dashboard</h1>
          <p className='text-gray-400 mt-2'>
            Overview of your organization's key metrics
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {/* Active Employees */}
          <Link
            href='/erp/employees'
            className='glass p-6 rounded-lg hover:border-cyan transition-all'
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='text-4xl'>👥</div>
              <div className='text-xs text-gray-400 uppercase tracking-wider'>
                Employees
              </div>
            </div>
            <div className='text-3xl font-bold text-white mb-1'>
              {stats.total_active_employees}
            </div>
            <div className='text-sm text-gray-400'>Active Employees</div>
          </Link>

          {/* Today's Attendance */}
          <Link
            href='/erp/attendance'
            className='glass p-6 rounded-lg hover:border-cyan transition-all'
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='text-4xl'>📅</div>
              <div className='text-xs text-gray-400 uppercase tracking-wider'>
                Attendance
              </div>
            </div>
            <div className='text-3xl font-bold text-green-400 mb-1'>
              {stats.today_attendance_percentage}%
            </div>
            <div className='text-sm text-gray-400'>
              {stats.today_attendance_count} / {stats.total_active_employees}{' '}
              Present Today
            </div>
          </Link>

          {/* Monthly Payroll */}
          <Link
            href='/erp/payroll'
            className='glass p-6 rounded-lg hover:border-cyan transition-all'
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='text-4xl'>💰</div>
              <div className='text-xs text-gray-400 uppercase tracking-wider'>
                Payroll
              </div>
            </div>
            <div className='text-3xl font-bold text-cyan mb-1'>
              <SensitiveValue>{formatCurrency(stats.current_month_payroll_total)}</SensitiveValue>
            </div>
            <div className='text-sm text-gray-400'>Current Month Payable</div>
            {stats.unpaid_payroll_count > 0 && (
              <div className='text-xs text-orange-400 mt-2'>
                {stats.unpaid_payroll_count} unpaid records
              </div>
            )}
          </Link>

          {/* Monthly Expenses */}
          <Link
            href='/erp/finances?tab=expenses'
            className='glass p-6 rounded-lg hover:border-cyan transition-all'
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='text-4xl'>💳</div>
              <div className='text-xs text-gray-400 uppercase tracking-wider'>
                Expenses
              </div>
            </div>
            <div className='text-3xl font-bold text-purple mb-1'>
              <SensitiveValue>{formatCurrency(stats.current_month_expenses_total)}</SensitiveValue>
            </div>
            <div className='text-sm text-gray-400'>Current Month Total</div>
          </Link>
        </div>

        {/* Time Tracking Overview Section */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h2 className='text-2xl font-bold text-white'>
                ⏰ Live Time Tracking
              </h2>
              <p className='text-gray-400 text-sm mt-1'>
                Real-time employee clock in/out status for today
              </p>
            </div>
            <div className='text-xs text-gray-500'>
              Updated:{' '}
              {new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {/* Time Tracking Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6'>
            <div className='glass p-4 rounded-lg border-l-4 border-green-500'>
              <div className='text-xs text-gray-400 mb-1'>
                Currently Working
              </div>
              <div className='text-2xl font-bold text-green-400'>
                {timeTrackingStats.currently_working}
              </div>
              <div className='text-xs text-gray-500 mt-1'>
                {
                  (
                    (timeTrackingStats.currently_working /
                      timeTrackingStats.total_employees) *
                    100
                  ).toFixed(0)
                }
                % of team
              </div>
            </div>

            <div className='glass p-4 rounded-lg border-l-4 border-blue-500'>
              <div className='text-xs text-gray-400 mb-1'>Completed Day</div>
              <div className='text-2xl font-bold text-blue-400'>
                {timeTrackingStats.completed_day}
              </div>
              <div className='text-xs text-gray-500 mt-1'>≥8 hours worked</div>
            </div>

            <div className='glass p-4 rounded-lg border-l-4 border-yellow-500'>
              <div className='text-xs text-gray-400 mb-1'>Average Hours</div>
              <div className='text-2xl font-bold text-yellow-400'>
                {formatDuration(timeTrackingStats.average_hours, true)}
              </div>
              <div className='text-xs text-gray-500 mt-1'>
                per employee today
              </div>
            </div>

            <div className='glass p-4 rounded-lg border-l-4 border-orange-500'>
              <div className='text-xs text-gray-400 mb-1'>On Leave</div>
              <div className='text-2xl font-bold text-orange-400'>
                {timeTrackingStats.on_leave}
              </div>
              <div className='text-xs text-gray-500 mt-1'>
                approved leave today
              </div>
            </div>

            <div className='glass p-4 rounded-lg border-l-4 border-gray-500'>
              <div className='text-xs text-gray-400 mb-1'>Not Started</div>
              <div className='text-2xl font-bold text-gray-400'>
                {timeTrackingStats.not_started}
              </div>
              <div className='text-xs text-gray-500 mt-1'>
                haven't clocked in
              </div>
            </div>
          </div>

          {/* Employee Time Tracking Table */}
          <TimeTrackingOverview employees={employeesTimeStatus} />

          {/* View Full Dashboard Link */}
          <div className='mt-4 text-center'>
            <Link
              href='/erp/time-tracking'
              className='inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan to-purple text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple/50 transition-all'
            >
              View Full Time Tracking Dashboard →
            </Link>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          {/* Pending Expenses */}
          <div className='glass p-6 rounded-lg'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-white'>
                Pending Expenses
              </h3>
              <div className='text-2xl'>⏳</div>
            </div>
            <div className='text-2xl font-bold text-orange-400 mb-2'>
              <SensitiveValue>{formatCurrency(stats.pending_expenses_total)}</SensitiveValue>
            </div>
            <div className='text-sm text-gray-400'>
              {stats.pending_expenses_count} expenses awaiting approval
            </div>
            <Link
              href='/erp/finances?tab=ledger&status=pending'
              className='text-cyan text-sm hover:text-purple transition-colors mt-3 inline-block'
            >
              Review Pending →
            </Link>
          </div>

          {/* Pending Leave Requests */}
          <div className='glass p-6 rounded-lg'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-white'>
                Leave Requests
              </h3>
              <div className='text-2xl'>🏖️</div>
            </div>
            <div className='text-2xl font-bold text-yellow-400 mb-2'>
              {stats.pending_leave_requests_count}
            </div>
            <div className='text-sm text-gray-400'>pending leave requests</div>
            <Link
              href='/erp/leave-requests'
              className='text-cyan text-sm hover:text-purple transition-colors mt-3 inline-block'
            >
              Review Requests →
            </Link>
          </div>

          {/* Pending Attendance Change Requests */}
          <div className='glass p-6 rounded-lg'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-white'>
                Attendance Changes
              </h3>
              <div className='text-2xl'>📝</div>
            </div>
            <div className='text-2xl font-bold text-blue-400 mb-2'>
              {stats.pending_attendance_change_requests_count}
            </div>
            <div className='text-sm text-gray-400'>pending change requests</div>
            <Link
              href='/erp/attendance-change-requests'
              className='text-cyan text-sm hover:text-purple transition-colors mt-3 inline-block'
            >
              Review Changes →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='glass p-6 rounded-lg'>
            <h3 className='text-lg font-semibold text-white mb-4'>
              Quick Actions
            </h3>
            <div className='space-y-3'>
              <Link
                href='/erp/employees'
                className='block px-4 py-2 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors text-sm'
              >
                <span className='mr-2'>➕</span>
                Add New Employee
              </Link>
              <Link
                href='/erp/attendance'
                className='block px-4 py-2 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors text-sm'
              >
                <span className='mr-2'>📝</span>
                Mark Attendance
              </Link>
              <Link
                href='/erp/time-tracking'
                className='block px-4 py-2 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors text-sm'
              >
                <span className='mr-2'>⏰</span>
                View Time Tracking
              </Link>
              <Link
                href='/erp/leave-requests'
                className='block px-4 py-2 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors text-sm'
              >
                <span className='mr-2'>🏖️</span>
                Review Leave Requests
              </Link>
            </div>
          </div>
        </div>

      </main>
    </ERPLayoutWrapper>
  );
}
