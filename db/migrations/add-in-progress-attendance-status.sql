-- Migration: Add 'in_progress' as a valid attendance.status value
-- Run this in your Supabase SQL Editor.
-- Represents an employee who has clocked in today but not yet clocked
-- out — distinct from 'present', which now only applies once the day's
-- session is complete (or the record was set directly, e.g. via
-- regularisation/bulk update).

-- Postgres has no "ALTER CHECK" — drop and recreate the constraint.
-- The constraint name below is the default Postgres assigns to the
-- inline CHECK on status from schema.sql.
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE attendance
    ADD CONSTRAINT attendance_status_check
        CHECK (status IN ('present', 'absent', 'half-day', 'paid-leave', 'unpaid-leave', 'holiday', 'in_progress'));
