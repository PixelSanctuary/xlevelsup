'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { updateServiceInvoice } from '@/actions/erp/billing';
import { computeGstBreakdown, round2Amount, CGST_RATE_LABEL, SGST_RATE_LABEL } from '@/lib/billing-tax';
import { formatCurrency } from '@/lib/erp/utils';
import type { InvoiceLineItem, Order, OrderItem, PaymentMethod, ReceiptData } from '@/types/billing';

interface InvoiceEditModalProps {
  /** The invoice being edited, or null when the modal is closed. */
  target: { order: Order; items: OrderItem[] } | null;
  onClose: () => void;
  /** Fired after a successful save so the caller can refresh the list and show the updated receipt. */
  onSaved: (receipt: ReceiptData) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'UPI', 'BANK_TRANSFER'];

// A saved line item's "amount" is its stored line_total (quantity * rate),
// not the raw rate — this matches what the printed receipt shows, and stays
// correct even for older rows saved with a quantity other than 1.
const toEditableItems = (items: OrderItem[]): InvoiceLineItem[] =>
  items.map((item) => ({
    description: item.description,
    quantity: 1,
    rate: Number(item.line_total),
  }));

export default function InvoiceEditModal({ target, onClose, onSaved }: InvoiceEditModalProps) {
  const [items, setItems] = useState<InvoiceLineItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Reset the form whenever a different invoice is loaded into the modal.
  useEffect(() => {
    if (!target) return;
    setItems(toEditableItems(target.items));
    setPaymentMethod(target.order.payment_method);
    setNotes(target.order.notes || '');
    setAttemptedSubmit(false);
  }, [target]);

  const lineTotals = useMemo(() => items.map((item) => round2Amount(item.rate)), [items]);
  const grandTotal = round2Amount(lineTotals.reduce((sum, total) => sum + total, 0));
  const taxPreview = computeGstBreakdown(grandTotal);

  const validItems = items.filter((item) => item.description.trim().length > 0);

  const lineErrors = useMemo(() => {
    if (!attemptedSubmit) return {} as Record<number, string>;
    const errs: Record<number, string> = {};
    items.forEach((item, index) => {
      if (!item.description.trim()) return;
      if (item.rate <= 0) errs[index] = 'Amount must be greater than 0';
    });
    return errs;
  }, [attemptedSubmit, items]);

  const itemsError =
    attemptedSubmit && validItems.length === 0
      ? 'Add at least one line item with a description'
      : null;

  const updateItem = (index: number, patch: Partial<InvoiceLineItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addLine = () => setItems((prev) => [...prev, { description: '', quantity: 1, rate: 0 }]);

  const removeLine = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSave = async () => {
    if (!target) return;
    setAttemptedSubmit(true);

    const hasLineErrors = items.some((item) => item.description.trim() && item.rate <= 0);
    if (validItems.length === 0 || hasLineErrors || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await updateServiceInvoice(target.order.id, {
        paymentMethod,
        items: validItems.map((item) => ({
          description: item.description.trim(),
          quantity: 1,
          rate: item.rate,
        })),
        notes: notes.trim() || null,
      });

      if (result.success && result.receipt) {
        toast.success(`Invoice ${result.invoiceNumber} updated`);
        if (result.financeSyncFailed) {
          toast.error(
            `Invoice ${result.invoiceNumber} updated, but Finances sync failed — update it manually.`,
          );
        }
        onSaved(result.receipt);
      } else {
        toast.error(result.error || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Failed to update invoice:', error);
      toast.error('Failed to update invoice — please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={!!target}
      onClose={onClose}
      title={target ? `Edit Invoice ${target.order.invoice_number}` : 'Edit Invoice'}
    >
      {target && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="glass p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Invoice Number</p>
              <p className="text-sm font-semibold">{target.order.invoice_number}</p>
            </div>
            <div className="glass p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Client Name</p>
              <p className="text-sm font-semibold">{target.order.client_name}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Invoice number and client name can&apos;t be changed.
          </p>

          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Line Items</h3>
              <button onClick={addLine} className="text-xs font-semibold text-cyan hover:underline">
                + Add line
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const lineError = lineErrors[index];
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        className="flex-1 w-full bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount"
                        value={item.rate}
                        onChange={(e) => updateItem(index, { rate: Number(e.target.value) })}
                        className={`w-full sm:w-32 bg-transparent border rounded-lg px-3 py-2 text-sm focus:outline-none ${
                          lineError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-cyan'
                        }`}
                      />
                      <button
                        onClick={() => removeLine(index)}
                        disabled={items.length === 1}
                        className="text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed px-1"
                      >
                        ✕
                      </button>
                    </div>
                    {lineError && <p className="text-xs text-red-400 pl-1">{lineError}</p>}
                  </div>
                );
              })}
            </div>
            {itemsError && <p className="text-xs text-red-400 mt-2">{itemsError}</p>}
          </div>

          <div className="glass p-4 rounded-lg">
            <label className="block text-xs font-medium text-gray-400 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan resize-none"
            />
          </div>

          <div className="glass p-4 rounded-lg">
            <label className="block text-xs font-medium text-gray-400 mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                    paymentMethod === method
                      ? 'bg-cyan/10 border-cyan text-cyan'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {method.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Taxable Value</span>
                <span>{formatCurrency(taxPreview.taxableValue)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>CGST ({CGST_RATE_LABEL})</span>
                <span>{formatCurrency(taxPreview.cgstAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>SGST ({SGST_RATE_LABEL})</span>
                <span>{formatCurrency(taxPreview.sgstAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1.5 border-t border-gray-800">
                <span>Grand Total</span>
                <span className="text-cyan">{formatCurrency(taxPreview.grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="py-2.5 rounded-lg text-sm font-semibold border border-gray-700 text-gray-200 hover:border-gray-500 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan to-purple text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
