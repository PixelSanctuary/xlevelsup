/**
 * One-time cutover script: wipes all existing (test/seed) invoices before
 * going live, so the app starts clean with real data only.
 *
 * - Deletes every row in `orders` (which cascades to `order_items` via the
 *   `ON DELETE CASCADE` FK, so line items are removed automatically).
 * - Deletes the matching "Service Fee" income entries each invoice
 *   auto-created in `financial_ledger` (Client Finances) — these are NOT
 *   cascade-deleted by the orders FK (it's `ON DELETE SET NULL`, the other
 *   direction), so they'd otherwise be left orphaned.
 * - Resets the `orders_invoice_number_seq` sequence so the next invoice
 *   created is INV-001.
 *
 * Dry run by default — prints what it would delete. Pass --confirm to
 * actually delete.
 *
 * Run with: npx tsx scripts/delete-all-invoices.ts --confirm
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const confirmed = process.argv.includes('--confirm');

async function main() {
  console.log(`🔎 Target: ${supabaseUrl}`);

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, invoice_number, linked_transaction_id');

  if (ordersError) {
    console.error('❌ Failed to fetch orders:', ordersError);
    process.exit(1);
  }

  if (!orders || orders.length === 0) {
    console.log('✅ No invoices found — nothing to delete.');
    return;
  }

  const linkedTransactionIds = orders
    .map((o) => o.linked_transaction_id)
    .filter((id): id is number => id !== null);

  console.log(`📋 Found ${orders.length} invoice(s) (${linkedTransactionIds.length} with a linked Finances entry).`);

  if (!confirmed) {
    console.log('\n🧪 Dry run only — nothing was deleted. Re-run with --confirm to actually delete.');
    return;
  }

  if (linkedTransactionIds.length > 0) {
    const { error: ledgerError, count } = await supabase
      .from('financial_ledger')
      .delete({ count: 'exact' })
      .in('id', linkedTransactionIds);

    if (ledgerError) {
      console.error('❌ Failed to delete linked Finances entries:', ledgerError);
      process.exit(1);
    }
    console.log(`🗑️  Deleted ${count ?? linkedTransactionIds.length} linked Finances entr${count === 1 ? 'y' : 'ies'}.`);
  }

  const { error: deleteError, count: deletedOrders } = await supabase
    .from('orders')
    .delete({ count: 'exact' })
    .gt('id', 0);

  if (deleteError) {
    console.error('❌ Failed to delete orders:', deleteError);
    process.exit(1);
  }
  console.log(`🗑️  Deleted ${deletedOrders ?? orders.length} invoice(s) (order_items cascaded automatically).`);

  const { error: seqError } = await supabase.rpc('exec_sql', {
    sql: 'ALTER SEQUENCE orders_invoice_number_seq RESTART WITH 1;',
  });

  if (seqError) {
    console.log('\n⚠️  Could not reset the invoice number sequence automatically.');
    console.log('   Run this manually in the Supabase SQL Editor:\n');
    console.log('   ALTER SEQUENCE orders_invoice_number_seq RESTART WITH 1;\n');
  } else {
    console.log('🔢 Invoice numbering reset — next invoice will be INV-001.');
  }

  console.log('\n✅ Done. Billing is clean and ready for live data.');
}

main();
