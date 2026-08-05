'use client';

/**
 * CareerChangeModal
 * Adaptive form modal for all employee career changes:
 * Intern Conversion, Promotion, Designation Change, Department Transfer,
 * Salary Revision, Employment Type Change.
 */

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { createCareerChangeAction } from '@/actions/erp/employee-career';
import toast from 'react-hot-toast';
import type {
  Employee,
  EmployeeCareerChangeType,
  CareerChangeFormData,
} from '@/types/erp';
import { CAREER_CHANGE_TYPE_LABELS } from '@/types/erp';
import { formatCurrency } from '@/lib/erp/utils';
import SensitiveValue from './SensitiveValue';

interface CareerChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  /** Pre-select a change type when opening (e.g. clicking 'Convert' on intern row) */
  defaultChangeType?: EmployeeCareerChangeType;
  onSuccess?: () => void;
  departments?: string[];
}

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-Time' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'consultant', label: 'Consultant' },
];

const SALARY_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'contract', label: 'Contract' },
];

// Which change types Admin/HR can select in the dropdown
const CHANGE_TYPE_OPTIONS: { value: EmployeeCareerChangeType; label: string; forInternOnly?: boolean }[] = [
  { value: 'intern_conversion', label: 'Intern Conversion', forInternOnly: true },
  { value: 'promotion', label: 'Promotion' },
  { value: 'designation_change', label: 'Designation Change' },
  { value: 'department_change', label: 'Department Transfer' },
  { value: 'salary_revision', label: 'Salary Revision' },
  { value: 'employment_type_change', label: 'Employment Type Change' },
];

/** Which fields to show based on the change type */
function getFieldVisibility(changeType: EmployeeCareerChangeType) {
  return {
    showEmploymentType:
      changeType === 'intern_conversion' || changeType === 'employment_type_change',
    showDesignation:
      changeType === 'intern_conversion' ||
      changeType === 'promotion' ||
      changeType === 'designation_change',
    showDepartment:
      changeType === 'intern_conversion' ||
      changeType === 'department_change' ||
      changeType === 'promotion',
    showSalary:
      changeType === 'intern_conversion' ||
      changeType === 'promotion' ||
      changeType === 'salary_revision',
  };
}

const inputClass =
  'w-full px-4 py-2 rounded-lg bg-[#0f0f0f] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-colors text-sm';
const labelClass = 'block text-xs font-medium text-gray-400 mb-1';

