'use client';

/**
 * Leave Management Table Component (Admin)
 */

import { useState } from 'react';
import type { LeaveRequestWithEmployee } from '@/types/erp';
import { reviewLeaveRequestAction } from '@/actions/erp/leave-requests';
import { batchUpdateEarnedLeaveAction } from '@/actions/erp/earned-leave';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import LeaveCalendar from './LeaveCalendar';

interface LeaveManagementTableProps {
  requests: LeaveRequestWithEmployee[];
}

// Helper functions - shared between components
const getLeaveTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    sick: 'Sick',
    casual: 'Casual',
    floater: 'Floater',
    earned: 'Earned (OT)',
    unpaid: 'Unpaid',
    maternity: 'Maternity',
    paternity: 'Paternity',
    wfh: 'Work From Home',
    other: 'Other',
    // Legacy support
    annual: 'Casual', // Migrated from annual
  };
  return labels[type] || type;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function LeaveManagementTable({
  requests,
}: LeaveManagementTableProps) {
  const [selectedRequest, setSelectedRequest] =
    useState<LeaveRequestWithEmployee | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [processing, setProcessing] = useState(false);
  const [isAccruing, setIsAccruing] = useState(false);

  const filteredRequests = requests.filter(
    (req) => filterStatus === 'all' || req.status === filterStatus,
  );

  const handleReview = async (
    status: 'approved' | 'rejected',
    comments?: string,
  ) => {
    if (!selectedRequest) return;

    setProcessing(true);

    const result = await reviewLeaveRequestAction(
      selectedRequest.id,
      status,
      comments || undefined,
    );

    setProcessing(false);

    if (result.success) {
      toast.success('Submitted — another admin must approve before this decision applies.');
      setSelectedRequest(null);
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to review request');
    }
  };

  const handleAccrueEarnedLeaves = async () => {
    if (
      !confirm(
        'Are you sure you want to run the monthly Earned Leave auto-accrual calculation? This will calculate and allocate earned leaves for all active employees based on their accumulated Overtime hours.'
      )
    ) {
      return;
    }

    setIsAccruing(true);
    const result = await batchUpdateEarnedLeaveAction();
    setIsAccruing(false);

    if (result.success) {
      toast.success(result.message || 'Earned leaves updated successfully!');
      window.location.reload();
    } else {
      toast.error(result.error || 'Failed to update earned leaves.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-500/20 text-yellow-500',
      approved: 'bg-green-500/20 text-green-500',
      rejected: 'bg-red-500/20 text-red-500',
      cancelled: 'bg-gray-500/20 text-gray-500',
    };

    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <>
      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-dark-900 border border-gray-800 rounded-lg self-start">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-cyan/10 text-cyan border border-cyan/25'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-cyan/10 text-cyan border border-cyan/25'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Calendar View
          </button>
        </div>

        {/* Accrual Action Button */}
        <button
          onClick={handleAccrueEarnedLeaves}
          disabled={isAccruing}
          className="px-4 py-2 bg-gradient-to-r from-cyan to-purple text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 self-start"
        >
          {isAccruing ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Accruing Leaves...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Run Earned Leave Accrual</span>
            </>
          )}
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <LeaveCalendar requests={requests} />
      ) : (
        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg'>
          {/* Header with Filters */}
          <div className='p-6 border-b border-gray-800'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-bold text-white'>Leave Requests</h2>
                <p className='text-sm text-gray-400 mt-1'>
                  Total: {filteredRequests.length}
                </p>
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]'
              >
                <option value='all'>All Status</option>
                <option value='pending'>Pending</option>
                <option value='approved'>Approved</option>
                <option value='rejected'>Rejected</option>
                <option value='cancelled'>Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-900/50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
                    Employee
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
                    Leave Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
                    Dates
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
                    Days
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-800'>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-6 py-8 text-center text-gray-400'
                    >
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className='hover:bg-gray-900/30'>
                      <td className='px-6 py-4'>
                        <div>
                          <p className='font-medium text-white'>
                            {request.employee_name}
                          </p>
                          <p className='text-sm text-gray-400'>
                            {request.employee_id_display}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {request.employee_department}
                          </p>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-gray-300'>
                        {getLeaveTypeLabel(request.leave_type)}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm'>
                          <p className='text-gray-300'>
                            {formatDate(request.start_date)}
                          </p>
                          {request.is_half_day ? (
                            <p className='text-cyan-400 text-xs'>
                              Half Day ({request.half_day_period === 'first_half' ? 'Morning' : 'Afternoon'})
                            </p>
                          ) : (
                            <p className='text-gray-500'>
                              to {formatDate(request.end_date)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4 text-gray-300'>
                        {request.total_days}
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(
                            request.status,
                          )}`}
                        >
                          {request.status.toUpperCase()}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className='text-sm text-[var(--cyan)] hover:underline'
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onReview={handleReview}
          processing={processing}
        />
      )}
    </>
  );
}

interface ReviewModalProps {
  request: LeaveRequestWithEmployee;
  onClose: () => void;
  onReview: (status: 'approved' | 'rejected', comments?: string) => void;
  processing: boolean;
}

function ReviewModal({
  request,
  onClose,
  onReview,
  processing,
}: ReviewModalProps) {
  const [comments, setComments] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal isOpen onClose={onClose} title='Review Leave Request'>
      <div className='space-y-4'>
        {/* Employee Info */}
        <div className='bg-gray-900/50 rounded-lg p-4'>
          <h3 className='font-semibold text-white mb-2'>
            Employee Information
          </h3>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div>
              <span className='text-gray-400'>Name:</span>
              <span className='text-white ml-2'>{request.employee_name}</span>
            </div>
            <div>
              <span className='text-gray-400'>ID:</span>
              <span className='text-white ml-2'>
                {request.employee_id_display}
              </span>
            </div>
            <div className='col-span-2'>
              <span className='text-gray-400'>Department:</span>
              <span className='text-white ml-2'>
                {request.employee_department}
              </span>
            </div>
          </div>
        </div>

        {/* Leave Details */}
        <div className='bg-gray-900/50 rounded-lg p-4'>
          <h3 className='font-semibold text-white mb-2'>Leave Details</h3>
          <div className='space-y-2 text-sm'>
            <div>
              <span className='text-gray-400'>Type:</span>
              <span className='text-white ml-2'>
                {getLeaveTypeLabel(request.leave_type)}
              </span>
            </div>
            <div>
              <span className='text-gray-400'>Duration:</span>
              <span className='text-white ml-2'>
                {request.is_half_day
                  ? `${formatDate(request.start_date)} (Half Day — ${
                      request.half_day_period === 'first_half' ? 'Morning' : 'Afternoon'
                    })`
                  : `${formatDate(request.start_date)} to ${formatDate(request.end_date)}`}
              </span>
            </div>
            <div>
              <span className='text-gray-400'>Total Days:</span>
              <span className='text-white ml-2'>{request.total_days} days</span>
            </div>
            <div>
              <span className='text-gray-400'>Reason:</span>
              <p className='text-white mt-1'>{request.reason}</p>
            </div>
          </div>
        </div>

        {/* Review Comments */}
        {request.status === 'pending' && (
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Review Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white resize-none'
              placeholder='Add your comments here...'
              disabled={processing}
            />
          </div>
        )}

        {/* Action Buttons */}
        {request.status === 'pending' ? (
          <>
            <p className='text-xs text-gray-500 -mt-1'>
              This submits your decision to another admin for confirmation — it won&apos;t take
              effect until a <em>different</em> admin approves it.
            </p>
            <div className='flex gap-3'>
              <button
                onClick={() => onReview('approved', comments)}
                disabled={processing}
                className='flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {processing ? 'Processing...' : 'Propose Approve'}
              </button>
              <button
                onClick={() => onReview('rejected', comments)}
                disabled={processing}
                className='flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {processing ? 'Processing...' : 'Propose Reject'}
              </button>
            </div>
          </>
        ) : (
          <div className='bg-gray-900/50 rounded-lg p-4'>
            <p className='text-sm text-gray-400'>
              This request has been {request.status}
              {request.reviewer_name && ` by ${request.reviewer_name}`}
              {request.reviewed_at && ` on ${formatDate(request.reviewed_at)}`}
            </p>
            {request.review_comments && (
              <p className='text-sm text-white mt-2'>
                {request.review_comments}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
