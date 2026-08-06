/**
 * Employee Portal Authentication
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { Employee, EmployeeSession } from '@/types/erp';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this',
);

/**
 * Authenticate employee with email and password
 */
export async function authenticateEmployee(
  email: string,
  password: string,
): Promise<{ employee: Employee; requirePasswordChange: boolean } | null> {
  try {
    // Get employee by email
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .eq('status', 'active')
      .single();

    if (error) {
      // Log database error but don't expose details
      console.error('Database error during authentication:', error.message);
      return null;
    }

    if (!employee) {
      return null;
    }

    // Check if account is suspended or locked
    if (
      employee.account_status === 'suspended' ||
      employee.account_status === 'locked'
    ) {
      return null;
    }

    // Verify password
    if (!employee.password_hash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, employee.password_hash);
    if (!isValid) {
      return null;
    }

    // Update last login
    const { error: updateError } = await supabase
      .from('employees')
      .update({ last_login: new Date().toISOString() })
      .eq('id', employee.id);

    if (updateError) {
      // Log error but don't fail authentication
      console.error('Failed to update last login:', updateError.message);
    }

    return {
      employee,
      requirePasswordChange: employee.require_password_change || false,
    };
  } catch (error) {
    // Catch any unexpected errors (network issues, etc.)
    console.error('Unexpected error during authentication:', error);
    return null;
  }
}

/**
 * Change employee password
 */
export async function changeEmployeePassword(
  employeeId: number,
  newPassword: string,
): Promise<void> {
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from('employees')
      .update({
        password_hash: passwordHash,
        require_password_change: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', employeeId);

    if (error) {
      console.error('Database error changing password:', error.message);
      throw new Error('Failed to update password. Please try again.');
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Failed to update password')
    ) {
      throw error;
    }
    console.error('Unexpected error changing password:', error);
    throw new Error('An unexpected error occurred. Please try again later.');
  }
}

/**
 * Create employee session token (JWT)
 */
export async function createEmployeeSession(
  employee: Employee,
): Promise<string> {
  const session: EmployeeSession = {
    id: employee.id,
    employee_id: employee.employee_id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    department: employee.department,
    employment_type: employee.employment_type,
    require_password_change: employee.require_password_change || false,
  };

  const token = await new jose.SignJWT({ ...session, type: 'employee' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify employee session token
 */
export async function verifyEmployeeSession(
  token: string,
): Promise<EmployeeSession | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);

    if (payload.type !== 'employee') {
      return null;
    }

    return payload as unknown as EmployeeSession;
  } catch (error) {
    // Session verification failed - token expired or invalid
    console.error(
      'Session verification failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return null;
  }
}

/**
 * Get employee by email
 */
export async function getEmployeeByEmail(
  email: string,
): Promise<Employee | null> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error(
        'Database error fetching employee by email:',
        error.message,
      );
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching employee:', error);
    return null;
  }
}
