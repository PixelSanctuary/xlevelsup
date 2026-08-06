-- Migration: Create company_accounts table
-- Run this in your Supabase SQL Editor

-- 1. Create the company_accounts table
CREATE TABLE IF NOT EXISTS company_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    account_type VARCHAR(50) DEFAULT 'general' CHECK (account_type IN ('general', 'stakeholder', 'operations', 'reserve')),
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add account_id column to financial_ledger (links transactions to accounts)
ALTER TABLE financial_ledger
    ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES company_accounts(id) ON DELETE SET NULL;

-- 3. Add index for fast account-based filtering
CREATE INDEX IF NOT EXISTS idx_financial_ledger_account ON financial_ledger(account_id);

-- 4. Enable RLS on company_accounts
ALTER TABLE company_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON company_accounts FOR ALL USING (true);

-- 5. Seed default account
INSERT INTO company_accounts (name, description, account_type, opening_balance)
VALUES
    ('Company Account', 'Main operational account for all company expenses, software subscriptions, and salary disbursements', 'operations', 0)
ON CONFLICT (name) DO NOTHING;
