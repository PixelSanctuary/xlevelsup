-- Migration: Add date_of_birth to employees (for birthday wish banners)
-- and seed the Bakrid / Eid al-Adha holiday, which company_holidays was
-- missing (only Diwali + Christmas were seeded previously).
-- Run this in your Supabase SQL Editor.

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2026 Eid al-Adha (Bakrid) falls on May 28 for most of India (Kerala/TN
-- included); update the date here in years where moon-sighting shifts it.
INSERT INTO company_holidays (date, name, holiday_type, description) VALUES
    ('2026-05-28', 'Bakrid (Eid al-Adha)', 'public', 'Festival of Sacrifice — Eid al-Adha')
ON CONFLICT (date) DO UPDATE
    SET name         = EXCLUDED.name,
        holiday_type = EXCLUDED.holiday_type,
        description  = EXCLUDED.description,
        updated_at   = CURRENT_TIMESTAMP;
