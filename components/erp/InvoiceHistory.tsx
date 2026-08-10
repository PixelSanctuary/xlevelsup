'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Table, TableRow, TableCell } from './Table';
import MonthPicker from './MonthPicker';
import InvoiceReceiptModal from './InvoiceReceiptModal';
import InvoiceEditModal from './InvoiceEditModal';
import SensitiveValue from './SensitiveValue';
import { getOrderReceiptAction, getOrderForEditAction } from '@/actions/erp/billing';
import { formatCurrency, formatDisplayDate, getCurrentMonth } from '@/lib/erp/utils';
import type { Order, OrderItem, ReceiptData } from '@/types/billing';

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
  // Remembers the last concrete month selected, so toggling "Show all" back
  // off restores it instead of landing on a blank picker.
  const [lastMonth, setLastMonth] = useState(initialMonth || getCurrentMonth());
  const [search, setSearch] = useState('');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<{ order: Order; items: OrderItem[] } | null>(null);
  const [editLoadingOrderId, setEditLoadingOrderId] = useState<number | null>(null);

  const applyMonth = (next: string) => {
    setMonth(next);
    if (next) setLastMonth(next);
    const params = new URLSearchParams();
    params.set('tab', 'history');
    // Always set `month` (even to ''), so an explicitly-cleared filter is
    // distinguishable server-side from the param simply being absent.
    params.set('month', next);
    router.push(`/erp/billing?${params.toString()}`);
  };

  const isAllTime = month === '';

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

  const handleEdit = async (order: Order) => {
    setEditLoadingOrderId(order.id);
    try {
      const result = await getOrderForEditAction(order.id);
      if (result.success && result.order && result.items) {
        setEditTarget({ order: result.order, items: result.items });
      } else {
        toast.error(result.error || 'Failed to load invoice');
      }
    } finally {
      setEditLoadingOrderId(null);
    }
  };

  const handleSaved = (updatedReceipt: ReceiptData) => {
    setEditTarget(null);
    setReceipt(updatedReceipt);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Month</label>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <MonthPicker value={month} onChange={applyMonth} />
            </div>
            <button
              type="button"
              onClick={() => applyMonth(isAllTime ? lastMonth : '')}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                isAllTime
                  ? 'bg-cyan/10 border-cyan text-cyan'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {isAllTime ? '✓ All time' : 'Show all'}
            </button>
          </div>
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
          {isAllTime ? ' — all time' : ''}
        </span>
        <span className="text-sm font-semibold text-cyan"><SensitiveValue>{formatCurrency(totalForMonth)}</SensitiveValue></span>
      </div>

      <div className="glass rounded-lg overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {isAllTime ? 'No invoices found' : 'No invoices found for this period'}
          </div>
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
                  <SensitiveValue>{formatCurrency(order.grand_total)}</SensitiveValue>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <button
                      onClick={() => handleView(order)}
                      disabled={loadingOrderId === order.id}
                      className="text-xs text-cyan hover:underline font-semibold disabled:opacity-50"
                    >
                      {loadingOrderId === order.id ? 'Loading…' : 'View / Reprint'}
                    </button>
                    <button
                      onClick={() => handleEdit(order)}
                      disabled={editLoadingOrderId === order.id}
                      className="text-xs text-gray-400 hover:text-white hover:underline font-semibold disabled:opacity-50"
                    >
                      {editLoadingOrderId === order.id ? 'Loading…' : 'Edit'}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      <InvoiceReceiptModal receipt={receipt} onClose={() => setReceipt(null)} closeLabel="Close" />
      <InvoiceEditModal target={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />
    </div>
  );
}
