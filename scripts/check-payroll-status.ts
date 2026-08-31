/**
 * Read-only check: prints payroll records for a given month (default: current
 * month) so you can confirm what's been generated/approved/paid.
 *
 * Usage:
 *   npx tsx scripts/check-payroll-status.ts             # current month
 *   npx tsx scripts/check-payroll-status.ts 2026-08      # specific month
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({
  path: path.resolve(process.cwd(), '.env.local'),
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const monthArg = process.argv[2];
const month = monthArg || new Date().toISOString().slice(0, 7);

async function main() {
  console.log(`🔍 Checking payroll status for month: ${month}\n`);

  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id')
    .eq('status', 'active');

  if (empError) {
    console.error('❌ Error fetching employees:', empError);
    process.exit(1);
  }

  const activeCount = employees?.length || 0;

  const { data: payroll, error: payrollError } = await supabase
    .from('payroll')
    .select('*, employees:employee_id (name, employee_id)')
    .eq('month', month)
    .order('employee_id');

  if (payrollError) {
    console.error('❌ Error fetching payroll:', payrollError);
    process.exit(1);
  }

  const rows = (payroll || []) as any[];

  console.log(`👥 Active employees: ${activeCount}`);
  console.log(`💰 Payroll records for ${month}: ${rows.length}`);

  if (rows.length === 0) {
    console.log('\n⚠️  No payroll has been generated for this month yet.');
    return;
  }

  const draft = rows.filter((r) => r.status === 'draft');
  const approved = rows.filter((r) => r.status === 'approved');
  const paid = rows.filter((r) => r.status === 'paid');
  const totalNet = rows.reduce((sum, r) => sum + (r.net_salary || 0), 0);

  console.log(`   draft: ${draft.length} | approved: ${approved.length} | paid: ${paid.length}`);
  console.log(`   total net salary: ${totalNet.toFixed(2)}`);

  if (activeCount > rows.length) {
    console.log(`\n⚠️  ${activeCount - rows.length} active employee(s) have no payroll record for ${month} yet.`);
  }

  console.log('\n📋 Records:');
  for (const r of rows) {
    console.log(
      `  ${r.employees?.employee_id ?? r.employee_id} ${r.employees?.name ?? ''} | status=${r.status} | present=${r.present_days} half=${r.half_days} paidLeave=${r.paid_leave_days} unpaidLeave=${r.unpaid_leave_days} absent=${r.absent_days} | payable=${r.payable_days}/${r.total_working_days} | net=${r.net_salary}`,
    );
  }

  // Flag employees present in payroll but missing from active list won't show here,
  // but flag active employees entirely absent from payroll:
  const payrollEmployeeIds = new Set(rows.map((r) => r.employee_id));
  const { data: activeDetailed } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .eq('status', 'active');

  const missing = (activeDetailed || []).filter((e) => !payrollEmployeeIds.has(e.id));
  if (missing.length > 0) {
    console.log('\n⚠️  Active employees with NO payroll record this month:');
    for (const e of missing) {
      console.log(`   ${e.employee_id} ${e.name}`);
    }
  }
}

main();
