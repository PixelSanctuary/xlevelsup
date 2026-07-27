-- Migration: Replace CARD payment method with BANK_TRANSFER on orders
-- Run this in your Supabase SQL Editor.
-- Safe to run even if create-billing.sql already ran with the old
-- ('CASH','UPI','CARD') constraint, and safe to run again.

-- Update any existing rows before tightening the constraint
UPDATE orders SET payment_method = 'BANK_TRANSFER' WHERE payment_method = 'CARD';

-- Postgres has no "ALTER CHECK" — drop and recreate the constraint.
-- The constraint name below is the default Postgres assigns to the
-- inline CHECK on payment_method from create-billing.sql.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders
    ADD CONSTRAINT orders_payment_method_check
        CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER'));
