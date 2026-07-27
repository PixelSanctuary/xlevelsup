'use server';

import { z } from 'zod';
import { requireAuth, requireRole } from '@/lib/auth';
import {
  createOrder,
  createOrderItems,
  deleteOrder,
  linkOrderTransaction,
  getOrders,
  getOrderWithItems,
} from '@/lib/erp/billing';
import { insertLedgerEntry } from '@/lib/erp/finance';
import { computeGstBreakdown, round2Amount } from '@/lib/billing-tax';
import { revalidatePath } from 'next/cache';
import type { Order, ProcessServiceInvoiceResult, ReceiptData, ReceiptLineItem } from '@/types/billing';

const lineItemSchema = z.object({
  description: z.string().trim().min(1, 'Description is required'),
  quantity: z.number().positive(),
  rate: z.number().nonnegative(),
});

const processServiceInvoiceSchema = z.object({
  clientName: z.string().trim().min(1, 'Client name is required'),
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER']),
  items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
  notes: z.string().trim().nullable().optional(),
});

/**
 * Bill a client for services rendered: writes the invoice + line items,
 * then auto-creates a matching income entry in the Client Finances ledger.
 * The ledger sync is soft-fail — the invoice may already be printed/handed
 * to the client by the time it runs, so a sync failure doesn't roll back
 * the invoice itself.
 */
export async function processServiceInvoice(
  input: z.infer<typeof processServiceInvoiceSchema>,
): Promise<ProcessServiceInvoiceResult> {
  try {
    const session = await requireRole(['admin', 'hr']);

    const { clientName, paymentMethod, items, notes } =
      processServiceInvoiceSchema.parse(input);

    const linedItems = items.map((item) => ({
      ...item,
      lineTotal: round2Amount(item.quantity * item.rate),
    }));

    const grandTotal = round2Amount(linedItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const { taxableValue, cgstAmount, sgstAmount } = computeGstBreakdown(grandTotal);

    const order = await createOrder({
      client_name: clientName,
      payment_method: paymentMethod,
      taxable_value: taxableValue,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      grand_total: grandTotal,
      notes: notes || null,
      created_by: session.userId,
    });

    try {
      await createOrderItems(
        order.id,
        linedItems.map(({ lineTotal, ...item }) => item),
      );
    } catch (innerError) {
      await deleteOrder(order.id);
      throw innerError;
    }

    revalidatePath('/erp/billing');

    // Soft-fail finance sync — the invoice has already been committed
    // (and may already be printed), so a ledger-sync failure here should
    // not roll it back.
    let financeSyncFailed = false;
    try {
      const description = linedItems
        .map((item) => item.description)
        .join('; ')
        .slice(0, 1000);

      const entry = await insertLedgerEntry(
        {
          transaction_type: 'income',
          direction: 'inflow',
          category: 'Service Fee',
          amount: grandTotal,
          transaction_date: new Date().toISOString().slice(0, 10),
          payment_mode: paymentMethod,
          payment_status: 'completed',
          client_name: clientName,
          reference_number: order.invoice_number,
          description,
          notes: notes || null,
        },
        session.userId,
      );
      await linkOrderTransaction(order.id, entry.id);
      revalidatePath('/erp/finances');
    } catch (syncError) {
      console.error(`Finance sync failed for invoice ${order.invoice_number}:`, syncError);
      financeSyncFailed = true;
    }

    const receiptItems: ReceiptLineItem[] = linedItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    }));

    return {
      success: true,
      financeSyncFailed,
      orderId: order.id,
      orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
      invoiceNumber: order.invoice_number,
      receipt: {
        invoiceNumber: order.invoice_number,
        orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
        createdAt: order.created_at,
        paymentMethod: order.payment_method,
        clientName,
        items: receiptItems,
        taxableValue,
        cgstAmount,
        sgstAmount,
        grandTotal,
      },
    };
  } catch (error) {
    console.error('Process service invoice error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process invoice',
    };
  }
}

/**
 * List past invoices for the history view.
 */
export async function getOrdersAction(filters?: {
  month?: string;
  clientName?: string;
}): Promise<Order[]> {
  try {
    await requireAuth();
    return await getOrders(filters);
  } catch (error) {
    console.error('Get orders error:', error);
    return [];
  }
}

export interface GetOrderReceiptResult {
  success: boolean;
  error?: string;
  receipt?: ReceiptData;
}

/**
 * Reconstruct a printable/downloadable receipt for a past invoice, so it
 * can be reprinted from the invoice history list.
 */
export async function getOrderReceiptAction(orderId: number): Promise<GetOrderReceiptResult> {
  try {
    await requireAuth();

    const result = await getOrderWithItems(orderId);
    if (!result) {
      return { success: false, error: 'Invoice not found' };
    }

    const { order, items } = result;
    const receiptItems: ReceiptLineItem[] = items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      lineTotal: item.line_total,
    }));

    return {
      success: true,
      receipt: {
        invoiceNumber: order.invoice_number,
        orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
        createdAt: order.created_at,
        paymentMethod: order.payment_method,
        clientName: order.client_name,
        items: receiptItems,
        taxableValue: order.taxable_value,
        cgstAmount: order.cgst_amount,
        sgstAmount: order.sgst_amount,
        grandTotal: order.grand_total,
      },
    };
  } catch (error) {
    console.error('Get order receipt error:', error);
    return { success: false, error: 'Failed to fetch invoice' };
  }
}
