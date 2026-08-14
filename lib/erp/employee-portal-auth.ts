/**
 * Employee Portal Auth Helpers
 */

import { cookies } from 'next/headers';
import { verifyEmployeeSession } from '@/lib/erp/employee-auth';
import { getSession as getErpSession } from '@/lib/auth';
import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { EmployeeSession } from '@/types/erp';
import { redirect } from 'next/navigation';

/**
 * Get current employee session (server-side only).
 *
 * Falls back to bridging in an ERP admin/hr session when there's no real
 * employee-portal login: execs (CEO/CTO/CFO) are admins in `users` AND
 * staff members in `employees`, and shouldn't need a second password just
 * to view their own attendance or file a leave request. The bridge only
 * activates for a `users` row that's actually linked via `employees.user_id`
 * — an unlinked admin gets no self-service access, same as today.
 */
export async function getEmployeeSession(): Promise<EmployeeSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('employee_session')?.value;

  if (token) {
    const session = await verifyEmployeeSession(token);
    if (session) return session;
  }

  return getBridgedEmployeeSession();
}

async function getBridgedEmployeeSession(): Promise<EmployeeSession | null> {
  const erpSession = await getErpSession();
  if (!erpSession) return null;

  const { data: employee, error } = await supabase
    .from('employees')
    .select('id, employee_id, name, email, role, department, employment_type, status, account_status')
    .eq('user_id', erpSession.userId)
    .maybeSingle();

  if (error || !employee) return null;
  if (employee.status !== 'active') return null;
  if (employee.account_status === 'suspended' || employee.account_status === 'locked') return null;

  return {
    id: employee.id,
    employee_id: employee.employee_id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    department: employee.department,
    employment_type: employee.employment_type,
    // Already authenticated via their own admin password — never force
    // them through the employee-portal's separate password-change flow.
    require_password_change: false,
    viaAdminSession: true,
  };
}

/**
 * Require employee authentication (server-side only)
 * Redirects to login if not authenticated
 */
export async function requireEmployeeAuth(): Promise<EmployeeSession> {
  const session = await getEmployeeSession();

  if (!session) {
    redirect('/employee/login');
  }

  // If password change is required, redirect to change password page
  if (session.require_password_change) {
    redirect('/employee/change-password');
  }

  return session;
}

/**
 * Require employee auth but allow password change page access
 */
export async function requireEmployeeAuthAllowPasswordChange(): Promise<EmployeeSession> {
  const session = await getEmployeeSession();

  if (!session) {
    redirect('/employee/login');
  }

  return session;
}

/**
 * Require employee authentication, and additionally block freelancers
 * (who are restricted to the Attendance screen) from full-portal pages
 * like the dashboard and leave requests.
 */
export async function requireFullPortalAccess(): Promise<EmployeeSession> {
  const session = await requireEmployeeAuth();

  if (session.employment_type === 'freelancer') {
    redirect('/employee/attendance');
  }

  return session;
}
