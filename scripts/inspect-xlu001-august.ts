/**
 * Read-only: dump XLU001's August attendance rows (date, status, notes,
 * created_at) so we can see what changed since payroll was drafted.
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: employee } = await supabase.from('employees').select('id').eq('employee_id', 'XLU001').single();
  const { data: rows, error } = await supabase
    .from('attendance')
    .select('date, status, notes, created_at, created_by')
    .eq('employee_id', employee!.id)
    .gte('date', '2026-08-01')
    .lt('date', '2026-09-01')
    .order('date');
  if (error) throw error;
  for (const r of rows || []) {
    console.log(`${r.date} | status=${r.status} | created_at=${r.created_at} | created_by=${r.created_by} | notes=${r.notes || ''}`);
  }
}
main();
