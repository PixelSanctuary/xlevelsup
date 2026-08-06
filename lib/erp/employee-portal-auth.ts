/**
 * Employee Portal Auth Helpers
 */

import { cookies } from 'next/headers';
import { verifyEmployeeSession } from '@/lib/erp/employee-auth';
import type { EmployeeSession } from '@/types/erp';
import { redirect } from 'next/navigation';

/**
 * Get current employee session (server-side only)
 */
export async function getEmployeeSession(): Promise<EmployeeSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('employee_session')?.value;

  if (!token) {
    return null;
  }

  return await verifyEmployeeSession(token);
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
