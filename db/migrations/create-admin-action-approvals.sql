-- Dual-control (maker-checker) approval queue for admin/HR actions.
-- Admin-initiated writes (bulk attendance, individual attendance
-- add/edit/delete, leave request reviews, attendance change request
-- reviews) are proposed here instead of applying immediately. A different
-- admin/HR user must approve before the underlying write executes.

CREATE TABLE IF NOT EXISTS admin_action_approvals (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN
        ('attendance_save', 'attendance_delete', 'bulk_attendance',
         'leave_review', 'attendance_change_review')),
    target_type VARCHAR(30),           -- 'leave_request' | 'attendance_change_request' | null
    target_id INTEGER,                 -- row id being acted on, for dedup lookups; null for bulk
    payload JSONB NOT NULL,            -- exact params needed to execute the action
    summary TEXT NOT NULL,             -- human-readable line for the notification panel
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    proposed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    error_message TEXT,                -- set if execution failed on approval; row stays 'pending'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_action_approvals_status ON admin_action_approvals(status);
CREATE INDEX IF NOT EXISTS idx_admin_action_approvals_proposed_by ON admin_action_approvals(proposed_by);
CREATE INDEX IF NOT EXISTS idx_admin_action_approvals_target ON admin_action_approvals(target_type, target_id);

ALTER TABLE admin_action_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON admin_action_approvals FOR ALL USING (true);

COMMENT ON COLUMN admin_action_approvals.payload IS 'Exact parameters needed to execute the deferred write once approved.';
COMMENT ON COLUMN admin_action_approvals.target_id IS 'leave_requests.id or attendance_change_requests.id for dedup checks; null for bulk/individual attendance actions.';
COMMENT ON COLUMN admin_action_approvals.error_message IS 'Set if execution failed at approval time; row stays pending so it is not silently lost.';
