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
  updateOrder,
  replaceOrderItems,
} from '@/lib/erp/billing';
import { insertLedgerEntry, updateLedgerEntryById } from '@/lib/erp/finance';
import { getClientByName } from '@/lib/erp/clients';
import { computeGstBreakdown, round2Amount } from '@/lib/billing-tax';
import { revalidatePath } from 'next/cache';
import type {
  GetOrderForEditResult,
  Order,
  ProcessServiceInvoiceResult,
  ReceiptData,
  ReceiptLineItem,
} from '@/types/billing';

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

// Deliberately has no clientName field — invoice_number and client_name are
// fixed once an invoice exists and can't be changed via edit.
const updateServiceInvoiceSchema = z.object({
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
          approval_status: 'pending',
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

    // Best-effort enrichment — a phone number on file isn't required to bill a client.
    const matchedClient = await getClientByName(clientName);

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
        clientPhone: matchedClient?.phone ?? null,
        clientGstin: matchedClient?.gstin ?? null,
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
 * Fetch a past invoice's editable fields (raw items with rate, not
 * receipt-formatted) for the edit form.
 */
export async function getOrderForEditAction(orderId: number): Promise<GetOrderForEditResult> {
  try {
    await requireRole(['admin', 'hr']);

    const result = await getOrderWithItems(orderId);
    if (!result) {
      return { success: false, error: 'Invoice not found' };
    }

    return { success: true, order: result.order, items: result.items };
  } catch (error) {
    console.error('Get order for edit error:', error);
    return { success: false, error: 'Failed to load invoice' };
  }
}

/**
 * Edit an existing invoice's line items, payment method, and notes.
 * invoice_number and client_name are immutable by design — this action
 * never accepts them.
 */
export async function updateServiceInvoice(
  orderId: number,
  input: z.infer<typeof updateServiceInvoiceSchema>,
): Promise<ProcessServiceInvoiceResult> {
  try {
    const session = await requireRole(['admin', 'hr']);

    const { paymentMethod, items, notes } = updateServiceInvoiceSchema.parse(input);

    const existing = await getOrderWithItems(orderId);
    if (!existing) {
      return { success: false, error: 'Invoice not found' };
    }
    const { order } = existing;

    const linedItems = items.map((item) => ({
      ...item,
      lineTotal: round2Amount(item.quantity * item.rate),
    }));

    const grandTotal = round2Amount(linedItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const { taxableValue, cgstAmount, sgstAmount } = computeGstBreakdown(grandTotal);

    await updateOrder(orderId, {
      payment_method: paymentMethod,
      taxable_value: taxableValue,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      grand_total: grandTotal,
      notes: notes || null,
    });

    await replaceOrderItems(
      orderId,
      linedItems.map(({ lineTotal, ...item }) => item),
    );

    revalidatePath('/erp/billing');

    // Soft-fail finance sync, matching processServiceInvoice — the invoice
    // edit has already been committed by this point.
    let financeSyncFailed = false;
    if (order.linked_transaction_id) {
      try {
        const description = linedItems
          .map((item) => item.description)
          .join('; ')
          .slice(0, 1000);

        await updateLedgerEntryById(
          order.linked_transaction_id,
          {
            amount: grandTotal,
            payment_mode: paymentMethod,
            description,
            notes: notes || null,
          },
          session.userId,
        );
        revalidatePath('/erp/finances');
      } catch (syncError) {
        console.error(`Finance sync failed updating invoice ${order.invoice_number}:`, syncError);
        financeSyncFailed = true;
      }
    }

    const receiptItems: ReceiptLineItem[] = linedItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    }));

    const matchedClient = await getClientByName(order.client_name);

    return {
      success: true,
      financeSyncFailed,
      orderId,
      orderNumber: `ORD-${String(orderId).padStart(6, '0')}`,
      invoiceNumber: order.invoice_number,
      receipt: {
        invoiceNumber: order.invoice_number,
        orderNumber: `ORD-${String(orderId).padStart(6, '0')}`,
        createdAt: order.created_at,
        paymentMethod,
        clientName: order.client_name,
        clientPhone: matchedClient?.phone ?? null,
        clientGstin: matchedClient?.gstin ?? null,
        items: receiptItems,
        taxableValue,
        cgstAmount,
        sgstAmount,
        grandTotal,
      },
    };
  } catch (error) {
    console.error('Update service invoice error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update invoice',
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

    const matchedClient = await getClientByName(order.client_name);

    return {
      success: true,
      receipt: {
        invoiceNumber: order.invoice_number,
        orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
        createdAt: order.created_at,
        paymentMethod: order.payment_method,
        clientName: order.client_name,
        clientPhone: matchedClient?.phone ?? null,
        clientGstin: matchedClient?.gstin ?? null,
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
