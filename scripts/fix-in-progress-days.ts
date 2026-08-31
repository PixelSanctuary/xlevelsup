/**
 * For the 'in_progress' attendance days flagged in the August audit
 * (XLU000, XLU001, XLU003), check the actual time_logs for that
 * employee/date. Only mark attendance as 'present' where time_logs shows a
 * REAL completed session (status='completed', clock_out_time present) -
 * same logic as the Vinoth July 22 fix. Days where time_logs still shows an
 * open/active session (no real clock-out) are left untouched and reported
 * separately - those still need an actual regularisation request.
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const targets: { employeeCode: string; date: string }[] = [
  { employeeCode: 'XLU000', date: '2026-08-17' },
  { employeeCode: 'XLU000', date: '2026-08-25' },
  { employeeCode: 'XLU000', date: '2026-08-26' },
  { employeeCode: 'XLU000', date: '2026-08-27' },
  { employeeCode: 'XLU001', date: '2026-08-10' },
  { employeeCode: 'XLU001', date: '2026-08-11' },
  { employeeCode: 'XLU001', date: '2026-08-14' },
  { employeeCode: 'XLU001', date: '2026-08-18' },
  { employeeCode: 'XLU003', date: '2026-08-31' },
];

async function main() {
  const employeeIds = new Map<string, number>();
  for (const code of ['XLU000', 'XLU001', 'XLU003']) {
    const { data } = await supabase.from('employees').select('id').eq('employee_id', code).single();
    if (data) employeeIds.set(code, data.id);
  }

  let fixed = 0;
  let leftOpen = 0;

  for (const t of targets) {
    const empId = employeeIds.get(t.employeeCode)!;

    const { data: logs } = await supabase
      .from('time_logs')
      .select('*')
      .eq('employee_id', empId)
      .eq('date', t.date)
      .order('clock_in_time');

    const rows = logs || [];
    const hasOpenSession = rows.some((r) => r.status !== 'completed' || !r.clock_out_time);
    const totalHours = rows.reduce((sum, r) => sum + (r.total_hours || 0), 0);

    if (rows.length === 0) {
      console.log(`${t.employeeCode} ${t.date}: NO time_logs at all — leaving as in_progress. ⚠️ investigate separately.`);
      leftOpen++;
      continue;
    }

    if (hasOpenSession) {
      console.log(`${t.employeeCode} ${t.date}: has an OPEN/incomplete session (no real clock-out) — leaving as in_progress. Needs a regularisation request.`);
      console.log('   ' + JSON.stringify(rows.map((r) => ({ clock_in: r.clock_in_time, clock_out: r.clock_out_time, status: r.status }))));
      leftOpen++;
      continue;
    }

    // All sessions completed with real clock-out times
    const overtime = parseFloat(Math.max(0, totalHours - 8).toFixed(2));
    const { error } = await supabase
      .from('attendance')
      .update({
        status: 'present',
        overtime_hours: overtime,
        notes: 'Backfilled from time_logs (clock-out was recorded, attendance was stuck in_progress)',
        updated_at: new Date().toISOString(),
      })
      .eq('employee_id', empId)
      .eq('date', t.date);

    if (error) {
      console.error(`${t.employeeCode} ${t.date}: ❌ update failed`, error);
      continue;
    }

    console.log(`${t.employeeCode} ${t.date}: ✅ has completed time_logs (${totalHours.toFixed(2)}h) — marked present, overtime=${overtime}`);
    fixed++;
  }

  console.log(`\nSummary: ${fixed} fixed with real time_logs data, ${leftOpen} left as in_progress (no real clock-out to back them).`);
}
main();
