/**
 * Backfill script: for employee XLU001, mark every missing working day
 * (weekday, not a public holiday, no existing attendance record) as a
 * complete 10-hour present day.
 *
 * Unlike scripts/log-attendance-xlu001.ts, this script never deletes or
 * overwrites existing attendance/time_logs rows — it only fills gaps where
 * no attendance record exists yet for that date.
 *
 * Usage:
 *   npx tsx scripts/fill-missing-attendance-xlu001.ts            # apply
 *   npx tsx scripts/fill-missing-attendance-xlu001.ts --dry-run  # preview only
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

require('dotenv').config({
  path: path.resolve(process.cwd(), '.env.local'),
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes('--dry-run');
const EMPLOYEE_CODE = 'XLU001';
const WORK_HOURS = 10;
const CLOCK_IN_HOUR_UTC = 3; // 09:00 IST
const CLOCK_IN_MINUTE_UTC = 30;

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

async function main() {
  console.log(`🚀 Filling missing attendance for ${EMPLOYEE_CODE} (${WORK_HOURS}h/day)${DRY_RUN ? ' [DRY RUN]' : ''}...`);

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('employee_id', EMPLOYEE_CODE)
    .single();

  if (empError || !employee) {
    console.error(`❌ Error: Employee ${EMPLOYEE_CODE} not found`, empError);
    process.exit(1);
  }

  console.log(`👤 Found Employee: ${employee.name} (ID: ${employee.id})`);
  console.log(`📅 Joining Date: ${employee.joining_date}`);

  const { data: holidays, error: holError } = await supabase
    .from('company_holidays')
    .select('date')
    .eq('is_active', true)
    .eq('holiday_type', 'public');

  if (holError) {
    console.error('❌ Error fetching holidays:', holError);
    process.exit(1);
  }

  const holidayDates = new Set(holidays?.map((h) => h.date) || []);
  console.log(`🏖️ Loaded ${holidayDates.size} active public holiday(s).`);

  // Existing attendance dates for this employee — anything already recorded
  // (present, absent, leave, etc.) is left alone.
  const { data: existingAttendance, error: attFetchError } = await supabase
    .from('attendance')
    .select('date')
    .eq('employee_id', employee.id);

  if (attFetchError) {
    console.error('❌ Error fetching existing attendance:', attFetchError);
    process.exit(1);
  }

  const existingDates = new Set((existingAttendance || []).map((a) => a.date));
  console.log(`📊 Existing attendance records: ${existingDates.size}`);

  // Existing time_logs dates so we don't create duplicate log entries either.
  const { data: existingTimeLogs, error: tlFetchError } = await supabase
    .from('time_logs')
    .select('date')
    .eq('employee_id', employee.id);

  if (tlFetchError) {
    console.error('❌ Error fetching existing time_logs:', tlFetchError);
    process.exit(1);
  }

  const existingTimeLogDates = new Set((existingTimeLogs || []).map((t) => t.date));

  const startDate = new Date(employee.joining_date + 'T00:00:00Z');
  const endDate = new Date(toDateStr(new Date()) + 'T00:00:00Z'); // today (UTC date)

  console.log(`📅 Scanning range: ${toDateStr(startDate)} to ${toDateStr(endDate)}`);

  const currentDate = new Date(startDate);
  let workingDaysCount = 0;
  let missingCount = 0;
  let attendanceCreated = 0;
  let timeLogsCreated = 0;

  const overtime = parseFloat(Math.max(0, WORK_HOURS - 8).toFixed(2));

  while (currentDate <= endDate) {
    const dateStr = toDateStr(currentDate);
    const dayOfWeek = currentDate.getUTCDay(); // 0 = Sunday, 6 = Saturday

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayDates.has(dateStr);

    if (!isWeekend && !isHoliday) {
      workingDaysCount++;

      if (!existingDates.has(dateStr)) {
        missingCount++;
        console.log(`📝 Missing: ${dateStr} → marking present, ${WORK_HOURS}h`);

        const clockIn = new Date(Date.UTC(
          currentDate.getUTCFullYear(),
          currentDate.getUTCMonth(),
          currentDate.getUTCDate(),
          CLOCK_IN_HOUR_UTC,
          CLOCK_IN_MINUTE_UTC,
          0,
        ));
        const clockOut = new Date(clockIn.getTime() + WORK_HOURS * 60 * 60 * 1000);

        if (!DRY_RUN) {
          const { error: attInsertError } = await supabase
            .from('attendance')
            .insert({
              employee_id: employee.id,
              date: dateStr,
              status: 'present',
              overtime_hours: overtime,
              notes: 'Backfilled missing attendance (10h)',
              created_by: 1,
            });

          if (attInsertError) {
            console.error(`❌ Failed to insert attendance for ${dateStr}:`, attInsertError);
          } else {
            attendanceCreated++;
          }

          if (!existingTimeLogDates.has(dateStr)) {
            const { error: tlInsertError } = await supabase
              .from('time_logs')
              .insert({
                employee_id: employee.id,
                date: dateStr,
                clock_in_time: clockIn.toISOString(),
                clock_out_time: clockOut.toISOString(),
                total_hours: WORK_HOURS,
                status: 'completed',
                notes: 'Backfilled missing attendance (10h)',
              });

            if (tlInsertError) {
              console.error(`❌ Failed to insert time log for ${dateStr}:`, tlInsertError);
            } else {
              timeLogsCreated++;
            }
          }
        }
      }
    }

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  console.log('\n📊 SCRIPT SUMMARY:');
  console.log(`   Working days scanned: ${workingDaysCount}`);
  console.log(`   Missing days found: ${missingCount}`);
  if (DRY_RUN) {
    console.log('   (dry run — no records were written)');
  } else {
    console.log(`   Attendance records created: ${attendanceCreated}`);
    console.log(`   Time log records created: ${timeLogsCreated}`);
  }
  console.log('✅ Finished.');
}

main();
