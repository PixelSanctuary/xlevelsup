-- Migration: Remove the Director company account
-- Company Account is now the sole account transactions are recorded against.
-- Run this in your Supabase SQL Editor.

-- 1. Re-point any existing transactions from Director to Company Account
UPDATE financial_ledger
SET account_id = (SELECT id FROM company_accounts WHERE name = 'Company Account')
WHERE account_id = (SELECT id FROM company_accounts WHERE name = 'Director');

-- 2. Deactivate the Director account (soft delete — preserves history, hides from UI)
UPDATE company_accounts
SET is_active = false, updated_at = CURRENT_TIMESTAMP
WHERE name = 'Director';

-- 3. Drop 'director' from the allowed account_type values going forward
ALTER TABLE company_accounts DROP CONSTRAINT IF EXISTS company_accounts_account_type_check;
ALTER TABLE company_accounts ADD CONSTRAINT company_accounts_account_type_check
    CHECK (account_type IN ('general', 'stakeholder', 'operations', 'reserve'));
