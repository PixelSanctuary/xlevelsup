'use client';

import { useFormStatus } from 'react-dom';
import { useEffect, useActionState, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { createLedgerEntryAction } from '@/actions/erp/finance';
import type { Employee, CompanyAccount, Client } from '@/types/erp';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type='submit'
      variant='primary'
      className='w-full'
      disabled={pending}
    >
      {pending ? 'Saving...' : 'Save Record'}
    </Button>
  );
}

interface FinanceFormProps {
  type: 'income' | 'expense' | 'investment';
  employees: Employee[];
  accounts?: CompanyAccount[];
  clients?: Client[];
  defaultAccountId?: number | null;
  userRole?: string;
  onSuccess?: () => void;
}

export default function FinanceForm({
  type,
  employees,
  accounts = [],
  clients = [],
  defaultAccountId,
  userRole = 'admin',
  onSuccess,
}: FinanceFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);

  // Salary expenses are always paid from the company's main operating
  // account, never an invoice-backed vendor bill — so once this account
  // exists we skip asking for an account/invoice number and just use it.
  const isSalaryExpense = type === 'expense' && selectedCategory === 'Salary';
  const companyAccount = accounts.find((acc) => acc.name === 'Company Account');


  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      // Inflow vs Outflow determination
      const isInflow = type === 'income' || type === 'investment';
      formData.set('direction', isInflow ? 'inflow' : 'outflow');
      formData.set('transaction_type', type);
      
      // Expense validation: either payee_name (Paid By) or account_id (Paid From Account) must be provided
      if (type === 'expense') {
        const payeeName = formData.get('payee_name');
        const accountId = formData.get('account_id');
        if (!payeeName && !accountId) {
          return { success: false, error: "Either 'Paid By' or 'Paid From Account' is mandatory for expenses." };
        }
      }

      // Default statuses depending on type
      if (!formData.get('payment_status')) {
        formData.set('payment_status', 'completed');
      }
      if (!formData.get('approval_status')) {
        formData.set('approval_status', 'approved');
      }

      return await createLedgerEntryAction(formData);
    },
    { success: false },
  );

  useEffect(() => {
    if (state.success) {
      toast.success('Financial ledger entry saved!', {
        duration: 2000,
        position: 'top-center',
      });
      onSuccess?.();
    } else if (state.error) {
      toast.error(state.error, {
        duration: 3000,
        position: 'top-center',
      });
    }
  }, [state, onSuccess]);

  // Predefined Categories mapping
  const getCategories = () => {
    switch (type) {
      case 'income':
        return [
          'Service Fee',
          'Consulting',
          'Development',
          'Marketing Services',
          'Design Services',
          'Maintenance',
          'Subscription',
          'License Fee',
          'Other Income',
        ];
      case 'expense':
        return [
          'Salary',
          'Office Rent',
          'Utilities',
          'Internet',
          'Software Subscription',
          'Marketing Ads',
          'Freelancer Payment',
          'Travel',
          'Food',
          'Equipment',
          'Client Project Cost',
          'Maintenance',
          'Tax',
          'Bank Charges',
          'Miscellaneous',
        ];
      case 'investment':
        return [
          'Founder Investment',
          'Partner Capital',
          'External Funding',
          'Business Reserve',
        ];
      default:
        return ['Miscellaneous'];
    }
  };

  return (
    <form action={formAction} className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Date Field */}
        <div>
          <label htmlFor='transaction_date' className='block text-sm font-medium mb-2'>
            Transaction Date *
          </label>
          <input
            type='date'
            id='transaction_date'
            name='transaction_date'
            required
            defaultValue={today}
            max={today}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        {/* Category Field */}
        <div>
          <label htmlFor='category' className='block text-sm font-medium mb-2'>
            Category *
          </label>
          <select
            id='category'
            name='category'
            required
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value=''>Select Category</option>
            {getCategories().map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Processed For dropdown (only for Salary expenses) */}
        {type === 'expense' && selectedCategory === 'Salary' && (
          <div>
            <label htmlFor='employee_id' className='block text-sm font-medium mb-2'>
              Processed For *
            </label>
            <select
              id='employee_id'
              name='employee_id'
              required
              onChange={(e) => {
                const empId = parseInt(e.target.value, 10);
                if (!isNaN(empId)) {
                  const selectedEmp = employees.find((emp) => emp.id === empId);
                  if (selectedEmp && selectedEmp.monthly_salary) {
                    setAmount(selectedEmp.monthly_salary.toString());
                  }
                }
              }}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Amount Field */}
        <div>
          <label htmlFor='amount' className='block text-sm font-medium mb-2'>
            Amount (₹) *
          </label>
          <input
            type='number'
            id='amount'
            name='amount'
            required
            min='0.01'
            step='0.01'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder='1000.00'
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        {/* Dynamic fields based on form context */}
        {type === 'income' && (
          <>
            <div>
              <label htmlFor='client_name' className='block text-sm font-medium mb-2'>
                Client Name *
              </label>
              <input
                type='text'
                id='client_name'
                name='client_name'
                required
                list='clients-datalist'
                placeholder='Start typing or select client...'
                className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
              />
              <datalist id='clients-datalist'>
                {clients.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.client_id}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor='project_name' className='block text-sm font-medium mb-2'>
                Project Name
              </label>
              <input
                type='text'
                id='project_name'
                name='project_name'
                placeholder='Website Redesign'
                className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
              />
            </div>
          </>
        )}

        {type === 'investment' && (
          <div>
            <label htmlFor='payer_name' className='block text-sm font-medium mb-2'>
              Investor / Source *
            </label>
            <select
              id='payer_name'
              name='payer_name'
              required
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>— Select Investor / Source —</option>

              {/* Employees */}
              {employees.length > 0 && (
                <optgroup label='Employees'>
                  {employees.map((emp) => (
                    <option key={`emp-${emp.id}`} value={emp.name}>
                      {emp.name} — {emp.role} ({emp.employee_id})
                    </option>
                  ))}
                </optgroup>
              )}

              {/* Other / External */}
              <optgroup label='Other'>
                <option value='External Investor'>External Investor</option>
                <option value='Angel Investor'>Angel Investor</option>
                <option value='Venture Capital'>Venture Capital</option>
                <option value='Bank Loan'>Bank Loan</option>
                <option value='Client Advance'>Client Advance</option>
              </optgroup>
            </select>
          </div>
        )}

        {type === 'expense' && (
          <>
            <div>
              <label htmlFor='payee_name' className='block text-sm font-medium mb-2'>
                Paid By
              </label>
              <select
                id='payee_name'
                name='payee_name'
                className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
              >
                <option value=''>— Select Employee (either this or Account required) —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor='vendor_name' className='block text-sm font-medium mb-2'>
                Vendor / Payee
              </label>
              <input
                type='text'
                id='vendor_name'
                name='vendor_name'
                placeholder='Amazon Web Services, Office Depot, etc.'
                className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
              />
            </div>
            <div>
              <label htmlFor='receipt' className='block text-sm font-medium mb-2'>
                Receipt (Image or PDF)
              </label>
              <input
                type='file'
                id='receipt'
                name='receipt'
                accept='image/*,application/pdf'
                onChange={(e) => setReceiptFileName(e.target.files?.[0]?.name ?? null)}
                className='w-full text-sm text-gray-400 rounded-lg bg-dark-800 border border-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:bg-gradient-to-r file:from-cyan file:to-purple file:text-white file:font-semibold file:cursor-pointer hover:file:opacity-90 transition-colors'
              />
              {receiptFileName && (
                <p className='text-xs text-gray-500 mt-1.5 truncate'>Selected: {receiptFileName}</p>
              )}
            </div>
          </>
        )}

        {/* Account selector — expense outflow: money leaves this account.
            Salary is always paid from the Company Account, so that case
            skips the picker entirely and submits it silently instead. */}
        {isSalaryExpense && companyAccount ? (
          <input type='hidden' name='account_id' value={companyAccount.id} />
        ) : (
          type === 'expense' && accounts.length > 0 && (
            <div>
              <label htmlFor='account_id' className='block text-sm font-medium mb-2'>
                Paid From Account
              </label>
              <select
                id='account_id'
                name='account_id'
                defaultValue={defaultAccountId ?? ''}
                className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
              >
                <option value=''>— No Account (either this or Paid By required) —</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )
        )}

        {/* Account selector — investment inflow: money is received INTO this account */}
        {type === 'investment' && accounts.length > 0 && (
          <div>
            <label htmlFor='account_id' className='block text-sm font-medium mb-2'>
              Received Into Account *
            </label>
            <select
              id='account_id'
              name='account_id'
              required
              defaultValue={defaultAccountId ?? ''}
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value=''>— Select Destination Account —</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reference/Invoice Codes */}
        {(type === 'income' || type === 'expense') && (
          <>
            {/* Salary is an internal payout, not a vendor bill — no invoice number applies */}
            {!isSalaryExpense && (
              <div>
                <label htmlFor='invoice_number' className='block text-sm font-medium mb-2'>
                  Invoice Number
                </label>
                <input
                  type='text'
                  id='invoice_number'
                  name='invoice_number'
                  placeholder='INV-2026-001'
                  className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
                />
              </div>
            )}
            <div>
              <label htmlFor='reference_number' className='block text-sm font-medium mb-2'>
                Reference Number (TXN)
              </label>
              <input
                type='text'
                id='reference_number'
                name='reference_number'
                placeholder='TXN-98218-XYZ'
                className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
              />
            </div>
          </>
        )}

        {/* Payment mode select */}
        <div>
          <label htmlFor='payment_mode' className='block text-sm font-medium mb-2'>
            Payment Mode *
          </label>
          <select
            id='payment_mode'
            name='payment_mode'
            required
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value=''>Select Mode</option>
            <option value='Bank Transfer'>Bank Transfer</option>
            <option value='UPI'>UPI</option>
            <option value='Credit Card'>Credit Card</option>
            <option value='Debit Card'>Debit Card</option>
            <option value='Cash'>Cash</option>
            <option value='Cheque'>Cheque</option>
            <option value='PayPal'>PayPal</option>
            <option value='Stripe'>Stripe</option>
            <option value='Other'>Other</option>
          </select>
        </div>

        {/* Status filters */}
        {(
          <div>
            <label htmlFor='payment_status' className='block text-sm font-medium mb-2'>
              Payment Status
            </label>
            <select
              id='payment_status'
              name='payment_status'
              className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
            >
              <option value='completed'>Completed</option>
              <option value='pending'>Pending</option>
              <option value='failed'>Failed</option>
              <option value='cancelled'>Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor='description' className='block text-sm font-medium mb-2'>
          Description *
        </label>
        <textarea
          id='description'
          name='description'
          required
          rows={2}
          placeholder={`Describe this ${type}...`}
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>

      {/* Notes Field */}
      <div>
        <label htmlFor='notes' className='block text-sm font-medium mb-2'>
          Internal Notes
        </label>
        <textarea
          id='notes'
          name='notes'
          rows={2}
          placeholder='Any audit trails, details, or extra comments...'
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>

      <div className='pt-4'>
        <SubmitButton />
      </div>
    </form>
  );
}
