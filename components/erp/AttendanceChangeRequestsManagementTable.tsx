'use client';

/**
 * Attendance Change Requests Management Table
 * Admin/HR view – review, approve, reject requests (status-change + regularisation)
 */

import { useState } from 'react';
import type { AttendanceChangeRequestWithEmployee } from '@/types/erp';
import { REGULARISATION_TYPE_LABELS } from '@/types/erp';
import Modal from '@/components/ui/Modal';
import AttendanceChangeRequestReviewForm from './AttendanceChangeRequestReviewForm';

interface AttendanceChangeRequestsManagementTableProps {
  requests: AttendanceChangeRequestWithEmployee[];
}

export default function AttendanceChangeRequestsManagementTable({
  requests,
}: AttendanceChangeRequestsManagementTableProps) {
  const [filter, setFilter] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] =
    useState<AttendanceChangeRequestWithEmployee | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const filteredRequests = requests.filter((request) => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      approved: { bg: 'bg-green-500/20', text: 'text-green-400' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getTypeBadge = (requestType?: string | null) => {
    if (!requestType || requestType === 'status_change') {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-700/50 text-gray-400">
          Status Change
        </span>
      );
    }
    const colors: Record<string, string> = {
      missed_clock_in: 'bg-blue-500/20 text-blue-300',
      missed_clock_out: 'bg-orange-500/20 text-orange-300',
      missed_both: 'bg-purple-500/20 text-purple-300',
      clock_in_correction: 'bg-cyan-500/20 text-cyan-300',
      clock_out_correction: 'bg-teal-500/20 text-teal-300',
    };
    const label =
      REGULARISATION_TYPE_LABELS[requestType as keyof typeof REGULARISATION_TYPE_LABELS] ||
      requestType;
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[requestType] || 'bg-gray-700 text-gray-300'}`}>
        {label}
      </span>
    );
  };

  const getAttendanceStatusBadge = (status: string, halfDayPeriod?: string | null) => (
    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300">
      {status.replace(/[-_]/g, ' ').toUpperCase()}
      {status === 'half-day' && halfDayPeriod
        ? ` (${halfDayPeriod === 'first_half' ? 'MORNING' : 'AFTERNOON'})`
        : ''}
    </span>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return null;
    try {
      return new Date(isoString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const handleReview = (request: AttendanceChangeRequestWithEmployee) => {
    setSelectedRequest(request);
    setIsReviewModalOpen(true);
  };

  const filterCounts = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'pending', label: `Pending (${filterCounts.pending})`, activeClass: 'bg-yellow-500 text-black' },
            { key: 'approved', label: `Approved (${filterCounts.approved})`, activeClass: 'bg-green-500 text-white' },
            { key: 'rejected', label: `Rejected (${filterCounts.rejected})`, activeClass: 'bg-red-500 text-white' },
            { key: 'all', label: `All (${requests.length})`, activeClass: 'bg-[var(--cyan)] text-black' },
          ].map(({ key, label, activeClass }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                filter === key ? activeClass : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No requests found</p>
              {filter !== 'all' && <p className="text-sm mt-2">Try changing the filter</p>}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-2 font-medium text-gray-400">Employee</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-400">Date</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-400">Type</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-400">Change</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-400">Reason</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-400">Status</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const isRegularisation =
                    request.request_type && request.request_type !== 'status_change';
                  return (
                    <tr
                      key={request.id}
                      className="border-b border-gray-800/50 hover:bg-gray-900/30"
                    >
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{request.employee_name}</p>
                          <p className="text-xs text-gray-500">{request.employee_employee_id}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        {formatDate(request.request_date)}
                      </td>
                      <td className="py-3 px-2">
                        {getTypeBadge(request.request_type)}
                      </td>
                      <td className="py-3 px-2">
                        {isRegularisation ? (
                          <div className="space-y-1 text-xs">
                            {(request.requested_clock_in_time || request.current_clock_in_time) && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-gray-500">In:</span>
                                <span className="text-gray-400">
                                  {formatTime(request.current_clock_in_time) || '—'}
                                </span>
                                <span className="text-gray-600">→</span>
                                <span className="text-blue-400 font-medium">
                                  {formatTime(request.requested_clock_in_time) || '—'}
                                </span>
                              </div>
                            )}
                            {(request.requested_clock_out_time || request.current_clock_out_time) && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-gray-500">Out:</span>
                                <span className="text-gray-400">
                                  {formatTime(request.current_clock_out_time) || '—'}
                                </span>
                                <span className="text-gray-600">→</span>
                                <span className="text-orange-400 font-medium">
                                  {formatTime(request.requested_clock_out_time) || '—'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            {request.current_status ? (
                              <>
                                {getAttendanceStatusBadge(request.current_status)}
                                <span className="text-gray-500">→</span>
                                {getAttendanceStatusBadge(request.requested_status, request.half_day_period)}
                              </>
                            ) : (
                              <>
                                <span className="text-xs text-gray-500">New:</span>
                                {getAttendanceStatusBadge(request.requested_status, request.half_day_period)}
                              </>
                            )}
                            {request.requested_status === 'paid-leave' && request.leave_type && (
                              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded ml-1">
                                {request.leave_type.toUpperCase()}
                              </span>
                            )}
                            {request.clock_out_time && (
                              <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded ml-1">
                                🕒 {request.clock_out_time.substring(0, 5)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-xs text-gray-400 max-w-xs truncate">{request.reason}</p>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {request.status === 'pending' ? (
                          <button
                            onClick={() => handleReview(request)}
                            className="text-xs px-3 py-1 bg-[var(--cyan)] text-black rounded hover:opacity-80"
                          >
                            Review
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReview(request)}
                            className="text-xs text-gray-500 hover:text-gray-400"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedRequest(null);
          }}
          title="Review Attendance Request"
        >
          <div className="space-y-4">
            {/* Request Details */}
            <div className="bg-[#0a0a0a] rounded-lg p-4 space-y-3">
              {/* Employee */}
              <div>
                <p className="text-xs text-gray-500">Employee</p>
                <p className="text-sm font-medium">
                  {selectedRequest.employee_name} ({selectedRequest.employee_employee_id})
                </p>
              </div>

              {/* Date */}
              <div>
                <p className="text-xs text-gray-500">Attendance Date</p>
                <p className="text-sm">{formatDate(selectedRequest.request_date)}</p>
              </div>

              {/* Request Type */}
              <div>
                <p className="text-xs text-gray-500">Request Type</p>
                <div className="mt-1">{getTypeBadge(selectedRequest.request_type)}</div>
              </div>

              {/* Regularisation comparison */}
              {selectedRequest.request_type && selectedRequest.request_type !== 'status_change' ? (
                <>
                  {/* Clock-In comparison */}
                  {(selectedRequest.current_clock_in_time || selectedRequest.requested_clock_in_time) && (
                    <div className="grid grid-cols-2 gap-3 bg-gray-900/50 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current Clock-In</p>
                        <p className="text-sm text-gray-300 font-mono">
                          {formatTime(selectedRequest.current_clock_in_time) || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Requested Clock-In</p>
                        <p className="text-sm text-blue-400 font-semibold font-mono">
                          {formatTime(selectedRequest.requested_clock_in_time) || '—'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Clock-Out comparison */}
                  {(selectedRequest.current_clock_out_time || selectedRequest.requested_clock_out_time) && (
                    <div className="grid grid-cols-2 gap-3 bg-gray-900/50 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current Clock-Out</p>
                        <p className="text-sm text-gray-300 font-mono">
                          {formatTime(selectedRequest.current_clock_out_time) || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Requested Clock-Out</p>
                        <p className="text-sm text-orange-400 font-semibold font-mono">
                          {formatTime(selectedRequest.requested_clock_out_time) || '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Legacy status-change display */
                <>
                  <div>
                    <p className="text-xs text-gray-500">Change Requested</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {selectedRequest.current_status ? (
                        <>
                          {getAttendanceStatusBadge(selectedRequest.current_status)}
                          <span>→</span>
                          {getAttendanceStatusBadge(selectedRequest.requested_status, selectedRequest.half_day_period)}
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-gray-500">New Record:</span>
                          {getAttendanceStatusBadge(selectedRequest.requested_status, selectedRequest.half_day_period)}
                        </>
                      )}
                      {selectedRequest.requested_status === 'paid-leave' &&
                        selectedRequest.leave_type && (
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                            {selectedRequest.leave_type.toUpperCase()} LEAVE
                          </span>
                        )}
                    </div>
                  </div>

                  {selectedRequest.clock_out_time && (
                    <div>
                      <p className="text-xs text-gray-500">Requested Clock-Out Time</p>
                      <p className="text-sm text-cyan-400 font-semibold mt-1">
                        {selectedRequest.clock_out_time.substring(0, 5)}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Reason */}
              <div>
                <p className="text-xs text-gray-500">Reason</p>
                <p className="text-sm text-gray-300 mt-1">{selectedRequest.reason}</p>
              </div>

              {/* Employee Note */}
              {selectedRequest.employee_note && (
                <div>
                  <p className="text-xs text-gray-500">Employee Note</p>
                  <p className="text-sm text-gray-400 mt-1">{selectedRequest.employee_note}</p>
                </div>
              )}
            </div>

            {/* Review Form / Already-reviewed info */}
            {selectedRequest.status === 'pending' ? (
              <AttendanceChangeRequestReviewForm
                requestId={selectedRequest.id}
                onSuccess={() => {
                  setIsReviewModalOpen(false);
                  setSelectedRequest(null);
                  window.location.reload();
                }}
              />
            ) : (
              <div className="bg-[#0a0a0a] rounded-lg p-4">
                <p className="text-sm text-gray-400">
                  This request has already been{' '}
                  <strong
                    className={
                      selectedRequest.status === 'approved' ? 'text-green-400' : 'text-red-400'
                    }
                  >
                    {selectedRequest.status}
                  </strong>
                  .
                </p>
                {selectedRequest.review_comments && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Review Comments:</p>
                    <p className="text-sm mt-1 text-gray-300">{selectedRequest.review_comments}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
