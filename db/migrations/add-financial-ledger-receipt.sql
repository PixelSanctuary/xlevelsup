-- Migration: Add receipt_path to financial_ledger (image/PDF receipt attachments)
-- Stores a Supabase Storage object path (bucket: expense-receipts), not a
-- public URL — the bucket is private, so viewing goes through a signed URL
-- generated server-side (see lib/erp/receipts.ts).
-- Run this in your Supabase SQL Editor.

ALTER TABLE financial_ledger
    ADD COLUMN IF NOT EXISTS receipt_path TEXT;
