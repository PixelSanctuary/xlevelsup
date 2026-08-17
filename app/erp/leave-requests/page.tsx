/**
 * ERP Admin - Leave Management Page
 */

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllLeaveRequests } from '@/lib/erp/leave-requests';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import LeaveManagementTable from '@/components/erp/LeaveManagementTable';

export default async function LeaveManagementPage() {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }

  // Get all leave requests
  const leaveRequests = await getAllLeaveRequests();

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-white gradient-text'>Leave Management</h1>
          <p className='text-gray-400 mt-2'>
            Review and manage employee leave requests
          </p>
        </div>

        <LeaveManagementTable requests={leaveRequests} />
      </main>
    </ERPLayoutWrapper>
  );
}
