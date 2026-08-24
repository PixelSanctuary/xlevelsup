import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getHolidaysForYear } from '@/lib/erp/holidays';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import HolidaysManager from '@/components/erp/HolidaysManager';

export default async function HolidaysPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }
  if (session.role === 'employee') {
    redirect('/erp/dashboard');
  }

  const params = await searchParams;
  const year = params.year ? parseInt(params.year) : new Date().getFullYear();

  const holidays = await getHolidaysForYear(year, { includeInactive: true });

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        <HolidaysManager holidays={holidays} initialYear={year} userRole={session.role} />
      </main>
    </ERPLayoutWrapper>
  );
}
