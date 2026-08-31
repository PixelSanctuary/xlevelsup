/**
 * Read-only: inspect Vinoth Kumar (XLU005)'s attendance + time_logs around
 * 2026-07-22 to see why clock-out isn't registering.
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: employee, error: empErr } = await supabase
    .from('employees')
    .select('*')
    .eq('employee_id', 'XLU005')
    .single();
  if (empErr || !employee) {
    console.error('Employee not found', empErr);
    return;
  }
  console.log(`Employee: ${employee.name} (id=${employee.id})`);

  const { data: attendance, error: attErr } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('date', '2026-07-22');
  if (attErr) throw attErr;
  console.log('\nAttendance row(s):');
  console.log(JSON.stringify(attendance, null, 2));

  const { data: timeLogs, error: tlErr } = await supabase
    .from('time_logs')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('date', '2026-07-22');
  if (tlErr) throw tlErr;
  console.log('\ntime_logs row(s):');
  console.log(JSON.stringify(timeLogs, null, 2));

  const { data: changeReqs, error: crErr } = await supabase
    .from('attendance_change_requests')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('request_date', '2026-07-22');
  if (crErr) throw crErr;
  console.log('\nattendance_change_requests row(s):');
  console.log(JSON.stringify(changeReqs, null, 2));
}
main();
