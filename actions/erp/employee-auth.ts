'use server';

/**
 * Server actions for Employee Portal Authentication
 */

import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import {
  authenticateEmployee,
  changeEmployeePassword,
  createEmployeeSession,
} from '@/lib/erp/employee-auth';
import { createLoginLog } from '@/lib/erp/login-logs';
import type { EmploymentType } from '@/types/erp';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number',
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
});

/**
 * Employee login action
 */
export async function employeeLoginAction(
  prevState: any,
  formData: FormData,
): Promise<{
  success: boolean;
  error?: string;
  requirePasswordChange?: boolean;
  employmentType?: EmploymentType;
}> {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Get location data if provided
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined;
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined;
    const accuracy = formData.get('accuracy') ? parseFloat(formData.get('accuracy') as string) : undefined;
    
    // Get request headers for IP and user agent
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Validate input
    const validated = loginSchema.parse({ email, password });

    // Authenticate employee
    const result = await authenticateEmployee(
      validated.email,
      validated.password,
    );

    if (!result) {
      // Log failed login attempt with location
      // We need to find employee ID from email - but we can't without exposing security
      // So we'll skip logging failed attempts without employee ID
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Log successful login with location
    try {
      await createLoginLog(result.employee.id, 'success', {
        latitude,
        longitude,
        accuracy,
        ipAddress,
        userAgent,
      });
    } catch (logError) {
      // Don't fail login if logging fails
      console.error('Failed to create login log:', logError);
    }

    // Create session
    const token = await createEmployeeSession(result.employee);
    const cookieStore = await cookies();
    cookieStore.set('employee_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return {
      success: true,
      requirePasswordChange: result.requirePasswordChange,
      employmentType: result.employee.employment_type,
    };
  } catch (error) {
    console.error('Employee login error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

/**
 * Employee logout action
 */
export async function employeeLogoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('employee_session');
}

/**
 * Change password action
 */
export async function changePasswordAction(
  employeeId: number,
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate input
    const validated = changePasswordSchema.parse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    // Check if passwords match
    if (validated.newPassword !== validated.confirmPassword) {
      return {
        success: false,
        error: 'New passwords do not match',
      };
    }

    // Verify current password by attempting to authenticate
    const { authenticateEmployee } = await import('@/lib/erp/employee-auth');
    const { getEmployeeById } = await import('@/lib/erp/employees');

    const employee = await getEmployeeById(employeeId);
    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    const authResult = await authenticateEmployee(
      employee.email,
      validated.currentPassword,
    );
    if (!authResult) {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    // Change password
    await changeEmployeePassword(employeeId, validated.newPassword);

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to change password' };
  }
}

/**
 * Force password change action (for first login)
 */
export async function forceChangePasswordAction(
  employeeId: number,
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      'Force change password - Employee ID:',
      employeeId,
      'Type:',
      typeof employeeId,
    );

    if (!employeeId || typeof employeeId !== 'number') {
      console.error('Invalid employee ID:', employeeId);
      return {
        success: false,
        error: 'Invalid employee ID. Please try logging in again.',
      };
    }

    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate input
    const schema = z.object({
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain uppercase, lowercase, and number',
        ),
      confirmPassword: z.string().min(1, 'Please confirm your password'),
    });

    const validated = schema.parse({ newPassword, confirmPassword });

    // Check if passwords match
    if (validated.newPassword !== validated.confirmPassword) {
      return {
        success: false,
        error: 'Passwords do not match',
      };
    }

    // Change password
    await changeEmployeePassword(employeeId, validated.newPassword);

    console.log('Password changed successfully for employee:', employeeId);
    return { success: true };
  } catch (error) {
    console.error('Force change password error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to change password' };
  }
}
