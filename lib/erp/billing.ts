/**
 * Database helper functions for service billing & tax invoices (Supabase)
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import { handleDatabaseError } from './error-handler';
import type { Order, OrderItem, PaymentMethod } from '@/types/billing';

export { GST_RATE, computeGstBreakdown } from '@/lib/billing-tax';

export async function createOrder(order: {
  client_name: string;
  payment_method: PaymentMethod;
  taxable_value: number;
  cgst_amount: number;
  sgst_amount: number;
  grand_total: number;
  notes: string | null;
  created_by: number;
}): Promise<Order> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...order,
        status: 'delivered',
        payment_status: 'completed',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleDatabaseError(error, 'create order');
  }
}

export async function createOrderItems(
  orderId: number,
  items: Array<{ description: string; quantity: number; rate: number }>,
): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .insert(items.map((item) => ({ ...item, order_id: orderId })))
    .select();

  if (error) throw error;
  return data || [];
}

/**
 * Rollback helper: remove an order created earlier in the same checkout
 * if a later step (line items) fails.
 */
export async function deleteOrder(orderId: number): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) {
    console.error(`Rollback failed to delete order ${orderId}:`, error);
  }
}

/**
 * Link an invoice back to the client_transactions row that was
 * auto-created for it, once that finance-ledger sync succeeds.
 */
export async function linkOrderTransaction(
  orderId: number,
  transactionId: number,
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ linked_transaction_id: transactionId })
    .eq('id', orderId);

  if (error) throw error;
}

/**
 * List past invoices (newest first), optionally filtered by month
 * (YYYY-MM) and/or a case-insensitive client-name search.
 */
export async function getOrders(filters?: {
  month?: string;
  clientName?: string;
}): Promise<Order[]> {
  try {
    let query = supabase.from('orders').select('*');

    if (filters?.month) {
      const startDate = `${filters.month}-01`;
      const nextMonth = new Date(`${filters.month}-01`);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().slice(0, 10);
      query = query.gte('created_at', startDate).lt('created_at', nextMonthStr);
    }

    if (filters?.clientName) {
      query = query.ilike('client_name', `%${filters.clientName}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw handleDatabaseError(error, 'fetch orders');
  }
}

/**
 * Fetch a single invoice with its line items — used to reconstruct a
 * printable/downloadable receipt for a past invoice.
 */
export async function getOrderWithItems(
  orderId: number,
): Promise<{ order: Order; items: OrderItem[] } | null> {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return null;

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('id', { ascending: true });

    if (itemsError) throw itemsError;

    return { order, items: items || [] };
  } catch (error) {
    throw handleDatabaseError(error, 'fetch invoice');
  }
}
