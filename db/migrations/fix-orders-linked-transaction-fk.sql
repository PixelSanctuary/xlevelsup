-- Migration: Repoint orders.linked_transaction_id at financial_ledger
--
-- Root cause of "Finances sync failed" on every invoice: orders.linked_transaction_id
-- was left with its original foreign key pointing at the legacy `client_transactions`
-- table (from before the financial_ledger unification). The app writes the synced
-- income entry into financial_ledger and then tries to stamp its id back onto the
-- order — that update is rejected by Postgres because financial_ledger ids don't
-- exist in client_transactions, so every invoice's ledger entry is created
-- successfully but silently orphaned (never linked back to its order).
--
-- Run this in your Supabase SQL Editor.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_linked_transaction_id_fkey;
ALTER TABLE orders
    ADD CONSTRAINT orders_linked_transaction_id_fkey
    FOREIGN KEY (linked_transaction_id) REFERENCES financial_ledger(id) ON DELETE SET NULL;

-- Backfill: link existing invoices to the ledger entries that were already
-- created for them (matched by invoice_number = reference_number), so past
-- "synced but not linked" invoices stop showing as unsynced too.
UPDATE orders o
SET linked_transaction_id = fl.id
FROM financial_ledger fl
WHERE fl.reference_number = o.invoice_number
  AND o.linked_transaction_id IS NULL;
