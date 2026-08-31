/**
 * One-off: delete all payroll records for a given month so it can be
 * regenerated from current attendance. Only ever touches 'draft' data by
 * construction of this app (approved/paid records still get deleted here
 * too, so this prints what it's about to remove first).
 *
 * Usage: npx tsx scripts/delete-payroll-month.ts 2026-08
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const month = process.argv[2];
if (!month || !/^\d{4}-\d{2}$/.test(month)) {
  console.error('Usage: npx tsx scripts/delete-payroll-month.ts YYYY-MM');
  process.exit(1);
}

async function main() {
  const { data: existing, error: fetchError } = await supabase
    .from('payroll')
    .select('id, employee_id, status, net_salary, employees:employee_id (employee_id, name)')
    .eq('month', month);
  if (fetchError) throw fetchError;

  if (!existing || existing.length === 0) {
    console.log(`No payroll records found for ${month}. Nothing to delete.`);
    return;
  }

  console.log(`Deleting ${existing.length} payroll record(s) for ${month}:`);
  for (const r of existing as any[]) {
    console.log(`  ${r.employees?.employee_id ?? r.employee_id} ${r.employees?.name ?? ''} | status=${r.status} | net=${r.net_salary}`);
  }

  const nonDraft = (existing as any[]).filter((r) => r.status !== 'draft');
  if (nonDraft.length > 0) {
    console.error(`\n❌ Aborting: ${nonDraft.length} record(s) are not 'draft' (approved/paid). Refusing to delete those without explicit confirmation.`);
    process.exit(1);
  }

  const { error: deleteError } = await supabase.from('payroll').delete().eq('month', month);
  if (deleteError) throw deleteError;

  console.log(`\n✅ Deleted ${existing.length} draft payroll record(s) for ${month}.`);
}
main();
