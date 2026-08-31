/**
 * One-off fix: Vinoth Kumar (XLU005) has completed time_logs for 2026-07-22
 * (real clock-in/out, two sessions, ~9.11h total) but no attendance row for
 * that date - the known time_logs -> attendance gap. Insert the missing
 * attendance record so his calendar shows the day correctly.
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: employee } = await supabase.from('employees').select('id, name').eq('employee_id', 'XLU005').single();
  if (!employee) throw new Error('Employee not found');

  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('employee_id', employee.id)
    .eq('date', '2026-07-22')
    .maybeSingle();

  if (existing) {
    console.log('Attendance row already exists, nothing to do:', existing);
    return;
  }

  const { data: logs } = await supabase
    .from('time_logs')
    .select('total_hours')
    .eq('employee_id', employee.id)
    .eq('date', '2026-07-22');

  const totalHours = (logs || []).reduce((sum, l) => sum + (l.total_hours || 0), 0);
  const overtime = parseFloat(Math.max(0, totalHours - 8).toFixed(2));

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      employee_id: employee.id,
      date: '2026-07-22',
      status: 'present',
      overtime_hours: overtime,
      notes: 'Backfilled from time_logs (clock-out was recorded, attendance row was missing)',
    })
    .select()
    .single();

  if (error) throw error;
  console.log(`✅ Created attendance row for ${employee.name} on 2026-07-22 (total logged hours: ${totalHours.toFixed(2)}, overtime: ${overtime})`);
  console.log(data);
}
main();
