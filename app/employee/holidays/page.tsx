/**
 * Employee Holiday Calendar Page
 */

import { requireFullPortalAccess } from '@/lib/erp/employee-portal-auth';
import { getHolidaysForYear } from '@/lib/erp/holidays';
import EmployeeHolidayCalendar from '@/components/erp/employee/EmployeeHolidayCalendar';
import Link from 'next/link';

export default async function EmployeeHolidaysPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireFullPortalAccess();

  const params = await searchParams;
  const year = params.year ? parseInt(params.year) : new Date().getFullYear();

  const holidays = await getHolidaysForYear(year);

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
              <h1 className='text-2xl font-bold text-white'>Holiday Calendar</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <EmployeeHolidayCalendar holidays={holidays} initialYear={year} />
      </main>
    </div>
  );
}
