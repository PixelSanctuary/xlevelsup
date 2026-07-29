-- Migration: Track which half (morning/afternoon) an attendance
-- 'half-day' status refers to — mirrors leave_requests.half_day_period
-- (see add-half-day-leave.sql), which already tracks this for leave
-- requests but attendance records/change-requests never did.
-- Run this in your Supabase SQL Editor. Safe to run multiple times.

ALTER TABLE attendance
    ADD COLUMN IF NOT EXISTS half_day_period VARCHAR(12)
        CHECK (half_day_period IN ('first_half', 'second_half'));

ALTER TABLE attendance_change_requests
    ADD COLUMN IF NOT EXISTS half_day_period VARCHAR(12)
        CHECK (half_day_period IN ('first_half', 'second_half'));

COMMENT ON COLUMN attendance.half_day_period IS
    'Which half of the day this half-day status refers to: first_half (morning) or second_half (afternoon); null unless status = half-day';

COMMENT ON COLUMN attendance_change_requests.half_day_period IS
    'Which half of the day the requested half-day status refers to; null unless requested_status = half-day';
