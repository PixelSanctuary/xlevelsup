/**
 * Shared shell for the employee portal (app/employee/**).
 * Renders seasonal/birthday/anniversary celebration banners above every
 * page for a logged-in employee — pages themselves render their own
 * headers/backgrounds, this only adds the banner strip above them.
 */
import { getEmployeeSession } from '@/lib/erp/employee-portal-auth';
import { getTodaysBirthdays, getTodaysWorkAnniversaries } from '@/lib/erp/employees';
import { getTodaysFestival } from '@/lib/erp/holidays';
import { getTodayIST } from '@/lib/erp/utils';
import CelebrationBanners from '@/components/employee/CelebrationBanners';

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getEmployeeSession();

  // No session (login page), mid-forced-password-change, or freelancer
  // (attendance-only portal): skip banners entirely.
  if (
    !session ||
    session.require_password_change ||
    session.employment_type === 'freelancer'
  ) {
    return <>{children}</>;
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
