'use client';

import { useFormStatus } from 'react-dom';
import { useState, useEffect, useActionState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import {
  createEmployeeAction,
  updateEmployeeAction,
} from '@/actions/erp/employees';
import type { Employee } from '@/types/erp';

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type='submit'
      variant='primary'
      className='w-full'
      disabled={pending}
    >
      {pending ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}
    </Button>
  );
}

interface EmployeeFormProps {
  employee?: Employee;
  onSuccess?: () => void;
  departments: string[];
}

export default function EmployeeForm({
  employee,
  onSuccess,
  departments,
}: EmployeeFormProps) {
  const isEdit = !!employee;
  const [employmentType, setEmploymentType] = useState(
    employee?.employment_type || 'full-time',
  );
  const [salaryType, setSalaryType] = useState(
    employee?.salary_type || 'monthly',
  );

  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (isEdit) {
        return await updateEmployeeAction(employee.id, formData);
      } else {
        return await createEmployeeAction(formData);
      }
    },
    { success: false },
  );

  useEffect(() => {
    if (state.success) {
      toast.success(
        isEdit
          ? 'Employee updated successfully!'
          : 'Employee created successfully!',
        {
          duration: 2000,
          position: 'top-center',
        },
      );
      onSuccess?.();
    } else if (state.error) {
      toast.error(state.error, {
        duration: 3000,
        position: 'top-center',
      });
    }
  }, [state, isEdit, onSuccess]);

  return (
    <form action={formAction} className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label
            htmlFor='employee_id'
            className='block text-sm font-medium mb-2'
          >
            Employee ID {isEdit && '*'}
            {!isEdit && (
              <span className='text-gray-400 text-xs ml-2'>
                (Auto-generated:{' '}
                {employmentType === 'temporary' ? 'TEMP000' : 'XLU000'})
              </span>
            )}
          </label>
          <input
            type='text'
            id='employee_id'
            name='employee_id'
            required={isEdit} // Required only when editing
            defaultValue={employee?.employee_id}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors disabled:opacity-50'
            placeholder={
              employmentType === 'temporary'
                ? 'TEMP000 (auto-generated)'
                : 'XLU000 (auto-generated)'
            }
            disabled={isEdit} // Disable editing of ID when updating
          />
        </div>

        <div>
          <label htmlFor='name' className='block text-sm font-medium mb-2'>
            Full Name *
          </label>
          <input
            type='text'
            id='name'
            name='name'
            required
            defaultValue={employee?.name}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            placeholder='John Doe'
          />
        </div>

        <div>
          <label htmlFor='email' className='block text-sm font-medium mb-2'>
            Email *
          </label>
          <input
            type='email'
            id='email'
            name='email'
            required
            defaultValue={employee?.email}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            placeholder='john@xlevelsup.com'
          />
        </div>

        <div>
          <label htmlFor='phone' className='block text-sm font-medium mb-2'>
            Phone *
          </label>
          <input
            type='tel'
            id='phone'
            name='phone'
            required
            defaultValue={employee?.phone}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            placeholder='+91 9876543210'
          />
        </div>

        <div>
          <label
            htmlFor='department'
            className='block text-sm font-medium mb-2'
          >
            Department *
          </label>
          {departments.length > 0 ? (
            <select
              id='department'
              name='department'
              required
              defaultValue={employee?.department}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
              <option value='Engineering'>Engineering</option>
              <option value='Marketing'>Marketing</option>
              <option value='Sales'>Sales</option>
              <option value='HR'>HR</option>
              <option value='Finance'>Finance</option>
            </select>
          ) : (
            <input
              type='text'
              id='department'
              name='department'
              required
              defaultValue={employee?.department}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
              placeholder='Engineering'
            />
          )}
        </div>

        <div>
          <label htmlFor='role' className='block text-sm font-medium mb-2'>
            Role/Designation *
          </label>
          <input
            type='text'
            id='role'
            name='role'
            required
            defaultValue={employee?.role}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            placeholder='Senior Developer'
          />
        </div>

        <div>
          <label
            htmlFor='employment_type'
            className='block text-sm font-medium mb-2'
          >
            Employment Type *
          </label>
          <select
            id='employment_type'
            name='employment_type'
            required
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as any)}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value='full-time'>Full-Time (Permanent)</option>
            <option value='part-time'>Part-Time (Permanent)</option>
            <option value='contract'>Contract</option>
            <option value='temporary'>Temporary</option>
            <option value='freelancer'>Freelancer</option>
            <option value='intern'>Intern</option>
            <option value='consultant'>Consultant</option>
          </select>
        </div>

        <div>
          <label
            htmlFor='joining_date'
            className='block text-sm font-medium mb-2'
          >
            Joining Date *
          </label>
          <input
            type='date'
            id='joining_date'
            name='joining_date'
            required
            defaultValue={employee?.joining_date}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        {/* Optional date of birth field — powers birthday wish banners in the employee portal */}
        <div>
          <label
            htmlFor='date_of_birth'
            className='block text-sm font-medium mb-2'
          >
            Date of Birth (Optional)
          </label>
          <input
            type='date'
            id='date_of_birth'
            name='date_of_birth'
            defaultValue={employee?.date_of_birth || ''}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        {/* Optional end date field */}
        <div>
          <label htmlFor='end_date' className='block text-sm font-medium mb-2'>
            End Date (Optional)
          </label>
          <input
            type='date'
            id='end_date'
            name='end_date'
            defaultValue={employee?.end_date || ''}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        <div>
          <label
            htmlFor='salary_type'
            className='block text-sm font-medium mb-2'
          >
            Salary Type *
          </label>
          <select
            id='salary_type'
            name='salary_type'
            required
            value={salaryType}
            onChange={(e) => setSalaryType(e.target.value as any)}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value='monthly'>Monthly</option>
            <option value='hourly'>Hourly</option>
            <option value='contract'>Contract</option>
          </select>
        </div>

        <div>
          <label
            htmlFor='monthly_salary'
            className='block text-sm font-medium mb-2'
          >
            {salaryType === 'hourly' ? 'Base Salary (₹)' : 'Monthly Salary (₹)'}
          </label>
          <input
            type='number'
            id='monthly_salary'
            name='monthly_salary'
            min='0'
            step='0.01'
            defaultValue={employee?.monthly_salary || ''}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            placeholder='50000'
          />
        </div>

        {/* Show hourly rate for hourly/freelancer workers */}
        {(salaryType === 'hourly' || employmentType === 'freelancer') && (
          <div>
            <label
              htmlFor='hourly_rate'
              className='block text-sm font-medium mb-2'
            >
              Hourly Rate (₹/hour) {salaryType === 'hourly' ? '*' : ''}
            </label>
            <input
              type='number'
              id='hourly_rate'
              name='hourly_rate'
              required={salaryType === 'hourly'}
              min='0'
              step='0.01'
              defaultValue={employee?.hourly_rate || ''}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
              placeholder='500'
            />
          </div>
        )}

        <div>
          <label htmlFor='status' className='block text-sm font-medium mb-2'>
            Status *
          </label>
          <select
            id='status'
            name='status'
            required
            defaultValue={employee?.status || 'active'}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value='active'>Active</option>
            <option value='inactive'>Inactive</option>
          </select>
        </div>
      </div>

      <div className='pt-4'>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  );
}
