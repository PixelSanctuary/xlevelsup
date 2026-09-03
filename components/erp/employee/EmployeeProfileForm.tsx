'use client';

/**
 * Employee Profile Form (Employee Portal)
 *
 * Lets an employee edit their own name, phone, and date of birth only.
 * Email (also the login username), salary, role, department, employment
 * type, and status are not editable here — those stay admin/HR-only.
 */

import { useActionState, useEffect, useRef, useState } from 'react';
import { updateOwnBasicDetailsAction } from '@/actions/erp/employees';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { toast } from 'react-hot-toast';
import { restoreFormValues } from '@/lib/utils/form';
import type { Employee } from '@/types/erp';

interface EmployeeProfileFormProps {
  employee: Employee;
}

export default function EmployeeProfileForm({ employee }: EmployeeProfileFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const lastFormData = useRef<FormData | null>(null);

  const [dateOfBirth, setDateOfBirth] = useState(employee.date_of_birth || '');

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; error?: string } | null,
      formData: FormData,
    ) => {
      lastFormData.current = formData;
      return await updateOwnBasicDetailsAction(prevState, formData);
    },
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success('Profile updated successfully!');
    } else if (state?.error) {
      toast.error(state.error);
      // React resets uncontrolled fields once the action resolves, even
      // though this is an error — put the user's input back.
      restoreFormValues(formRef.current, lastFormData.current);
    }
  }, [state]);

  // "Today" as YYYY-MM-DD, for the date-of-birth upper bound.
  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  return (
    <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
      <h2 className='text-xl font-bold text-white mb-4'>Edit Profile</h2>

      <form ref={formRef} action={formAction} className='space-y-4'>
        {/* Name */}
        <div>
          <label htmlFor='name' className='block text-sm font-medium mb-2 text-gray-300'>
            Full Name <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            id='name'
            name='name'
            required
            minLength={2}
            defaultValue={employee.name}
            disabled={isPending}
            className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white'
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor='phone' className='block text-sm font-medium mb-2 text-gray-300'>
            Phone Number <span className='text-red-500'>*</span>
          </label>
          <input
            type='tel'
            id='phone'
            name='phone'
            required
            minLength={10}
            defaultValue={employee.phone}
            disabled={isPending}
            className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white'
          />
        </div>

        {/* Date of Birth */}
        <div>
          <DatePicker
            label='Date of Birth'
            value={dateOfBirth}
            onChange={setDateOfBirth}
            maxDate={today}
            placeholder='Select date of birth'
          />
          <input type='hidden' name='date_of_birth' value={dateOfBirth} />
        </div>

        {/* Read-only fields, admin/HR-controlled */}
        <div className='pt-2 border-t border-gray-800'>
          <p className='text-xs text-gray-500 mb-3'>
            Email, role, department, and salary can only be changed by an admin or HR.
          </p>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='text-gray-400'>Email</p>
              <p className='text-gray-300'>{employee.email}</p>
            </div>
            <div>
              <p className='text-gray-400'>Role</p>
              <p className='text-gray-300'>{employee.role}</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button type='submit' variant='primary' className='w-full' disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
