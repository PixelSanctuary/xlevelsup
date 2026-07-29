-- Migration: Add attendance change request system
-- Run this in Supabase SQL Editor

-- Step 1: Create attendance_change_requests table
CREATE TABLE IF NOT EXISTS attendance_change_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_id INTEGER REFERENCES attendance(id) ON DELETE CASCADE, -- NULL if requesting new attendance record
    request_date DATE NOT NULL, -- the date for which attendance change is requested
    current_status VARCHAR(20), -- current status if changing existing record
    requested_status VARCHAR(20) NOT NULL CHECK(requested_status IN ('present', 'absent', 'half-day', 'paid-leave', 'unpaid-leave', 'holiday')),
    half_day_period VARCHAR(12) CHECK(half_day_period IN ('first_half', 'second_half')), -- which half requested_status='half-day' refers to
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Add indexes for better query performance
CREATE INDEX idx_attendance_change_requests_employee_id ON attendance_change_requests(employee_id);
CREATE INDEX idx_attendance_change_requests_status ON attendance_change_requests(status);
CREATE INDEX idx_attendance_change_requests_request_date ON attendance_change_requests(request_date);

-- Step 3: Add comments for documentation
COMMENT ON TABLE attendance_change_requests IS 'Stores employee requests to change or add attendance records';
COMMENT ON COLUMN attendance_change_requests.attendance_id IS 'Reference to existing attendance record if modifying, NULL if requesting new record';
COMMENT ON COLUMN attendance_change_requests.request_date IS 'The date for which attendance change is being requested';
COMMENT ON COLUMN attendance_change_requests.current_status IS 'Current attendance status before change (NULL for new records)';
COMMENT ON COLUMN attendance_change_requests.requested_status IS 'The desired attendance status after change';

-- Step 4: Grant permissions (if using RLS)
-- ALTER TABLE attendance_change_requests ENABLE ROW LEVEL SECURITY;

-- Policy for employees to view their own requests
-- CREATE POLICY "Employees can view own attendance change requests"
--     ON attendance_change_requests FOR SELECT
--     USING (employee_id = auth.uid()::integer);

-- Policy for employees to create their own requests
-- CREATE POLICY "Employees can create own attendance change requests"
--     ON attendance_change_requests FOR INSERT
--     WITH CHECK (employee_id = auth.uid()::integer);
