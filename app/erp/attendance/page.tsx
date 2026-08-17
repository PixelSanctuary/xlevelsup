import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllEmployees } from '@/lib/erp/employees';
import { getAllAttendance } from '@/lib/erp/attendance';
import { getAllLeaveRequests } from '@/lib/erp/leave-requests';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import AttendanceManager from '@/components/erp/AttendanceManager';
import { getCurrentMonth } from '@/lib/erp/utils';

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; employee_id?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }

  const params = await searchParams;
  const month = params.month || getCurrentMonth();
  const employeeId = params.employee_id
    ? parseInt(params.employee_id)
    : undefined;

  const employees = await getAllEmployees({ status: 'active' });
  const attendance = await getAllAttendance({
    month,
    employee_id: employeeId,
  });
  const leaveRequests = await getAllLeaveRequests({
    status: 'approved',
    employee_id: employeeId,
  });

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        <AttendanceManager
          employees={employees}
          attendance={attendance}
          leaveRequests={leaveRequests}
          initialMonth={month}
          initialEmployeeId={employeeId}
        />
      </main>
    </ERPLayoutWrapper>
  );
}
