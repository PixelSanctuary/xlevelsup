'use server';

/**
 * Server actions for the dual-control (maker-checker) admin approval queue.
 */

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import {
  getPendingApprovalsForReview,
  getMyPendingProposals,
  approveAction,
  rejectAction,
} from '@/lib/erp/admin-approvals';
import type {
  AdminActionApproval,
  AdminActionApprovalWithProposer,
  AdminApprovalActionType,
} from '@/types/erp';

function revalidateForActionType(actionType: AdminApprovalActionType) {
  if (
    actionType === 'attendance_save' ||
    actionType === 'attendance_delete' ||
    actionType === 'bulk_attendance'
  ) {
    revalidatePath('/erp/attendance');
  } else if (actionType === 'leave_review') {
    revalidatePath('/erp/leave-requests');
    revalidatePath('/employee/leave');
  } else if (actionType === 'attendance_change_review') {
    revalidatePath('/erp/attendance-change-requests');
  }
}

export async function getPendingApprovalsForMeAction(): Promise<
  AdminActionApprovalWithProposer[]
> {
  try {
    const session = await requireRole(['admin', 'hr']);
    return await getPendingApprovalsForReview(session.userId);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    return [];
  }
}

export async function getMyPendingProposalsAction(): Promise<
  AdminActionApproval[]
> {
  try {
    const session = await requireRole(['admin', 'hr']);
    return await getMyPendingProposals(session.userId);
  } catch (error) {
    console.error('Get my pending proposals error:', error);
    return [];
  }
}

export async function approveAdminActionAction(
  id: number,
  comments?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireRole(['admin', 'hr']);
    const row = await approveAction(id, session.userId, comments);
    revalidateForActionType(row.action_type);
    return { success: true };
  } catch (error) {
    console.error('Approve admin action error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to approve this action' };
  }
}

export async function rejectAdminActionAction(
  id: number,
  comments?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireRole(['admin', 'hr']);
    const row = await rejectAction(id, session.userId, comments);
    revalidateForActionType(row.action_type);
    return { success: true };
  } catch (error) {
    console.error('Reject admin action error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to reject this action' };
  }
}
