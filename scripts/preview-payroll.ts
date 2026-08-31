/**
 * Read-only preview: computes what payroll WOULD be for each active
 * employee for a given month, using the exact same formula as
 * generatePayrollAction (lib/erp/utils.ts calculatePayroll), based on
 * current attendance data. Does NOT write to the payroll table.
 *
 * Also shows the currently stored draft (if any) side by side, since
 * generatePayrollAction skips employees who already have a payroll row for
 * the month - so simply clicking "Generate" would NOT refresh those.
 *
 * Usage: npx tsx scripts/preview-payroll.ts 2026-08
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const month = process.argv[2] || new Date().toISOString().slice(0, 7);

function getWorkingDaysInMonth(year: number, monthNum: number): number {
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    workingDays++;
  }
  return workingDays;
}

function calculatePayroll(
  monthSalary: number,
  presentDays: number,
  halfDays: number,
  paidLeaveDays: number,
  unpaidLeaveDays: number,
  absentDays: number,
  totalWorkingDays: number,
) {
  const perDaySalary = monthSalary / totalWorkingDays;
  const payableDays = presentDays + paidLeaveDays + halfDays * 0.5;
  const grossSalary = perDaySalary * payableDays;
  return { perDaySalary, payableDays, grossSalary };
}

async function main() {
  const [year, monthNum] = month.split('-').map(Number);
  const totalWorkingDays = getWorkingDaysInMonth(year, monthNum);

  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, employee_id, name, monthly_salary')
    .eq('status', 'active')
    .order('employee_id');
  if (empError) throw empError;

  const { data: existingPayroll } = await supabase
    .from('payroll')
    .select('employee_id, status, net_salary, present_days')
    .eq('month', month);
  const existingByEmp = new Map((existingPayroll || []).map((p) => [p.employee_id, p]));

  const startDate = `${month}-01`;
  const nextMonth = new Date(month + '-01');
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().slice(0, 10);

  console.log(`💰 Payroll preview for ${month} (total working days: ${totalWorkingDays})`);
  console.log('(read-only — nothing written)\n');

  let totalGross = 0;

  for (const emp of employees || []) {
    const { data: attRows } = await supabase
      .from('attendance')
      .select('status')
      .eq('employee_id', emp.id)
      .gte('date', startDate)
      .lt('date', nextMonthStr);

    const records = attRows || [];
    const presentDays = records.filter((r) => r.status === 'present').length;
    const halfDays = records.filter((r) => r.status === 'half-day').length;
    const paidLeaveDays = records.filter((r) => r.status === 'paid-leave').length;
    const unpaidLeaveDays = records.filter((r) => r.status === 'unpaid-leave').length;
    const absentDays = records.filter((r) => r.status === 'absent').length;
    const inProgressDays = records.filter((r) => r.status === 'in_progress').length;

    const salary = emp.monthly_salary || 0;
    const { perDaySalary, payableDays, grossSalary } = calculatePayroll(
      salary, presentDays, halfDays, paidLeaveDays, unpaidLeaveDays, absentDays, totalWorkingDays,
    );

    totalGross += grossSalary;

    const existing = existingByEmp.get(emp.id);
    const existingLabel = existing
      ? `stored draft: net=${existing.net_salary} (present=${existing.present_days}) [${existing.status}]${existing.present_days !== presentDays ? ' ⚠️ STALE vs current attendance' : ''}`
      : 'no existing payroll record (would be newly generated)';

    console.log(
      `${emp.employee_id} ${emp.name} | salary=${salary} | present=${presentDays} half=${halfDays} paidLeave=${paidLeaveDays} unpaidLeave=${unpaidLeaveDays} absent=${absentDays}${inProgressDays ? ` inProgress=${inProgressDays}` : ''}`,
    );
    console.log(
      `   payable=${payableDays.toFixed(2)}/${totalWorkingDays} | per-day=${perDaySalary.toFixed(2)} | computed gross (if generated fresh now)=${grossSalary.toFixed(2)}`,
    );
    console.log(`   ${existingLabel}`);
    console.log('');
  }

  console.log(`Σ total computed gross across active employees: ${totalGross.toFixed(2)}`);
}
main();