export default function CareerChangeModal({
  isOpen,
  onClose,
  employee,
  defaultChangeType,
  onSuccess,
  departments = [],
}: CareerChangeModalProps) {
  const isIntern = employee.employment_type === 'intern';

  const [changeType, setChangeType] = useState<EmployeeCareerChangeType>(
    defaultChangeType || (isIntern ? 'intern_conversion' : 'promotion'),
  );
  const [newEmploymentType, setNewEmploymentType] = useState('full-time');
  const [newDesignation, setNewDesignation] = useState('');
  const [newDepartment, setNewDepartment] = useState(employee.department || '');
  const [newSalaryType, setNewSalaryType] = useState<'monthly' | 'hourly' | 'contract'>(
    (employee.salary_type as 'monthly' | 'hourly' | 'contract') || 'monthly',
  );

  const [newSalary, setNewSalary] = useState<string>(
    employee.monthly_salary != null ? String(employee.monthly_salary) : '',
  );
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fields = getFieldVisibility(changeType);
  const isFutureDate = effectiveDate > new Date().toISOString().split('T')[0];

  // Reset state when employee changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setChangeType(defaultChangeType || (isIntern ? 'intern_conversion' : 'promotion'));
      setNewDesignation('');
      setNewDepartment(employee.department || '');
      setNewSalaryType(employee.salary_type || 'monthly');
      setNewSalary(employee.monthly_salary != null ? String(employee.monthly_salary) : '');
      setEffectiveDate(new Date().toISOString().split('T')[0]);
      setReason('');
      setNotes('');
    }
  }, [isOpen, employee, defaultChangeType, isIntern]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    const salaryNum = newSalary !== '' ? parseFloat(newSalary) : null;

    const formData: CareerChangeFormData = {
      employee_id: employee.id,
      change_type: changeType,

      // Current snapshot
      current_employment_type: employee.employment_type,
      current_designation: employee.role,
      current_department: employee.department,
      current_salary_type: employee.salary_type,
      current_salary: employee.monthly_salary ?? null,

      // New values (only set the ones relevant to this change type)
      ...(fields.showEmploymentType && { new_employment_type: newEmploymentType }),
      ...(fields.showDesignation && newDesignation && { new_designation: newDesignation }),
      ...(fields.showDepartment && { new_department: newDepartment }),
      ...(fields.showSalary && salaryNum !== null && {
        new_salary_type: newSalaryType,
        new_salary: salaryNum,
      }),

      effective_date: effectiveDate,
      reason,
      notes: notes || undefined,
    };

    try {
      const result = await createCareerChangeAction(formData);
      if (result.success) {
        toast.success(
          isFutureDate
            ? `${CAREER_CHANGE_TYPE_LABELS[changeType]} scheduled for ${effectiveDate}. Apply it manually on/after that date.`
            : `${CAREER_CHANGE_TYPE_LABELS[changeType]} applied successfully!`,
          { duration: 4000 },
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || 'Failed to save career change');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter change type options based on employee type
  const availableTypes = CHANGE_TYPE_OPTIONS.filter((opt) => {
    if (opt.forInternOnly && !isIntern) return false;
    if (opt.value === 'intern_conversion' && !isIntern) return false;
    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Career Change">
      <div className="space-y-5">
        {/* Employee Info Banner */}
        <div className="flex items-center gap-3 bg-gray-900/60 border border-gray-800 rounded-lg p-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">{employee.name}</p>
            <p className="text-xs text-gray-400">
              {employee.employee_id} · {employee.role} · {employee.department}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isIntern
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                {employee.employment_type?.replace('-', ' ') || 'Unknown'}
              </span>
              {employee.monthly_salary != null && (
                <span className="text-xs text-gray-400">
                  <SensitiveValue>{formatCurrency(employee.monthly_salary)}/mo</SensitiveValue>
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Change Type */}
          <div>
            <label className={labelClass}>Change Type *</label>
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value as EmployeeCareerChangeType)}
              className={inputClass}
              required
            >
              {availableTypes.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Current vs New Comparison ─────────────────────── */}
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-gray-800">
              <div className="p-3 bg-gray-900/40">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Current
                </p>
                <div className="space-y-3">
                  {fields.showEmploymentType && (
                    <div>
                      <p className="text-xs text-gray-500">Employment Type</p>
                      <p className="text-sm text-gray-300 capitalize">
                        {employee.employment_type?.replace('-', ' ') || '—'}
                      </p>
                    </div>
                  )}
                  {fields.showDesignation && (
                    <div>
                      <p className="text-xs text-gray-500">Designation</p>
                      <p className="text-sm text-gray-300">{employee.role || '—'}</p>
                    </div>
                  )}
                  {fields.showDepartment && (
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm text-gray-300">{employee.department || '—'}</p>
                    </div>
                  )}
                  {fields.showSalary && (
                    <div>
                      <p className="text-xs text-gray-500">Salary</p>
                      <p className="text-sm text-gray-300">
                        {employee.monthly_salary != null
                          ? <SensitiveValue>{formatCurrency(employee.monthly_salary)}</SensitiveValue>
                          : 'Unpaid'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">
                  New
                </p>
                <div className="space-y-3">
                  {/* New Employment Type */}
                  {fields.showEmploymentType && (
                    <div>
                      <select
                        value={newEmploymentType}
                        onChange={(e) => setNewEmploymentType(e.target.value)}
                        className={inputClass}
                        required
                      >
                        {EMPLOYMENT_TYPES.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* New Designation */}
                  {fields.showDesignation && (
                    <div>
                      <input
                        type="text"
                        placeholder="e.g. Software Developer"
                        value={newDesignation}
                        onChange={(e) => setNewDesignation(e.target.value)}
                        className={inputClass}
                        required={
                          changeType === 'promotion' || changeType === 'designation_change'
                        }
                      />
                    </div>
                  )}

                  {/* New Department */}
                  {fields.showDepartment && (
                    <div>
                      {departments.length > 0 ? (
                        <select
                          value={newDepartment}
                          onChange={(e) => setNewDepartment(e.target.value)}
                          className={inputClass}
                          required={changeType === 'department_change'}
                        >
                          <option value="">Select department</option>
                          {departments.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="e.g. Engineering"
                          value={newDepartment}
                          onChange={(e) => setNewDepartment(e.target.value)}
                          className={inputClass}
                          required={changeType === 'department_change'}
                        />
                      )}
                    </div>
                  )}

                  {/* New Salary */}
                  {fields.showSalary && (
                    <div className="space-y-1.5">
                      <select
                        value={newSalaryType}
                        onChange={(e) => setNewSalaryType(e.target.value as 'monthly' | 'hourly' | 'contract')}
                        className={inputClass}
                      >
                        {SALARY_TYPES.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Amount (₹)"
                        min="0"
                        step="0.01"
                        value={newSalary}
                        onChange={(e) => setNewSalary(e.target.value)}
                        className={inputClass}
                        required={changeType === 'salary_revision'}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Effective Date */}
          <div>
            <label className={labelClass}>Effective Date *</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className={`${inputClass} [color-scheme:dark]`}
              required
            />
            {isFutureDate && (
              <p className="text-xs text-yellow-400 mt-1">
                ⏳ Future date — change will be stored as <strong>Pending Effective</strong> and must be applied manually on or after this date.
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className={labelClass}>Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a clear reason for this career change (min 5 characters)"
              rows={3}
              className={`${inputClass} resize-none`}
              required
              minLength={5}
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <label className={labelClass}>
              Additional Notes{' '}
              <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context or instructions"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading
                ? 'Saving…'
                : isFutureDate
                ? 'Schedule Change'
                : `Apply ${CAREER_CHANGE_TYPE_LABELS[changeType]}`}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
