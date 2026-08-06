'use server';

import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '@/lib/erp/employees';
import { revalidatePath } from 'next/cache';
import type { Employee } from '@/types/erp';

const employeeSchema = z.object({
  employee_id: z.string().optional(), // Optional - will be auto-generated
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
  employment_type: z.enum([
    'full-time',
    'part-time',
    'contract',
    'temporary',
    'freelancer',
    'intern',
    'consultant',
  ]),
  joining_date: z.string().min(1, 'Joining date is required'),
  date_of_birth: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  salary_type: z.enum(['monthly', 'hourly', 'contract']),
  monthly_salary: z
    .number()
    .min(0, 'Salary must be positive')
    .optional()
    .nullable(),
  hourly_rate: z.number().min(0).optional().nullable(),
  status: z.enum(['active', 'inactive']),
}).refine(
  (data) => data.salary_type !== 'hourly' || (data.hourly_rate ?? 0) > 0,
  { message: 'Hourly rate is required for hourly salary type', path: ['hourly_rate'] },
);

export interface EmployeeActionResult {
  success: boolean;
  error?: string;
  employee?: Employee;
}

/**
 * Get all employees
 */
export async function getEmployeesAction(filters?: {
  status?: 'active' | 'inactive';
  department?: string;
  search?: string;
}): Promise<Employee[]> {
  try {
    await requireRole(['admin', 'hr']);
    return await getAllEmployees(filters);
  } catch (error) {
    console.error('Get employees error:', error);
    return [];
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeByIdAction(
  id: number,
): Promise<Employee | null> {
  try {
    await requireRole(['admin', 'hr']);
    return (await getEmployeeById(id)) || null;
  } catch (error) {
    console.error('Get employee error:', error);
    return null;
  }
}

/**
 * Create employee
 */
export async function createEmployeeAction(
  formData: FormData,
): Promise<EmployeeActionResult> {
  try {
    await requireRole(['admin', 'hr']);

    const rawData = {
      employee_id: (formData.get('employee_id') as string) || undefined,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string,
      department: formData.get('department') as string,
      employment_type:
        (formData.get('employment_type') as string) || 'full-time',
      joining_date: formData.get('joining_date') as string,
      date_of_birth: (formData.get('date_of_birth') as string) || null,
      end_date: (formData.get('end_date') as string) || null,
      salary_type: formData.get('salary_type') as string,
      monthly_salary: formData.get('monthly_salary')
        ? parseFloat(formData.get('monthly_salary') as string)
        : null,
      hourly_rate: formData.get('hourly_rate')
        ? parseFloat(formData.get('hourly_rate') as string)
        : null,
      status: (formData.get('status') as string) || 'active',
    };

    const validatedData = employeeSchema.parse(rawData);
    const employee = await createEmployee(validatedData);

    revalidatePath('/erp/employees');
    return { success: true, employee };
  } catch (error) {
    console.error('Create employee error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return { success: false, error: 'Employee ID or email already exists' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create employee',
    };
  }
}

/**
 * Update employee
 */
export async function updateEmployeeAction(
  id: number,
  formData: FormData,
): Promise<EmployeeActionResult> {
  try {
    await requireRole(['admin', 'hr']);

    const rawData = {
      employee_id: (formData.get('employee_id') as string) || undefined,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string,
      department: formData.get('department') as string,
      employment_type:
        (formData.get('employment_type') as string) || 'full-time',
      joining_date: formData.get('joining_date') as string,
      date_of_birth: (formData.get('date_of_birth') as string) || null,
      end_date: (formData.get('end_date') as string) || null,
      salary_type: formData.get('salary_type') as string,
      monthly_salary: formData.get('monthly_salary')
        ? parseFloat(formData.get('monthly_salary') as string)
        : null,
      hourly_rate: formData.get('hourly_rate')
        ? parseFloat(formData.get('hourly_rate') as string)
        : null,
      status: formData.get('status') as string,
    };

    const validatedData = employeeSchema.parse(rawData);
    const employee = await updateEmployee(id, validatedData);

    revalidatePath('/erp/employees');
    return { success: true, employee };
  } catch (error) {
    console.error('Update employee error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update employee',
    };
  }
}

/**
 * Delete employee
 */
export async function deleteEmployeeAction(
  id: number,
): Promise<EmployeeActionResult> {
  try {
    await requireRole(['admin', 'hr']);
    await deleteEmployee(id);
    revalidatePath('/erp/employees');
    return { success: true };
  } catch (error) {
    console.error('Delete employee error:', error);
    return { success: false, error: 'Failed to delete employee' };
  }
}
