// ERP Type Definitions

export type UserRole = 'admin' | 'hr' | 'employee';

export type EmploymentType =
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'temporary'
  | 'freelancer'
  | 'intern'
  | 'consultant';

export type SalaryType = 'monthly' | 'hourly' | 'contract';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  role: string; // job role/designation
  department: string;
  employment_type?: EmploymentType; // Optional for backward compatibility
  joining_date: string;
  date_of_birth?: string | null; // Optional — powers birthday wish banners
  end_date?: string | null; // Optional end date for any employment type
  salary_type: SalaryType;
  monthly_salary?: number | null; // Optional for unpaid employees
  hourly_rate?: number | null; // For freelancers/hourly workers
  status: 'active' | 'inactive';
  // Employee authentication fields
  password_hash?: string | null;
  require_password_change?: boolean;
  last_login?: string | null;
  account_status?: 'active' | 'suspended' | 'locked';
  user_id?: number | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half-day'
  | 'paid-leave'
  | 'unpaid-leave'
  | 'holiday'
  | 'in_progress';

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  status: AttendanceStatus;
  half_day_period?: HalfDayPeriod | null; // which half status='half-day' refers to
  overtime_hours?: number | null; // Overtime hours for earned leave calculation
  notes?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  employee_id: number;
  employee_name: string;
  month: string;
  total_days: number;
  present_days: number;
  half_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  absent_days: number;
  holiday_days: number;
}

export type PayrollStatus = 'draft' | 'approved' | 'paid';

