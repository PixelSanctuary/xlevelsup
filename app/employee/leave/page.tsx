/**
 * Employee Leave Requests Page
 */

import { requireFullPortalAccess } from '@/lib/erp/employee-portal-auth';
import {
  getEmployeeLeaveRequests,
  getEmployeeLeaveBalance,
} from '@/lib/erp/leave-requests';
import LeaveRequestForm from '@/components/erp/employee/LeaveRequestForm';
import LeaveRequestList from '@/components/erp/employee/LeaveRequestList';
import LeaveBalanceChart from '@/components/erp/employee/LeaveBalanceChart';
import Link from 'next/link';

export default async function EmployeeLeavePage() {
  const session = await requireFullPortalAccess();
  const leaveRequests = await getEmployeeLeaveRequests(session.id);
  const leaveBalances = await getEmployeeLeaveBalance(session.id);

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]'>
      {/* Header */}
      <header className='bg-[#1a1a1a] border-b border-gray-800'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <Link
                href='/employee/dashboard'
                className='text-gray-400 hover:text-white text-sm mb-2 inline-block'
              >
                ← Back to Dashboard
              </Link>
              <h1 className='text-2xl font-bold text-white'>Leave Requests</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Leave Balance Chart */}
        <div className='mb-6'>
          <LeaveBalanceChart leaveBalances={leaveBalances} />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Leave Request Form */}
          <div className='lg:col-span-1'>
            <LeaveRequestForm
              employeeId={session.id}
              leaveBalances={leaveBalances}
            />
          </div>

          {/* Leave Request List */}
          <div className='lg:col-span-2'>
            <LeaveRequestList
              requests={leaveRequests}
              employeeId={session.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
