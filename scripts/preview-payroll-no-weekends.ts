/**
 * Read-only payroll preview, same as preview-payroll.ts, but excludes any
 * attendance record that falls on a Saturday/Sunday from the day counts
 * (present/half/paid-leave/unpaid-leave/absent), per the rule that payroll
 * should omit weekends.
 *
 * Usage: npx tsx scripts/preview-payroll-no-weekends.ts 2026-08
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
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    workingDays++;
  }
  return workingDays;
}

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00Z');
  const dow = d.getUTCDay();
  return dow === 0 || dow === 6;
}

async function main() {
  const [year, monthNum] = month.split('-').map(Number);
  const totalWorkingDays = getWorkingDaysInMonth(year, monthNum);

  const { data: employees } = await supabase
    .from('employees')
    .select('id, employee_id, name, monthly_salary')
    .eq('status', 'active')
    .order('employee_id');

  const startDate = `${month}-01`;
  const nextMonth = new Date(month + '-01');
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().slice(0, 10);

  console.log(`💰 Payroll preview for ${month} — weekends excluded (total working days: ${totalWorkingDays})`);
  console.log('(read-only — nothing written)\n');

  let totalGross = 0;
  const excludedLog: string[] = [];

  for (const emp of employees || []) {
    const { data: attRows } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('employee_id', emp.id)
      .gte('date', startDate)
      .lt('date', nextMonthStr);

    const records = (attRows || []).filter((r) => {
      if (isWeekend(r.date)) {
        excludedLog.push(`  ${emp.employee_id} ${r.date} (status=${r.status}) — excluded, weekend`);
        return false;
      }
      return true;
    });

    const presentDays = records.filter((r) => r.status === 'present').length;
    const halfDays = records.filter((r) => r.status === 'half-day').length;
    const paidLeaveDays = records.filter((r) => r.status === 'paid-leave').length;
    const unpaidLeaveDays = records.filter((r) => r.status === 'unpaid-leave').length;
    const absentDays = records.filter((r) => r.status === 'absent').length;

    const salary = emp.monthly_salary || 0;
    const perDaySalary = totalWorkingDays > 0 ? salary / totalWorkingDays : 0;
    const payableDays = presentDays + paidLeaveDays + halfDays * 0.5;
    const grossSalary = perDaySalary * payableDays;

    totalGross += grossSalary;

    console.log(
      `${emp.employee_id} ${emp.name} | salary=${salary} | present=${presentDays} half=${halfDays} paidLeave=${paidLeaveDays} unpaidLeave=${unpaidLeaveDays} absent=${absentDays}`,
    );
    console.log(
      `   payable=${payableDays.toFixed(2)}/${totalWorkingDays} | per-day=${perDaySalary.toFixed(2)} | computed gross=${grossSalary.toFixed(2)}`,
    );
  }

  console.log(`\nΣ total computed gross across active employees: ${totalGross.toFixed(2)}`);

  if (excludedLog.length > 0) {
    console.log('\nExcluded weekend attendance records:');
    excludedLog.forEach((l) => console.log(l));
  }
}
main();
