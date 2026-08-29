/**
 * Create login credentials for existing employees who don't have them yet
 *
 * Employee ID format:
 *   Full-time / part-time / contract : XLU000, XLU001, ...
 *   Temporary / freelancer           : TEMP000, TEMP001, ...
 *
 * Default password: Welcome@<employee_id>
 * Run with: npx ts-node -r tsconfig-paths/register scripts/create-employee-logins.ts
 */

// Load environment variables FIRST before any imports
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
});

// Verify environment variables are loaded
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Make sure .env.local file exists with:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Now import after env vars are loaded
const { supabase } = require('../lib/supabase');
const bcrypt = require('bcryptjs');

/** Generate next employee ID based on employment type */
async function getNextEmployeeId(
  employmentType: string,
): Promise<string> {
  const isTemporary =
    employmentType === 'temporary' || employmentType === 'freelancer';
  const prefix = isTemporary ? 'TEMP' : 'XLU';

  // Get the highest existing ID for this series
  const { data, error } = await supabase
    .from('employees')
    .select('employee_id')
    .like('employee_id', `${prefix}%`)
    .order('employee_id', { ascending: false })
    .limit(1);

  if (error) throw error;

  let nextNum = 0;
  if (data && data.length > 0) {
    const lastId: string = data[0].employee_id;
    // Extract numbers at the end
    const match = lastId.match(/\d+$/);
    if (match) {
      nextNum = parseInt(match[0], 10) + 1;
    }
  }

  const padded = String(nextNum).padStart(3, '0'); // e.g. 000, 001
  return `${prefix}${padded}`;
}

async function createEmployeeLogins() {
  try {
    console.log('🔐 Generating login credentials for employees without passwords...\n');

    // Get all active/inactive employees without password_hash
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, employee_id, name, email, status, employment_type')
      .is('password_hash', null);

    if (fetchError) {
      console.error('❌ Error fetching employees:', fetchError);
      throw fetchError;
    }

    if (!employees || employees.length === 0) {
      console.log('✅ All employees already have login credentials!');
      return;
    }

    console.log(`📋 Found ${employees.length} employee(s) without login credentials:\n`);

    let successCount = 0;
    let failCount = 0;

    for (const employee of employees) {
      try {
        let employeeId = employee.employee_id;

        // If employee_id is missing or doesn't match format, generate a new one
        if (!employeeId) {
          employeeId = await getNextEmployeeId(employee.employment_type);
          // Update employee_id in database first
          const { error: idError } = await supabase
            .from('employees')
            .update({ employee_id: employeeId })
            .eq('id', employee.id);

          if (idError) throw idError;
        }

        // Generate default password: Welcome@[EmployeeID]
        const defaultPassword = `Welcome@${employeeId}`;
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // Update employee with password and auth fields
        // Freelancers keep using the default generated password, so they
        // aren't forced to change it on first login.
        const isFreelancer = employee.employment_type === 'freelancer';
        const { error: updateError } = await supabase
          .from('employees')
          .update({
            password_hash: passwordHash,
            require_password_change: !isFreelancer,
            account_status: 'active',
          })
          .eq('id', employee.id);

        if (updateError) {
          console.error(`   ❌ Failed: ${employee.name} (${employeeId})`);
          console.error(`      Error:`, updateError.message);
          failCount++;
        } else {
          console.log(`   ✅ ${employee.name}`);
          console.log(`      ID       : ${employeeId}`);
          console.log(`      Email    : ${employee.email}`);
          console.log(`      Password : ${defaultPassword}`);
          console.log(`      Portal   : http://localhost:3000/employee/login\n`);
          successCount++;
        }
      } catch (err: any) {
        console.error(`   ❌ Error processing ${employee.name}:`, err.message || err);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Success : ${successCount} employee(s)`);
    if (failCount > 0) {
      console.log(`   ❌ Failed  : ${failCount} employee(s)`);
    }
    console.log('='.repeat(60));
    console.log('\n📌 Notes:');
    console.log('   • Regular employees        : XLU001, XLU002, ...');
    console.log('   • Temporary/freelancer     : TEMP001, TEMP002, ...');
    console.log('   • Default password format: Welcome@<employee_id>');
    console.log('   • All new employees must change password on first login');
    console.log('   • Employee Portal : http://localhost:3000/employee/login\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
createEmployeeLogins();
