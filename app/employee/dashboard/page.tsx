/**
 * Employee Portal Dashboard
 */

import { requireFullPortalAccess } from '@/lib/erp/employee-portal-auth';
import {
  getEmployeeLeaveRequests,
  getEmployeeLeaveBalance,
} from '@/lib/erp/leave-requests';
import { getEmployeeById } from '@/lib/erp/employees';
import { getTimeLogSummary } from '@/lib/erp/time-logs';
import { employeeLogoutAction } from '@/actions/erp/employee-auth';
import ClockInOut from '@/components/erp/employee/ClockInOut';
import Link from 'next/link';

export default async function EmployeeDashboardPage() {
  const session = await requireFullPortalAccess();
  const employee = await getEmployeeById(session.id);
  const leaveRequests = await getEmployeeLeaveRequests(session.id);
  const leaveBalances = await getEmployeeLeaveBalance(session.id);
  const timeLogSummary = await getTimeLogSummary(session.id);

  // Get pending leave requests
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending');
  const approvedLeaves = leaveRequests.filter((l) => l.status === 'approved');

  // Get annual leave balance
  const annualLeaveBalance = leaveBalances.find(
    (b) => b.leave_type === 'annual',
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]'>
      {/* Header */}
      <header className='bg-[#1a1a1a] border-b border-gray-800'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] bg-clip-text text-transparent'>
                Employee Portal
              </h1>
              <p className='text-gray-400 text-sm mt-1'>
                Welcome, {session.name}!
              </p>
            </div>
            <form action={employeeLogoutAction}>
              <button
                type='submit'
                className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm'
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
          {/* Clock In/Out - Takes 1 column */}
          <div className='lg:col-span-1'>
            <ClockInOut
              employeeId={session.id}
              initialSummary={timeLogSummary}
            />
          </div>

          {/* Profile Card - Takes 2 columns */}
          <div className='lg:col-span-2'>
            <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 h-full'>
              <h2 className='text-xl font-bold text-white mb-4'>
                Your Profile
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-gray-400 text-sm'>Employee ID</p>
                  <p className='text-white font-medium'>
                    {employee?.employee_id}
                  </p>
                </div>
                <div>
                  <p className='text-gray-400 text-sm'>Department</p>
                  <p className='text-white font-medium'>{session.department}</p>
                </div>
                <div>
                  <p className='text-gray-400 text-sm'>Role</p>
                  <p className='text-white font-medium'>{session.role}</p>
                </div>
                <div>
                  <p className='text-gray-400 text-sm'>Email</p>
                  <p className='text-white font-medium'>{session.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Balance Card */}
        {annualLeaveBalance && (
          <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 mb-6'>
            <h2 className='text-xl font-bold text-white mb-4'>Leave Balance</h2>
            <div className='grid grid-cols-3 gap-4'>
              <div className='text-center'>
                <p className='text-3xl font-bold text-[var(--cyan)]'>
                  {annualLeaveBalance.total_allocated}
                </p>
                <p className='text-gray-400 text-sm mt-1'>Total Allocated</p>
              </div>
              <div className='text-center'>
                <p className='text-3xl font-bold text-yellow-500'>
                  {annualLeaveBalance.used_days}
                </p>
                <p className='text-gray-400 text-sm mt-1'>Used</p>
              </div>
              <div className='text-center'>
                <p className='text-3xl font-bold text-green-500'>
                  {annualLeaveBalance.remaining_days}
                </p>
                <p className='text-gray-400 text-sm mt-1'>Remaining</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
          <StatCard
            title='Pending Requests'
            value={pendingLeaves.length}
            color='yellow'
          />
          <StatCard
            title='Approved Leaves'
            value={approvedLeaves.length}
            color='green'
          />
          <StatCard
            title='Total Requests'
            value={leaveRequests.length}
            color='cyan'
          />
        </div>

        {/* Quick Actions */}
        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
          <h2 className='text-xl font-bold text-white mb-4'>Quick Actions</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Link
              href='/employee/attendance'
              className='block p-4 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors'
            >
              <h3 className='font-semibold text-white mb-1'>📅 Attendance</h3>
              <p className='text-sm text-gray-400'>
                View attendance and request changes
              </p>
            </Link>
            <Link
              href='/employee/leave'
              className='block p-4 bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 rounded-lg hover:bg-[var(--cyan)]/20 transition-colors'
            >
              <h3 className='font-semibold text-white mb-1'>
                🏖️ Leave Requests
              </h3>
              <p className='text-sm text-gray-400'>
                View and manage your leave requests
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: 'yellow' | 'green' | 'cyan';
}) {
  const colorClasses = {
    yellow: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
    green: 'text-green-500 border-green-500/30 bg-green-500/10',
    cyan: 'text-[var(--cyan)] border-[var(--cyan)]/30 bg-[var(--cyan)]/10',
  };

  return (
    <div className={`border rounded-lg p-6 ${colorClasses[color]}`}>
      <p className='text-4xl font-bold mb-2'>{value}</p>
      <p className='text-sm text-gray-300'>{title}</p>
    </div>
  );
}
