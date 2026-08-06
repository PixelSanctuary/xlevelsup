import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLedgerEntries } from '@/lib/erp/finance';
import { getCompanyAccounts } from '@/lib/erp/company-accounts';
import { getClients } from '@/lib/erp/clients';
import { getAllEmployees } from '@/lib/erp/employees';
import { getTodayIST } from '@/lib/erp/utils';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import FinanceManager from '@/components/erp/FinanceManager';

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    type?: string;
    category?: string;
    status?: string;
    month?: string;
    year?: string;
    mode?: string;
    client?: string;
    employeeId?: string;
    payee?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }

  const params = await searchParams;
  const tab = params.tab || 'overview';

  // Re-map the tabs dynamically so filters query the ledger correctly
  const queryType =
    tab === 'income' ? 'income' :
    tab === 'investments' ? 'investment' :
    params.type || undefined;

  // Overview/Analytics compute their own KPIs, trends and breakdowns
  // client-side from a broader slice, so month is deliberately left off
  // their server query in month mode (a trend chart needs more than one
  // month of data); FinanceManager applies the month filter itself for
  // those two tabs. Year mode doesn't need this trick — a bounded
  // full-year fetch already has everything a within-year trend needs.
  const isAnalyticalTab = tab === 'overview' || tab === 'reports';

  // Default period is "now", computed in IST (not the server runtime's
  // timezone — see lib/erp/utils.ts) so the page opens scoped to the
  // current month rather than dumping the whole company history into
  // every tab. Passed down as `defaultMonth`/`defaultYear` so the client
  // initializes from the exact same resolved value instead of
  // recomputing "today" itself, which could drift a day at midnight.
  const { year: todayYear, month: todayMonth } = getTodayIST();
  const defaultMonth = `${todayYear}-${String(todayMonth).padStart(2, '0')}`;
  const defaultYear = String(todayYear);

  const periodType: 'month' | 'year' = params.year ? 'year' : 'month';
  const effectiveMonth = periodType === 'month' ? params.month || defaultMonth : undefined;
  const effectiveYear = periodType === 'year' ? params.year || defaultYear : undefined;

  const filters = {
    type: queryType,
    direction: tab === 'expenses' ? 'outflow' : undefined,
    category: params.category || undefined,
    // The Status filter's options (pending/approved/rejected/paid) are
    // approval_status vocabulary, not payment_status (which is
    // pending/completed/failed/cancelled/refunded) — this was previously
    // wired to the wrong column, so picking e.g. "Approved" matched zero rows.
    approval_status: params.status || undefined,
    payment_mode: params.mode || undefined,
    month: periodType === 'month' && !isAnalyticalTab ? effectiveMonth : undefined,
    dateFrom: periodType === 'year' ? `${effectiveYear}-01-01` : undefined,
    dateTo: periodType === 'year' ? `${effectiveYear}-12-31` : undefined,
    client: params.client || undefined,
    employeeId: params.employeeId ? parseInt(params.employeeId, 10) : undefined,
    payee: params.payee || undefined,
  };

  const [initialEntries, employees, accounts, clients] = await Promise.all([
    getLedgerEntries(session.userId, session.role, filters),
    getAllEmployees({ status: 'active' }),
    getCompanyAccounts(),
    getClients(),
  ]);

  // Fetch all account-linked transactions for CompanyAccountManager
  const accountTransactions = accounts.length > 0
    ? await getLedgerEntries(session.userId, session.role, {})
    : [];

  // Consolidate all standard categories
  const categories = [
    // Income
    'Service Fee', 'Consulting', 'Development', 'Marketing Services', 'Design Services', 'Maintenance', 'Subscription', 'License Fee', 'Other Income',
    // Expenses
    'Salary', 'Office Rent', 'Utilities', 'Internet', 'Software Subscription', 'Marketing Ads', 'Freelancer Payment', 'Travel', 'Food', 'Equipment', 'Client Project Cost', 'Maintenance', 'Tax', 'Bank Charges', 'Miscellaneous',
    // Investments
    'Founder Investment', 'Partner Capital', 'External Funding', 'Business Reserve',
  ];

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        <FinanceManager
          initialEntries={initialEntries}
          employees={employees}
          categories={categories}
          accounts={accounts}
          accountTransactions={accountTransactions}
          clients={clients}
          userRole={session.role}
          userId={session.userId}
          defaultMonth={defaultMonth}
          defaultYear={defaultYear}
        />
      </main>
    </ERPLayoutWrapper>
  );
}