export interface Payroll {
  id: number;
  employee_id: number;
  month: string; // YYYY-MM
  total_working_days: number;
  present_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  absent_days: number;
  half_days: number;
  payable_days: number;
  per_day_salary: number;
  gross_salary: number;
  bonus: number;
  deduction: number;
  net_salary: number;
  status: PayrollStatus;
  notes?: string | null;
  generated_by?: number | null;
  generated_at: string;
  approved_by?: number | null;
  approved_at?: string | null;
  paid_by?: number | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollWithEmployee extends Payroll {
  employee_name: string;
  employee_role: string;
  employee_department: string;
}

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface Expense {
  id: number;
  date: string;
  category: string;
  amount: number;
  paid_by: string;
  payment_mode: string;
  description: string;
  receipt_url?: string | null;
  status: ExpenseStatus;
  submitted_by?: number | null;
  approved_by?: number | null;
  approved_at?: string | null;
  paid_by_user?: number | null;
  paid_at?: string | null;
  rejection_reason?: string | null;
  reimbursed?: boolean | null;
  reimbursed_by?: number | null;
  reimbursed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_active_employees: number;
  today_attendance_count: number;
  today_attendance_percentage: number;
  current_month_payroll_total: number;
  current_month_expenses_total: number;
  pending_expenses_count: number;
  pending_expenses_total: number;
  unpaid_payroll_count: number;
  pending_leave_requests_count: number;
  pending_attendance_change_requests_count: number;
}

// Form data types for validation
export interface EmployeeFormData {
  employee_id?: string; // Optional - will be auto-generated if not provided
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employment_type: EmploymentType;
  joining_date: string;
  date_of_birth?: string | null; // Optional — powers birthday wish banners
  end_date?: string | null; // Optional end date for any employment type
  salary_type: SalaryType;
  monthly_salary?: number | null; // Optional for unpaid employees
  hourly_rate?: number | null; // Optional for hourly/freelancer
  status: 'active' | 'inactive';
}

export interface AttendanceFormData {
  employee_id: number;
  date: string;
  status: AttendanceStatus;
  half_day_period?: HalfDayPeriod | null;
  overtime_hours?: number | null;
  notes?: string;
}

export interface PayrollAdjustmentData {
  bonus?: number;
  deduction?: number;
  notes?: string;
}

export interface ExpenseFormData {
  date: string;
  category: string;
  amount: number;
  paid_by: string;
  payment_mode: string;
  description: string;
  receipt_url?: string | null;
}

// Leave Management Types

export type LeaveType =
  | 'sick'
  | 'casual'
  | 'floater'
  | 'earned'
  | 'unpaid'
  | 'maternity'
  | 'paternity'
  | 'other'
  | 'wfh';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type HalfDayPeriod = 'first_half' | 'second_half';

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day: boolean;
  half_day_period?: HalfDayPeriod | null;
  reason: string;
  status: LeaveStatus;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  review_comments?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestWithEmployee extends LeaveRequest {
  employee_name: string;
  employee_id_display: string; // XLU001 or TEMP-XLU-001
  employee_department: string;
  reviewer_name?: string | null;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  year: number;
  leave_type: string;
  total_allocated: number;
  used_days: number;
  remaining_days: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestFormData {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  is_half_day?: boolean;
  half_day_period?: HalfDayPeriod | null;
}

export interface LeaveReviewData {
  status: 'approved' | 'rejected';
  review_comments?: string;
}

// Employee Portal Session
export interface EmployeeSession {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  employment_type?: EmploymentType;
  require_password_change: boolean;
  /** True when this session was bridged from an ERP admin/hr login (via
   * employees.user_id) rather than a real employee-portal login. */
  viaAdminSession?: boolean;
}

// Attendance Change Requests
export type AttendanceChangeStatus = 'pending' | 'approved' | 'rejected';

/**
 * Type of regularisation request.
 * - status_change: legacy — change attendance status (present/absent/leave etc.)
 * - missed_clock_in: employee forgot to clock in (may have clocked out)
 * - missed_clock_out: employee forgot to clock out (clocked in exists)
 * - missed_both: employee forgot both clock-in and clock-out
 * - clock_in_correction: employee clocked in at wrong time and wants correction
 * - clock_out_correction: employee clocked out at wrong time and wants correction
 */
export type AttendanceRegularisationType =
  | 'status_change'
  | 'missed_clock_in'
  | 'missed_clock_out'
  | 'missed_both'
  | 'clock_in_correction'
  | 'clock_out_correction';

export interface AttendanceChangeRequest {
  id: number;
  employee_id: number;
  attendance_id?: number | null;
  request_date: string;
  current_status?: AttendanceStatus | null;
  requested_status: AttendanceStatus;
  half_day_period?: HalfDayPeriod | null;
  leave_type?: string | null;
  /** @deprecated Legacy HH:MM text column. New requests use requested_clock_out_time TIMESTAMPTZ. */
  clock_out_time?: string | null;
  reason: string;
  status: AttendanceChangeStatus;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  review_comments?: string | null;
  created_at: string;
  updated_at: string;
  // Regularisation extension fields (added via migration)
  request_type?: AttendanceRegularisationType | null;
  current_clock_in_time?: string | null;
  current_clock_out_time?: string | null;
  requested_clock_in_time?: string | null;
  requested_clock_out_time?: string | null;
  employee_note?: string | null;
}

export interface AttendanceChangeRequestWithEmployee extends AttendanceChangeRequest {
  employee_name: string;
  employee_email: string;
  employee_employee_id: string;
}

export interface AttendanceWithChangeRequest extends Attendance {
  has_pending_request?: boolean;
  change_request_id?: number | null;
}

/** Human-readable labels for regularisation request types */
export const REGULARISATION_TYPE_LABELS: Record<AttendanceRegularisationType, string> = {
  status_change: 'Status Change',
  missed_clock_in: 'Missed Clock-In',
  missed_clock_out: 'Missed Clock-Out',
  missed_both: 'Missed Both Clock-In & Clock-Out',
  clock_in_correction: 'Clock-In Correction',
  clock_out_correction: 'Clock-Out Correction',
};

/** Form data for creating a new attendance regularisation request */
export interface AttendanceRegularisationFormData {
  request_date: string;
  request_type: AttendanceRegularisationType;
  requested_clock_in_time?: string | null;   // ISO datetime string
  requested_clock_out_time?: string | null;  // ISO datetime string
  current_clock_in_time?: string | null;     // pre-filled from existing time log
  current_clock_out_time?: string | null;    // pre-filled from existing time log
  reason: string;
  employee_note?: string | null;
  attendance_id?: number | null;
}

// Time Logs (Clock In/Out) Types
export type TimeLogStatus = 'active' | 'completed';

export interface TimeLog {
  id: number;
  employee_id: number;
  date: string;
  clock_in_time: string;
  clock_out_time?: string | null;
  total_hours?: number | null;
  status: TimeLogStatus;
  notes?: string | null;
  // Location tracking
  clock_in_latitude?: number | null;
  clock_in_longitude?: number | null;
  clock_in_location_accuracy?: number | null;
  clock_out_latitude?: number | null;
  clock_out_longitude?: number | null;
  clock_out_location_accuracy?: number | null;
  created_at: string;
  updated_at: string;
}

export interface TimeLogSummary {
  total_hours_today: number;
  is_clocked_in: boolean;
  active_session?: TimeLog | null;
  completed_sessions: TimeLog[];
  missed_clock_out?: TimeLog | null;
}

// Login Logs Types
export interface LoginLog {
  id: number;
  employee_id: number;
  login_time: string;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  status: 'success' | 'failed';
  failure_reason?: string | null;
  created_at: string;
}

// Financial Ledger Types
export type FinanceTransactionType =
  | 'income'
  | 'expense'
  | 'investment'
  | 'payroll'
  | 'reimbursement'
  | 'adjustment'
  | 'refund'
  | 'transfer';

export type FinanceDirection = 'inflow' | 'outflow';

export interface FinancialLedgerEntry {
  id: number;
  transaction_type: FinanceTransactionType;
  direction: FinanceDirection;
  category: string;
  amount: number;
  transaction_date: string;
  payment_mode?: string | null;
  payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded' | null;
  
  client_name?: string | null;
  project_name?: string | null;
  employee_id?: number | null;
  payroll_id?: number | null;
  expense_id?: number | null;
  account_id?: number | null;
  
  payer_name?: string | null;
  payee_name?: string | null;
  vendor_name?: string | null;
  
  invoice_number?: string | null;
  reference_number?: string | null;
  
  description?: string | null;
  notes?: string | null;
  
  approval_status?: 'pending' | 'approved' | 'rejected' | 'paid' | null;
  approved_by?: number | null;
  approved_at?: string | null;

  /** Supabase Storage object path (bucket: expense-receipts), not a public URL. */
  receipt_path?: string | null;

  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface LedgerFormData {
  transaction_type: FinanceTransactionType;
  direction: FinanceDirection;
  category: string;
  amount: number;
  transaction_date: string;
  payment_mode?: string | null;
  payment_status?: string | null;
  
  client_name?: string | null;
  project_name?: string | null;
  employee_id?: number | null;
  payroll_id?: number | null;
  expense_id?: number | null;
  account_id?: number | null;
  
  payer_name?: string | null;
  payee_name?: string | null;
  vendor_name?: string | null;
  
  invoice_number?: string | null;
  reference_number?: string | null;
  
  description?: string | null;
  notes?: string | null;
  approval_status?: string | null;
  receipt_path?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee Career & Promotion Management Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The type of career change recorded in employee_career_history.
 * - intern_conversion: Intern → any other employment type
 * - promotion: Role/designation upgrade
 * - designation_change: Title change without necessarily a salary change
 * - department_change: Department transfer
 * - salary_revision: Salary-only update
 * - employment_type_change: Any employment type modification (non-intern)
 */
export type EmployeeCareerChangeType =
  | 'intern_conversion'
  | 'promotion'
  | 'designation_change'
  | 'department_change'
  | 'salary_revision'
  | 'employment_type_change';

/**
 * Workflow status of a career history record.
 * - approved: Applied immediately (effective_date is today or in the past)
 * - pending_effective: Stored for a future effective_date; not yet applied to employees table
 * - applied: Was pending_effective, now applied to employees table
 * - rejected: Rejected before application
 * - cancelled: Cancelled before application
 */
export type EmployeeCareerChangeStatus =
  | 'pending'
  | 'approved'
  | 'pending_effective'
  | 'applied'
  | 'rejected'
  | 'cancelled';

/** A single row from the employee_career_history table */
export interface EmployeeCareerHistory {
  id: number;
  employee_id: number;

  change_type: EmployeeCareerChangeType;

  previous_employment_type?: string | null;
  new_employment_type?: string | null;

  /** Maps to employees.role (job title/designation) */
  previous_designation?: string | null;
  new_designation?: string | null;

  previous_department?: string | null;
  new_department?: string | null;

  previous_salary_type?: string | null;
  new_salary_type?: string | null;

  previous_salary?: number | null;
  new_salary?: number | null;

  effective_date: string; // YYYY-MM-DD

  reason?: string | null;
  notes?: string | null;

  status: EmployeeCareerChangeStatus;

  requested_by?: number | null;
  approved_by?: number | null;
  approved_at?: string | null;

  created_at?: string;
  updated_at?: string;
}

/** Career history enriched with employee and reviewer names for display */
export interface EmployeeCareerHistoryWithNames extends EmployeeCareerHistory {
  employee_name: string;
  employee_display_id: string;
  requester_name?: string | null;
  approver_name?: string | null;
}

/** Human-readable labels for each career change type */
export const CAREER_CHANGE_TYPE_LABELS: Record<EmployeeCareerChangeType, string> = {
  intern_conversion: 'Intern Conversion',
  promotion: 'Promotion',
  designation_change: 'Designation Change',
  department_change: 'Department Transfer',
  salary_revision: 'Salary Revision',
  employment_type_change: 'Employment Type Change',
};

/** Form data payload for creating a career change record */
export interface CareerChangeFormData {
  employee_id: number;
  change_type: EmployeeCareerChangeType;

  // Current (snapshot) values — pre-filled from employee record
  current_employment_type?: string;
  current_designation?: string;
  current_department?: string;
  current_salary_type?: string;
  current_salary?: number | null;

  // New requested values
  new_employment_type?: string;
  new_designation?: string;
  new_department?: string;
  new_salary_type?: string;
  new_salary?: number | null;

  effective_date: string;
  reason: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Company Account Types
// ─────────────────────────────────────────────────────────────────────────────

export type CompanyAccountType = 'general' | 'stakeholder' | 'operations' | 'reserve';

export interface CompanyAccount {
  id: number;
  name: string;
  description?: string | null;
  account_type: CompanyAccountType;
  opening_balance: number;
  is_active: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Client {
  id: number;
  client_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  notes: string | null;
  services_offered: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientFormData {
  name: string;
  phone?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  notes?: string | null;
  services_offered?: string | null;
}

export interface ClientFinancialSummary {
  totalIncome: number;
  pendingIncome: number;
  lastTransactionDate: string | null;
}

