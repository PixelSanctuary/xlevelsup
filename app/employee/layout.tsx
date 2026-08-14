/**
 * Shared shell for the employee portal (app/employee/**).
 * Renders seasonal/birthday/anniversary celebration banners above every
 * page for a logged-in employee — pages themselves render their own
 * headers/backgrounds, this only adds the banner strip above them.
 */
import Link from 'next/link';
import { getEmployeeSession } from '@/lib/erp/employee-portal-auth';
import { getTodaysBirthdays, getTodaysWorkAnniversaries } from '@/lib/erp/employees';
import { getTodaysFestival } from '@/lib/erp/holidays';
import { getTodayIST } from '@/lib/erp/utils';
import CelebrationBanners from '@/components/employee/CelebrationBanners';

function AdminViewBanner() {
  return (
    <div className="bg-cyan/10 border-b border-cyan/20 px-4 py-2 text-center text-xs text-cyan">
      Viewing your employee profile via your admin login ·{' '}
      <Link href="/erp/dashboard" className="font-semibold hover:underline">
        Back to Admin Dashboard
      </Link>
    </div>
  );
}

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getEmployeeSession();
  const adminBanner = session?.viaAdminSession ? <AdminViewBanner /> : null;

  // No session (login page), mid-forced-password-change, or freelancer
  // (attendance-only portal): skip celebration banners entirely.
  if (
    !session ||
    session.require_password_change ||
    session.employment_type === 'freelancer'
  ) {
    return (
      <>
        {adminBanner}
        {children}
      </>
    );
  }

  const [festival, birthdays, anniversaries] = await Promise.all([
    getTodaysFestival(),
    getTodaysBirthdays(),
    getTodaysWorkAnniversaries(),
  ]);

  const { year, month, day } = getTodayIST();
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <>
      {adminBanner}
      <CelebrationBanners
        dateKey={dateKey}
        festival={festival ? { key: festival.festivalKey, name: festival.name } : null}
        birthdays={birthdays}
        anniversaries={anniversaries}
        currentEmployeeId={session.id}
      />
      {children}
    </>
  );
}
