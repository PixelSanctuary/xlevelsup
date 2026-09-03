/**
 * Employee Profile Page
 */

import { requireFullPortalAccess } from '@/lib/erp/employee-portal-auth';
import { getEmployeeById } from '@/lib/erp/employees';
import EmployeeProfileForm from '@/components/erp/employee/EmployeeProfileForm';
import Link from 'next/link';

export default async function EmployeeProfilePage() {
  const session = await requireFullPortalAccess();
  const employee = await getEmployeeById(session.id);

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
              <h1 className='text-2xl font-bold text-white'>My Profile</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {employee ? (
          <EmployeeProfileForm employee={employee} />
        ) : (
          <p className='text-gray-400'>Unable to load your profile. Please try again later.</p>
        )}
      </main>
    </div>
  );
}
