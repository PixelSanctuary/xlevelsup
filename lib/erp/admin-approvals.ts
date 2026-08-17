/**
 * Dual-control (maker-checker) approval queue for admin/HR write actions.
 *
 * Certain admin-initiated changes (bulk attendance, individual attendance
 * add/edit/delete, leave request reviews, attendance change request
 * reviews) are proposed here instead of applying immediately. A different
 * admin/HR user must approve before the underlying write actually executes.
 * The proposer can never approve their own proposal.
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type {
  AdminActionApproval,
  AdminActionApprovalWithProposer,
  AdminApprovalActionType,
} from '@/types/erp';
import {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  bulkUpsertAttendance,
} from '@/lib/erp/attendance';
import { reviewLeaveRequest } from '@/lib/erp/leave-requests';
import { reviewAttendanceChangeRequest } from '@/lib/erp/attendance-change-requests';
import type { Attendance, AttendanceFormData } from '@/types/erp';

interface CreateApprovalRequestInput {
  actionType: AdminApprovalActionType;
  targetType?: string | null;
  targetId?: number | null;
  payload: Record<string, unknown>;
  summary: string;
  proposedBy: number;
}

const DEDUP_ACTION_TYPES: AdminApprovalActionType[] = [
  'leave_review',
  'attendance_change_review',
];

/**
 * Enqueue a proposed action. For leave/attendance-change reviews, rejects if
 * the same target already has a pending proposal (two admins independently
 * deciding on the same request would otherwise stack conflicting entries).
 */
export async function createApprovalRequest(
  input: CreateApprovalRequestInput,
): Promise<AdminActionApproval> {
  if (
    DEDUP_ACTION_TYPES.includes(input.actionType) &&
    input.targetType &&
    input.targetId
  ) {
    const { data: existing, error: dedupError } = await supabase
      .from('admin_action_approvals')
      .select('id')
      .eq('target_type', input.targetType)
      .eq('target_id', input.targetId)
      .eq('status', 'pending')
      .maybeSingle();

    if (dedupError) throw dedupError;
    if (existing) {
      throw new Error(
        'This request already has a pending admin decision awaiting approval by another admin.',
      );
    }
  }

  const { data, error } = await supabase
    .from('admin_action_approvals')
    .insert({
      action_type: input.actionType,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      payload: input.payload,
      summary: input.summary,
      proposed_by: input.proposedBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AdminActionApproval;
}

/** Pending proposals a given user is allowed to act on (never their own). */
export async function getPendingApprovalsForReview(
  currentUserId: number,
): Promise<AdminActionApprovalWithProposer[]> {
  const { data, error } = await supabase
    .from('admin_action_approvals')
    .select('*, proposer:users!proposed_by(email)')
    .eq('status', 'pending')
    .neq('proposed_by', currentUserId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map((row: AdminActionApproval & { proposer?: { email: string } | null }) => ({
    ...row,
    proposer_email: row.proposer?.email || 'Unknown',
  }));
}

/** A user's own pending proposals, awaiting someone else's approval. */
export async function getMyPendingProposals(
  currentUserId: number,
): Promise<AdminActionApproval[]> {
  const { data, error } = await supabase
    .from('admin_action_approvals')
    .select('*')
    .eq('status', 'pending')
    .eq('proposed_by', currentUserId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as AdminActionApproval[]) || [];
}

interface AttendanceDeletePayload {
  employeeId: number;
  date: string;
}

interface BulkAttendancePayload {
  employeeIds: number[];
  dates: string[];
  status: Attendance['status'];
  notes: string | null;
  halfDayPeriod: Attendance['half_day_period'] | null;
}

interface ReviewPayload {
  status: 'approved' | 'rejected';
  comments?: string;
}

async function executeApprovedAction(
  row: AdminActionApproval,
  reviewerId: number,
): Promise<void> {
  switch (row.action_type) {
    case 'attendance_save': {
      const data = row.payload as unknown as AttendanceFormData;
      const existing = await getAttendance(data.employee_id, data.date);
      if (existing) {
        await updateAttendance(data.employee_id, data.date, data);
      } else {
        await createAttendance(data, row.proposed_by);
      }
      return;
    }
    case 'attendance_delete': {
      const payload = row.payload as unknown as AttendanceDeletePayload;
      await deleteAttendance(payload.employeeId, payload.date);
      return;
    }
    case 'bulk_attendance': {
      const payload = row.payload as unknown as BulkAttendancePayload;
      await bulkUpsertAttendance(
        payload.employeeIds,
        payload.dates,
        payload.status,
        payload.notes ?? null,
        row.proposed_by,
        payload.halfDayPeriod ?? null,
      );
      return;
    }
    case 'leave_review': {
      const payload = row.payload as unknown as ReviewPayload & { leaveRequestId: number };
      await reviewLeaveRequest(
        payload.leaveRequestId,
        reviewerId,
        payload.status,
        payload.comments,
      );
      return;
    }
    case 'attendance_change_review': {
      const payload = row.payload as unknown as ReviewPayload & { requestId: number };
      await reviewAttendanceChangeRequest(
        payload.requestId,
        reviewerId,
        payload.status,
        payload.comments,
      );
      return;
    }
  }
}

/**
 * Approve a proposed action: executes the deferred write, then marks the
 * queue row approved. The reviewer must be a different user than the
 * proposer — enforced here, not just in the UI.
 */
export async function approveAction(
  id: number,
  reviewerId: number,
  comments?: string,
): Promise<AdminActionApproval> {
  const { data: row, error: fetchError } = await supabase
    .from('admin_action_approvals')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (!row) throw new Error('Approval request not found');
  if (row.proposed_by === reviewerId) {
    throw new Error('You cannot approve your own change.');
  }
  if (row.status !== 'pending') {
    throw new Error('This request has already been reviewed.');
  }

  try {
    await executeApprovedAction(row as AdminActionApproval, reviewerId);
  } catch (execError) {
    const message =
      execError instanceof Error ? execError.message : 'Failed to apply the change';
    await supabase
      .from('admin_action_approvals')
      .update({ error_message: message, updated_at: new Date().toISOString() })
      .eq('id', id);
    throw new Error(`Approved, but applying the change failed: ${message}`);
  }

  const { data: updated, error: updateError } = await supabase
    .from('admin_action_approvals')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_comments: comments || null,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw updateError;
  return updated as AdminActionApproval;
}

/**
 * Reject a proposed action without executing anything. The reviewer must be
 * a different user than the proposer.
 */
export async function rejectAction(
  id: number,
  reviewerId: number,
  comments?: string,
): Promise<AdminActionApproval> {
  const { data: row, error: fetchError } = await supabase
    .from('admin_action_approvals')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (!row) throw new Error('Approval request not found');
  if (row.proposed_by === reviewerId) {
    throw new Error('You cannot reject your own change.');
  }
  if (row.status !== 'pending') {
    throw new Error('This request has already been reviewed.');
  }

  const { data: updated, error: updateError } = await supabase
    .from('admin_action_approvals')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_comments: comments || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw updateError;
  return updated as AdminActionApproval;
}
