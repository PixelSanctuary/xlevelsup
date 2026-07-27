'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Table, TableRow, TableCell } from './Table';
import MonthPicker from './MonthPicker';
import InvoiceReceiptModal from './InvoiceReceiptModal';
import { getOrderReceiptAction } from '@/actions/erp/billing';
import { formatCurrency, formatDisplayDate } from '@/lib/erp/utils';
import type { Order, ReceiptData } from '@/types/billing';

interface InvoiceHistoryProps {
  orders: Order[];
  initialMonth: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
};

export default function InvoiceHistory({ orders, initialMonth }: InvoiceHistoryProps) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [search, setSearch] = useState('');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);

  const applyMonth = (next: string) => {
    setMonth(next);
    const params = new URLSearchParams();
    params.set('tab', 'history');
    if (next) params.set('month', next);
    router.push(`/erp/billing?${params.toString()}`);
  };

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter(
      (order) =>
        order.client_name.toLowerCase().includes(query) ||
        order.invoice_number.toLowerCase().includes(query),
    );
  }, [orders, search]);

  const totalForMonth = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + Number(order.grand_total || 0), 0),
    [filteredOrders],
  );

  const handleView = async (order: Order) => {
    setLoadingOrderId(order.id);
    try {
      const result = await getOrderReceiptAction(order.id);
      if (result.success && result.receipt) {
        setReceipt(result.receipt);
      } else {
        toast.error(result.error || 'Failed to load invoice');
      }
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Month</label>
          <MonthPicker value={month} onChange={applyMonth} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Search</label>
          <input
            type="text"
            placeholder="Search by client or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan"
          />
        </div>
      </div>

      <div className="glass p-4 rounded-lg flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {filteredOrders.length} invoice{filteredOrders.length !== 1 ? 's' : ''}
        </span>
        <span className="text-sm font-semibold text-cyan">{formatCurrency(totalForMonth)}</span>
      </div>

      <div className="glass rounded-lg overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No invoices found for this period</div>
        ) : (
          <Table headers={['Invoice #', 'Client', 'Date', 'Payment', 'Amount', 'Actions']}>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium text-white">{order.invoice_number}</TableCell>
                <TableCell>{order.client_name}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {formatDisplayDate(order.created_at)}
                </TableCell>
                <TableCell className="text-xs">
                  {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
                </TableCell>
                <TableCell className="font-semibold whitespace-nowrap">
                  {formatCurrency(order.grand_total)}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleView(order)}
                    disabled={loadingOrderId === order.id}
                    className="text-xs text-cyan hover:underline font-semibold disabled:opacity-50 whitespace-nowrap"
                  >
                    {loadingOrderId === order.id ? 'Loading…' : 'View / Reprint'}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      <InvoiceReceiptModal receipt={receipt} onClose={() => setReceipt(null)} closeLabel="Close" />
    </div>
  );
}
