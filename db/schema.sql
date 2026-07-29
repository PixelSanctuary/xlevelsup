-- XLEVELSUP ERP Database Schema
-- PostgreSQL Database (Supabase)

-- Users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'hr', 'employee')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role VARCHAR(100) NOT NULL, -- job role/designation
    department VARCHAR(100) NOT NULL,
    employment_type VARCHAR(50) NOT NULL CHECK(employment_type IN ('full-time', 'part-time', 'contract', 'temporary', 'freelancer', 'intern', 'consultant')),
    joining_date DATE NOT NULL,
    end_date DATE, -- Optional end date for any employment type
    salary_type VARCHAR(50) NOT NULL CHECK(salary_type IN ('monthly', 'hourly', 'contract')),
    monthly_salary NUMERIC(10, 2), -- Optional for unpaid employees
    hourly_rate NUMERIC(10, 2), -- For freelancers and hourly workers
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    -- Employee authentication fields
    password_hash VARCHAR(255), -- Bcrypt hashed password for employee portal login
    require_password_change BOOLEAN DEFAULT true, -- Force password change on first login
    last_login TIMESTAMP, -- Track last successful login
    account_status VARCHAR(20) DEFAULT 'active' CHECK(account_status IN ('active', 'suspended', 'locked')),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK(status IN ('present', 'absent', 'half-day', 'paid-leave', 'unpaid-leave', 'holiday', 'in_progress')),
    half_day_period VARCHAR(12) CHECK(half_day_period IN ('first_half', 'second_half')), -- which half status='half-day' refers to
    overtime_hours NUMERIC(4, 2) DEFAULT 0, -- Overtime hours for earned leave calculation
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date) -- prevent duplicate attendance for same employee on same date
);

-- Payroll table
CREATE TABLE IF NOT EXISTS payroll (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- format: YYYY-MM
    total_working_days INTEGER NOT NULL,
    present_days NUMERIC(5, 1) NOT NULL,
    paid_leave_days NUMERIC(5, 1) NOT NULL,
    unpaid_leave_days NUMERIC(5, 1) NOT NULL,
    absent_days NUMERIC(5, 1) NOT NULL,
    half_days NUMERIC(5, 1) NOT NULL,
    payable_days NUMERIC(5, 1) NOT NULL,
    per_day_salary NUMERIC(10, 2) NOT NULL,
    gross_salary NUMERIC(10, 2) NOT NULL,
    bonus NUMERIC(10, 2) DEFAULT 0,
    deduction NUMERIC(10, 2) DEFAULT 0,
    net_salary NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'paid')),
    notes TEXT,
    generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    paid_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, month) -- one payroll per employee per month
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    paid_by VARCHAR(255) NOT NULL, -- name of person/employee
    payment_mode VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    receipt_url TEXT, -- optional attachment URL
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'paid')),
    submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    paid_by_user INTEGER REFERENCES users(id) ON DELETE SET NULL,
    paid_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('sick', 'casual', 'floater', 'earned', 'unpaid', 'maternity', 'paternity', 'other', 'wfh')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4,1) NOT NULL, -- Supports half-days (e.g., 2.5 days)
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewed_by INTEGER REFERENCES employees(id),
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT positive_days CHECK (total_days > 0)
);

-- Leave Balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    total_allocated NUMERIC(4,1) DEFAULT 0,
    used_days NUMERIC(4,1) DEFAULT 0,
    remaining_days NUMERIC(4,1) GENERATED ALWAYS AS (total_allocated - used_days) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, year, leave_type)
);

-- Attendance Change Requests table
CREATE TABLE IF NOT EXISTS attendance_change_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_id INTEGER REFERENCES attendance(id) ON DELETE CASCADE,
    request_date DATE NOT NULL,
    current_status VARCHAR(20),
    requested_status VARCHAR(20) NOT NULL CHECK(requested_status IN ('present', 'absent', 'half-day', 'paid-leave', 'unpaid-leave', 'holiday')),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time Logs table (Clock In/Out tracking)
CREATE TABLE IF NOT EXISTS time_logs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in_time TIMESTAMPTZ NOT NULL,
    clock_out_time TIMESTAMPTZ,
    total_hours NUMERIC(5, 2),
    status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON employees(employment_type);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_month ON payroll(employee_id, month);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by ON expenses(submitted_by);
CREATE INDEX IF NOT EXISTS idx_employees_account_status ON employees(account_status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON leave_balances(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_attendance_change_requests_employee ON attendance_change_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_change_requests_status ON attendance_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_attendance_change_requests_date ON attendance_change_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_time_logs_employee_date ON time_logs(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_time_logs_status ON time_logs(status);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(date);

-- Enable Row Level Security (RLS) - Supabase best practice
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your needs)
-- For now, allow all authenticated operations - you can refine these later
CREATE POLICY "Enable all operations for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON employees FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON attendance FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON payroll FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON expenses FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON leave_requests FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON leave_balances FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON attendance_change_requests FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON time_logs FOR ALL USING (true);

-- Financial Ledger table
CREATE TABLE IF NOT EXISTS financial_ledger (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('income', 'expense', 'investment', 'payroll', 'reimbursement', 'adjustment', 'refund', 'transfer')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inflow', 'outflow')),
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    transaction_date DATE NOT NULL,
    payment_mode VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    
    client_name VARCHAR(255),
    project_name VARCHAR(255),
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    payroll_id INTEGER REFERENCES payroll(id) ON DELETE SET NULL,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
    
    payer_name VARCHAR(255),
    payee_name VARCHAR(255),
    vendor_name VARCHAR(255),
    
    invoice_number VARCHAR(100),
    reference_number VARCHAR(100),
    
    description TEXT,
    notes TEXT,
    
    approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'paid')),
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_date ON financial_ledger(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_type ON financial_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_direction ON financial_ledger(direction);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_category ON financial_ledger(category);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_status ON financial_ledger(payment_status);

ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON financial_ledger FOR ALL USING (true);

