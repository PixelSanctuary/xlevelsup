'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { m as motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  getPendingApprovalsForMeAction,
  getMyPendingProposalsAction,
  approveAdminActionAction,
  rejectAdminActionAction,
} from '@/actions/erp/admin-approvals';
import type {
  AdminActionApproval,
  AdminActionApprovalWithProposer,
} from '@/types/erp';

function formatTimestamp(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminApprovalsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forReview, setForReview] = useState<AdminActionApprovalWithProposer[]>([]);
  const [myProposals, setMyProposals] = useState<AdminActionApproval[]>([]);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [processingId, setProcessingId] = useState<number | null>(null);

  // SSR-safe portal gate (document doesn't exist during server render) — same
  // pattern as UpcomingEventsPanel.tsx / MonthPicker.tsx.
  useEffect(() => setMounted(true), []);

  const refresh = () => {
    setLoading(true);
    Promise.all([getPendingApprovalsForMeAction(), getMyPendingProposalsAction()])
      .then(([review, mine]) => {
        setForReview(review);
        setMyProposals(mine);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen]);

  const handleDecision = async (id: number, decision: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      const action = decision === 'approve' ? approveAdminActionAction : rejectAdminActionAction;
      const result = await action(id, comments[id] || undefined);
      if (result.success) {
        toast.success(decision === 'approve' ? 'Approved and applied.' : 'Rejected.');
        refresh();
      } else {
        toast.error(result.error || 'Failed to submit your decision');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const badgeCount = forReview.length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg hover:bg-gray-800/40 text-gray-400 hover:text-white transition-colors"
        title="Pending approvals"
        aria-label="Pending approvals"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center">
            {badgeCount}
          </span>
        )}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 bg-black z-40"
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-y-0 right-0 w-96 max-w-[90vw] bg-[#0c0c0e] border-l border-gray-800 z-50 flex flex-col"
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/80">
                    <h2 className="font-bold text-white">✅ Pending Approvals</h2>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-gray-850 text-gray-400 hover:text-white"
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                    {loading ? (
                      <p className="text-xs text-gray-500 px-1">Loading...</p>
                    ) : (
                      <>
                        <section>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Awaiting Your Approval
                          </h3>
                          {forReview.length === 0 ? (
                            <p className="text-xs text-gray-500">Nothing waiting on you right now.</p>
                          ) : (
                            <div className="space-y-3">
                              {forReview.map((item) => (
                                <div
                                  key={item.id}
                                  className="p-3 rounded-lg bg-gray-850/40 border border-gray-800/60 space-y-2"
                                >
                                  <p className="text-sm text-white">{item.summary}</p>
                                  <p className="text-xs text-gray-500">
                                    Proposed by {item.proposer_email} · {formatTimestamp(item.created_at)}
                                  </p>
                                  <textarea
                                    value={comments[item.id] || ''}
                                    onChange={(e) =>
                                      setComments((prev) => ({ ...prev, [item.id]: e.target.value }))
                                    }
                                    placeholder="Comments (optional)"
                                    rows={2}
                                    disabled={processingId === item.id}
                                    className="w-full px-2 py-1.5 text-xs bg-[#0a0a0a] border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan text-white placeholder-gray-500 resize-none"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleDecision(item.id, 'approve')}
                                      disabled={processingId === item.id}
                                      className="flex-1 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 transition-colors"
                                    >
                                      {processingId === item.id ? 'Working...' : 'Approve'}
                                    </button>
                                    <button
                                      onClick={() => handleDecision(item.id, 'reject')}
                                      disabled={processingId === item.id}
                                      className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 transition-colors"
                                    >
                                      {processingId === item.id ? 'Working...' : 'Reject'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>

                        <section>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Your Pending Proposals
                          </h3>
                          {myProposals.length === 0 ? (
                            <p className="text-xs text-gray-500">You have no proposals awaiting another admin.</p>
                          ) : (
                            <div className="space-y-2">
                              {myProposals.map((item) => (
                                <div
                                  key={item.id}
                                  className="p-3 rounded-lg bg-gray-850/20 border border-gray-800/40"
                                >
                                  <p className="text-sm text-gray-300">{item.summary}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Submitted {formatTimestamp(item.created_at)} · waiting on another admin
                                  </p>
                                  {item.error_message && (
                                    <p className="text-xs text-red-400 mt-1">
                                      Last approval attempt failed: {item.error_message}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      </>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
