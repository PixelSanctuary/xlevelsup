/**
 * XLU001 (Prahal Nath K) - Aug 10, 11, 14, 18 have a real clock-in in
 * time_logs but no clock-out (status stuck 'active'). Employee's own account:
 * forgot to clock out. Mark attendance as present based on that. time_logs is
 * left as-is (still shows as a missed clock-out - that's accurate, since the
 * actual clock-out time is unknown).
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const dates = ['2026-08-10', '2026-08-11', '2026-08-14', '2026-08-18'];

async function main() {
  const { data: employee } = await supabase.from('employees').select('id, name').eq('employee_id', 'XLU001').single();
  if (!employee) throw new Error('Employee not found');

  for (const date of dates) {
    const { error } = await supabase
      .from('attendance')
      .update({
        status: 'present',
        notes: "Marked present - employee's own account: forgot to clock out (real clock-in on record, clock-out time not captured).",
        updated_at: new Date().toISOString(),
      })
      .eq('employee_id', employee.id)
      .eq('date', date)
      .eq('status', 'in_progress'); // only touch it if still in_progress

    if (error) {
      console.error(`❌ ${date}:`, error);
    } else {
      console.log(`✅ ${date}: marked present`);
    }
  }
}
main();
