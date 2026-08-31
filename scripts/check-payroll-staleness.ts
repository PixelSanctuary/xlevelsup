/**
 * Read-only check: compares each employee's payroll.present_days (as stored)
 * against what getMonthlyAttendanceSummary-equivalent logic computes from the
 * attendance table RIGHT NOW, for a given month. Also shows payroll
 * generated_at vs. the most recent attendance_change_requests.reviewed_at
 * for that employee/month, so you can tell whether the draft payroll was
 * generated before or after any change-request approvals.
 *
 * Usage: npx tsx scripts/check-payroll-staleness.ts 2026-08
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const month = process.argv[2] || new Date().toISOString().slice(0, 7);

async function main() {
  console.log(`🔍 Payroll staleness check for ${month}\n`);

  const { data: payrollRows, error: payrollError } = await supabase
    .from('payroll')
    .select('*, employees:employee_id (name, employee_id)')
    .eq('month', month);
  if (payrollError) throw payrollError;

  const startDate = `${month}-01`;
  const nextMonth = new Date(month + '-01');
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().slice(0, 10);

  for (const p of (payrollRows || []) as any[]) {
    const { data: attRows, error: attError } = await supabase
      .from('attendance')
      .select('status')
      .eq('employee_id', p.employee_id)
      .gte('date', startDate)
      .lt('date', nextMonthStr);
    if (attError) throw attError;

    const records = attRows || [];
    const currentPresent = records.filter((r) => r.status === 'present').length;
    const currentHalf = records.filter((r) => r.status === 'half-day').length;
    const currentPaidLeave = records.filter((r) => r.status === 'paid-leave').length;
    const currentUnpaidLeave = records.filter((r) => r.status === 'unpaid-leave').length;
    const currentAbsent = records.filter((r) => r.status === 'absent').length;

    const { data: latestReview } = await supabase
      .from('attendance_change_requests')
      .select('reviewed_at, request_date, request_type')
      .eq('employee_id', p.employee_id)
      .eq('status', 'approved')
      .gte('request_date', startDate)
      .lt('request_date', nextMonthStr)
      .order('reviewed_at', { ascending: false })
      .limit(1);

    const lastReviewedAt = latestReview?.[0]?.reviewed_at || null;
    const stale = lastReviewedAt && p.generated_at && new Date(lastReviewedAt) > new Date(p.generated_at);
    const mismatch = currentPresent !== p.present_days;

    const label = p.employees?.employee_id ?? p.employee_id;
    console.log(
      `${label} ${p.employees?.name ?? ''} | payroll present_days=${p.present_days} vs current attendance present=${currentPresent} ${mismatch ? '⚠️ MISMATCH' : '✓'}`,
    );
    console.log(
      `   payroll generated_at=${p.generated_at || 'n/a'} | last approved change-request reviewed_at=${lastReviewedAt || 'none'} ${stale ? '⚠️ PAYROLL GENERATED BEFORE THIS APPROVAL' : ''}`,
    );
  }
}

main();
