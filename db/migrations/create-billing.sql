-- Migration: Service billing / tax invoice system
-- Run this in your Supabase SQL Editor

-- 1. Orders (one row per client invoice)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(20) UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER')),
    status VARCHAR(20) NOT NULL DEFAULT 'delivered' CHECK (status IN ('delivered', 'cancelled')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    taxable_value NUMERIC(10, 2) NOT NULL CHECK (taxable_value >= 0),
    cgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    sgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(10, 2) NOT NULL CHECK (grand_total >= 0),
    notes TEXT,
    linked_transaction_id INTEGER REFERENCES financial_ledger(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Order line items — free-text services, no product catalog
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    rate NUMERIC(10, 2) NOT NULL CHECK (rate >= 0),
    line_total NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * rate) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Sequential invoice numbering: XLU-2026-0001, XLU-2026-0002, ...
-- The serial keeps counting up across years (no reset each January/April) —
-- only the year segment changes to reflect when the invoice was created.
CREATE SEQUENCE IF NOT EXISTS orders_invoice_number_seq START WITH 1;

CREATE OR REPLACE FUNCTION set_order_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'XLU-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
            LPAD(nextval('orders_invoice_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_invoice_number ON orders;
CREATE TRIGGER trg_set_order_invoice_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_invoice_number();

-- 4. Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders(invoice_number);
CREATE INDEX IF NOT EXISTS idx_orders_client_name ON orders(client_name);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 5. Enable RLS (app-layer authorization only, consistent with the rest of this schema)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON orders FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON order_items FOR ALL USING (true);
