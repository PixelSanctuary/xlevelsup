'use client';

/**
 * EmployeeCareerHistory
 * Timeline-style display of an employee's career history.
 * Used inside a modal or page section.
 */

import { useState } from 'react';
import type { EmployeeCareerHistory } from '@/types/erp';
import { CAREER_CHANGE_TYPE_LABELS } from '@/types/erp';
import { formatCurrency, formatDisplayDate } from '@/lib/erp/utils';
import { applyCareerChangeAction, cancelCareerChangeAction } from '@/actions/erp/employee-career';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import SensitiveValue from './SensitiveValue';

interface EmployeeCareerHistoryProps {
  history: EmployeeCareerHistory[];
  employeeName: string;
}

const CHANGE_TYPE_COLORS: Record<string, string> = {
  intern_conversion: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  promotion: 'bg-green-500/20 text-green-400 border-green-500/40',
  designation_change: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  department_change: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  salary_revision: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  employment_type_change: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
};

const CHANGE_TYPE_ICONS: Record<string, string> = {
  intern_conversion: '🎓',
  promotion: '🚀',
  designation_change: '📝',
  department_change: '🏢',
  salary_revision: '💰',
  employment_type_change: '🔄',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  approved: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Applied' },
  applied: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Applied' },
  pending_effective: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending Effective' },
  pending: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Pending' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
  cancelled: { bg: 'bg-gray-600/20', text: 'text-gray-500', label: 'Cancelled' },
};

function ValueChange({
  label,
  prev,
  next,
  format,
  sensitive,
}: {
  label: string;
  prev?: string | number | null;
  next?: string | number | null;
  format?: (v: string | number) => string;
  /** Wraps the rendered values in SensitiveValue — use for salary/financial fields */
  sensitive?: boolean;
}) {
  if (!prev && !next) return null;

  const fmt = (v: string | number) => (format ? format(v) : String(v));
  const render = (node: React.ReactNode) => (sensitive ? <SensitiveValue>{node}</SensitiveValue> : node);

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {prev && (
          <span className="text-xs bg-red-500/10 text-red-300 px-2 py-0.5 rounded line-through">
            {render(fmt(prev))}
          </span>
        )}
        {prev && next && <span className="text-gray-600 text-xs">→</span>}
        {next && (
          <span className="text-xs bg-green-500/10 text-green-300 px-2 py-0.5 rounded font-medium">
            {render(fmt(next))}
          </span>
        )}
        {!prev && next && (
          <span className="text-xs bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded font-medium">
            {render(fmt(next))}
          </span>
        )}
      </div>
    </div>
  );
}

export default function EmployeeCareerHistoryComponent({
  history,
  employeeName,
}: EmployeeCareerHistoryProps) {
  const router = useRouter();
  const [applying, setApplying] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const handleApply = async (id: number) => {
    if (!confirm('Apply this career change to the employee record now?')) return;
    setApplying(id);
    try {
      const result = await applyCareerChangeAction(id);
      if (result.success) {
        toast.success('Career change applied successfully!');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to apply change');
      }
    } finally {
      setApplying(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this scheduled career change?')) return;
    setCancelling(id);
    try {
      const result = await cancelCareerChangeAction(id);
      if (result.success) {
        toast.success('Career change cancelled.');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to cancel');
      }
    } finally {
      setCancelling(null);
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-gray-400 font-medium">No career history yet</p>
        <p className="text-gray-600 text-sm mt-1">
          Career changes for {employeeName} will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {history.map((entry, index) => {
        const typeColors = CHANGE_TYPE_COLORS[entry.change_type] || 'bg-gray-700 text-gray-300';
        const typeIcon = CHANGE_TYPE_ICONS[entry.change_type] || '📌';
        const statusCfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
        const isPendingEffective = entry.status === 'pending_effective';
        const isActionable = isPendingEffective;
        const today = new Date().toISOString().split('T')[0];
        const canApplyNow = isPendingEffective && entry.effective_date <= today;

        return (
          <div key={entry.id} className="relative flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 border ${typeColors}`}>
                {typeIcon}
              </div>
              {index < history.length - 1 && (
                <div className="w-px flex-1 bg-gray-800 my-1 min-h-[1.5rem]" />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 mb-6 bg-gray-900/50 border rounded-lg p-4 ${
              isPendingEffective ? 'border-yellow-700/40' : 'border-gray-800'
            }`}>
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${typeColors}`}>
                    {CAREER_CHANGE_TYPE_LABELS[entry.change_type]}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                    {statusCfg.label}
                  </span>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  Effective: <strong className="text-gray-300">{formatDisplayDate(entry.effective_date)}</strong>
                </span>
              </div>

              {/* Changes grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                <ValueChange
                  label="Employment Type"
                  prev={entry.previous_employment_type}
                  next={entry.new_employment_type}
                  format={(v) => String(v).replace('-', ' ')}
                />
                <ValueChange
                  label="Designation"
                  prev={entry.previous_designation}
                  next={entry.new_designation}
                />
                <ValueChange
                  label="Department"
                  prev={entry.previous_department}
                  next={entry.new_department}
                />
                <ValueChange
                  label="Salary"
                  prev={entry.previous_salary ?? undefined}
                  next={entry.new_salary ?? undefined}
                  format={(v) => formatCurrency(Number(v))}
                  sensitive
                />
              </div>

              {/* Reason */}
              {entry.reason && (
                <p className="text-xs text-gray-400 italic border-t border-gray-800/60 pt-2 mt-2">
                  "{entry.reason}"
                </p>
              )}

              {/* Notes */}
              {entry.notes && (
                <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800/60">
                <p className="text-xs text-gray-600">
                  {entry.created_at
                    ? `Recorded ${formatDisplayDate(entry.created_at)}`
                    : ''}
                  {entry.approved_at && entry.status === 'applied'
                    ? ` · Applied ${formatDisplayDate(entry.approved_at)}`
                    : ''}
                </p>

                {/* Apply / Cancel buttons for pending_effective */}
                {isActionable && (
                  <div className="flex gap-2">
                    {canApplyNow && (
                      <button
                        onClick={() => handleApply(entry.id)}
                        disabled={applying === entry.id}
                        className="text-xs px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded transition-colors disabled:opacity-50"
                      >
                        {applying === entry.id ? 'Applying…' : 'Apply Now'}
                      </button>
                    )}
                    {!canApplyNow && (
                      <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                        Apply after {formatDisplayDate(entry.effective_date)}
                      </span>
                    )}
                    <button
                      onClick={() => handleCancel(entry.id)}
                      disabled={cancelling === entry.id}
                      className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors disabled:opacity-50"
                    >
                      {cancelling === entry.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
