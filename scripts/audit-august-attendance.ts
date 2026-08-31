/**
 * Read-only audit: for each active employee, list August attendance rows
 * flagging weekend 'present' entries, and break down which working days
 * are NOT 'present' (in_progress / absent / leave / no record at all) with
 * dates, so gaps can be explained.
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const month = '2026-08';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function workingDaysUpTo(year: number, monthNum: number, lastDay: number): string[] {
  const dates: string[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(Date.UTC(year, monthNum - 1, day));
    const dow = date.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

async function main() {
  const { data: employees } = await supabase
    .from('employees')
    .select('id, employee_id, name')
    .eq('status', 'active')
    .order('employee_id');

  const { data: holidays } = await supabase
    .from('company_holidays')
    .select('date')
    .eq('is_active', true)
    .eq('holiday_type', 'public')
    .gte('date', '2026-08-01')
    .lt('date', '2026-09-01');
  const holidaySet = new Set((holidays || []).map((h) => h.date));

  const allWorkingDays = workingDaysUpTo(2026, 8, 31); // full month, matches getWorkingDaysInMonth (no holiday exclusion)
  const today = '2026-08-31';

  for (const emp of employees || []) {
    const { data: rows } = await supabase
      .from('attendance')
      .select('date, status, notes')
      .eq('employee_id', emp.id)
      .gte('date', '2026-08-01')
      .lt('date', '2026-09-01')
      .order('date');

    const byDate = new Map((rows || []).map((r) => [r.date, r]));

    console.log(`\n=== ${emp.employee_id} ${emp.name} ===`);

    // Weekend / non-working-day present entries
    for (const r of rows || []) {
      const d = new Date(r.date + 'T00:00:00Z');
      const dow = DAY_NAMES[d.getUTCDay()];
      const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
      const isHoliday = holidaySet.has(r.date);
      if (isWeekend || isHoliday) {
        console.log(`  ⚠️ ${r.date} (${dow}${isHoliday ? ', holiday' : ''}) has status=${r.status} — non-working day with an attendance record`);
      }
    }

    // Working days that are NOT 'present'
    const gaps: string[] = [];
    for (const date of allWorkingDays) {
      if (date > today) continue; // future working days this month, not yet due
      const row = byDate.get(date);
      const d = new Date(date + 'T00:00:00Z');
      const dow = DAY_NAMES[d.getUTCDay()];
      if (!row) {
        gaps.push(`  ${date} (${dow}): NO RECORD (never clocked in)`);
      } else if (row.status !== 'present') {
        gaps.push(`  ${date} (${dow}): ${row.status}${row.notes ? ' — ' + row.notes : ''}`);
      }
    }
    if (gaps.length > 0) {
      console.log(` Working days not 'present' (through ${today}):`);
      gaps.forEach((g) => console.log(g));
    } else {
      console.log(' No gaps — present every working day so far.');
    }
  }
}
main();
