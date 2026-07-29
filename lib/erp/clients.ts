/**
 * Data layer for Clients (Supabase)
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { Client, ClientFormData, ClientFinancialSummary } from '@/types/erp';
import { handleDatabaseError } from './error-handler';

/**
 * Get all clients, most recently added first
 */
export async function getClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    // Fallback if the table does not exist or isn't migrated yet
    if (error) {
      console.warn('Clients table fetch failed, returning empty list:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error fetching clients:', err);
    return [];
  }
}

/**
 * Look up a client by exact (case-insensitive) name — used to enrich a
 * generated invoice with the client's phone number. Soft-fails to null
 * since this is a display enrichment, not something that should ever
 * block invoice creation.
 */
export async function getClientByName(name: string): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .ilike('name', name)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching client by name:', err);
    return null;
  }
}

export async function getClientById(id: number): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    throw handleDatabaseError(error, 'fetch client');
  }
}

/**
 * Create a new client, auto-generating the next sequential client_id
 * (CLI-0001, CLI-0002, ...) — same numbering scheme used by the
 * financial_ledger auto-create trigger.
 */
export async function createClient(data: ClientFormData): Promise<Client> {
  try {
    const { data: existing, error: idError } = await supabase
      .from('clients')
      .select('client_id')
      .like('client_id', 'CLI-%');

    if (idError) throw idError;

    const nextNum =
      (existing || []).reduce((max, row) => {
        const num = parseInt((row.client_id as string).replace('CLI-', ''), 10);
        return Number.isNaN(num) ? max : Math.max(max, num);
      }, 0) + 1;

    const client_id = `CLI-${String(nextNum).padStart(4, '0')}`;

    const { data: created, error } = await supabase
      .from('clients')
      .insert({ ...data, client_id })
      .select()
      .single();

    if (error) throw error;
    return created;
  } catch (error) {
    throw handleDatabaseError(error, 'create client');
  }
}

export async function updateClient(
  id: number,
  data: Partial<ClientFormData>,
): Promise<Client> {
  try {
    const { data: updated, error } = await supabase
      .from('clients')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  } catch (error) {
    throw handleDatabaseError(error, 'update client');
  }
}

export async function deleteClient(id: number): Promise<void> {
  try {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    throw handleDatabaseError(error, 'delete client');
  }
}

/**
 * Per-client income summary, aggregated from financial_ledger, keyed by
 * client name (financial_ledger.client_name is free text, not FK'd to
 * clients.id).
 */
export async function getClientFinancialSummaries(): Promise<
  Record<string, ClientFinancialSummary>
> {
  try {
    const { data, error } = await supabase
      .from('financial_ledger')
      .select('client_name, amount, payment_status, transaction_date')
      .eq('direction', 'inflow')
      .not('client_name', 'is', null);

    if (error) throw error;

    const summaries: Record<string, ClientFinancialSummary> = {};

    for (const row of data || []) {
      const name = row.client_name as string;
      if (!name) continue;

      if (!summaries[name]) {
        summaries[name] = { totalIncome: 0, pendingIncome: 0, lastTransactionDate: null };
      }

      const amount = Number(row.amount || 0);
      if (row.payment_status === 'completed') {
        summaries[name].totalIncome += amount;
      } else if (row.payment_status === 'pending') {
        summaries[name].pendingIncome += amount;
      }

      const date = row.transaction_date as string;
      if (!summaries[name].lastTransactionDate || date > summaries[name].lastTransactionDate!) {
        summaries[name].lastTransactionDate = date;
      }
    }

    return summaries;
  } catch (err) {
    console.error('Error calculating client financial summaries:', err);
    return {};
  }
}
