import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getClients } from '@/lib/erp/clients';
import { getOrdersAction } from '@/actions/erp/billing';
import { getCurrentMonth } from '@/lib/erp/utils';
import ERPLayoutWrapper from '@/components/erp/ERPLayoutWrapper';
import BillingTerminal from '@/components/erp/BillingTerminal';
import InvoiceHistory from '@/components/erp/InvoiceHistory';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/erp/login');
  }
  if (session.role === 'employee') {
    redirect('/erp/dashboard');
  }

  const params = await searchParams;
  const activeTab = params.tab === 'history' ? 'history' : 'new';
  const month = params.month || getCurrentMonth();

  const clients = await getClients();
  const knownClients = clients.map((client) => client.name);

  const orders = activeTab === 'history' ? await getOrdersAction({ month }) : [];

  return (
    <ERPLayoutWrapper userEmail={session.email} userRole={session.role}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        <div className='flex gap-1 mb-6 bg-[#0a0a0a] p-1 rounded-lg w-fit'>
          <a
            href='?tab=new'
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'new'
                ? 'bg-[var(--cyan)] text-black'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            🧾 New Invoice
          </a>
          <a
            href='?tab=history'
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-[var(--cyan)] text-black'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            📜 Invoice History
          </a>
        </div>

        {activeTab === 'new' ? (
          <BillingTerminal knownClients={knownClients} />
        ) : (
          <InvoiceHistory orders={orders} initialMonth={month} />
        )}
      </main>
    </ERPLayoutWrapper>
  );
}
