'use client';

import { useFormStatus } from 'react-dom';
import { useEffect, useActionState, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { createClientTransactionAction, updateClientTransactionAction } from '@/actions/erp/client-finances';
import { restoreFormValues } from '@/lib/utils/form';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  PAYMENT_MODES,
} from '@/types/finance';
import type { ClientTransaction, TransactionType } from '@/types/finance';

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type='submit'
      variant='primary'
      className='w-full'
      disabled={pending}
    >
      {pending ? 'Saving...' : isEdit ? 'Update Transaction' : 'Save Transaction'}
    </Button>
  );
}

interface ClientFinanceFormProps {
  clients: string[];
  onSuccess?: () => void;
  transaction?: ClientTransaction;
}

export default function ClientFinanceForm({
  clients,
  onSuccess,
  transaction,
}: ClientFinanceFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const lastFormData = useRef<FormData | null>(null);

  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      lastFormData.current = formData;
      if (transaction) {
        return await updateClientTransactionAction(transaction.id, formData);
      }
      return await createClientTransactionAction(formData);
    },
    { success: false },
  );

  const [transactionType, setTransactionType] =
    useState<TransactionType>('income');
  const [paymentStatus, setPaymentStatus] = useState<string>('completed');
  const [amount, setAmount] = useState<string>('');
  const [advanceAmount, setAdvanceAmount] = useState<string>('');

  useEffect(() => {
    if (transaction) {
      setTransactionType(transaction.type);
      setPaymentStatus(transaction.payment_status);
      setAmount(transaction.amount?.toString() || '');
      setAdvanceAmount(transaction.advance_amount?.toString() || '');
    } else {
      setTransactionType('income');
      setPaymentStatus('completed');
      setAmount('');
      setAdvanceAmount('');
    }
  }, [transaction]);

  useEffect(() => {
    if (state.success) {
      toast.success(transaction ? 'Transaction updated successfully!' : 'Transaction saved successfully!', {
        duration: 2000,
        position: 'top-center',
      });
      onSuccess?.();
    } else if (state.error) {
      toast.error(state.error, {
        duration: 3000,
        position: 'top-center',
      });
      // React resets uncontrolled fields once the action resolves, even
      // though this is an error — put the user's input back.
      restoreFormValues(formRef.current, lastFormData.current);
    }
  }, [state, onSuccess, transaction]);

  const today = new Date().toISOString().split('T')[0];
  const categories =
    transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const pendingAmountCalc =
    paymentStatus === 'advance' && amount && advanceAmount
      ? parseFloat(amount) - parseFloat(advanceAmount)
      : null;

  return (
    <form ref={formRef} action={formAction} className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label
            htmlFor='transaction_date'
            className='block text-sm font-medium mb-2'
          >
            Date *
          </label>
          <input
            type='date'
            id='transaction_date'
            name='transaction_date'
            required
            defaultValue={transaction?.transaction_date || today}
            max={today}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        <div>
          <label htmlFor='type' className='block text-sm font-medium mb-2'>
            Type *
          </label>
          <select
            id='type'
            name='type'
            required
            value={transactionType}
            onChange={(e) =>
              setTransactionType(e.target.value as TransactionType)
            }
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value='income'>Income</option>
            <option value='expense'>Expense</option>
          </select>
        </div>

        <div>
          <label htmlFor='amount' className='block text-sm font-medium mb-2'>
            Total Amount (₹) *
          </label>
          <input
            type='number'
            id='amount'
            name='amount'
            required
            min='0'
            step='0.01'
            placeholder='10000.00'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        <div>
          <label
            htmlFor='client_name'
            className='block text-sm font-medium mb-2'
          >
            Client Name *
          </label>
          <input
            type='text'
            id='client_name'
            name='client_name'
            required
            list='clients-list'
            defaultValue={transaction?.client_name || ''}
            placeholder='Client or Company Name'
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
          <datalist id='clients-list'>
            {clients.map((client) => (
              <option key={client} value={client} />
            ))}
          </datalist>
        </div>

        <div>
          <label
            htmlFor='project_name'
            className='block text-sm font-medium mb-2'
          >
            Project Name
          </label>
          <input
            type='text'
            id='project_name'
            name='project_name'
            defaultValue={transaction?.project_name || ''}
            placeholder='Optional project name'
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
        </div>

        <div>
          <label htmlFor='category' className='block text-sm font-medium mb-2'>
            Category *
          </label>
          <select
            id='category'
            name='category'
            required
            defaultValue={transaction?.category || ''}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value=''>Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor='payment_mode'
            className='block text-sm font-medium mb-2'
          >
            Payment Mode
          </label>
          <select
            id='payment_mode'
            name='payment_mode'
            defaultValue={transaction?.payment_mode || ''}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value=''>Select Payment Mode</option>
            {PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor='payment_status'
            className='block text-sm font-medium mb-2'
          >
            Payment Status *
          </label>
          <select
            id='payment_status'
            name='payment_status'
            required
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          >
            <option value='completed'>Completed (Full Payment)</option>
            <option value='advance'>Advance Received</option>
            <option value='pending'>Pending</option>
            <option value='cancelled'>Cancelled</option>
          </select>
        </div>

        {/* Advance amount — only shown when status is 'advance' */}
        {paymentStatus === 'advance' && (
          <>
            <div>
              <label
                htmlFor='advance_amount'
                className='block text-sm font-medium mb-2'
              >
                Advance Received (₹) *
              </label>
              <input
                type='number'
                id='advance_amount'
                name='advance_amount'
                required
                min='0'
                step='0.01'
                placeholder='5000.00'
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>
                Pending Amount (₹)
              </label>
              <div className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-yellow-400 font-semibold'>
                {pendingAmountCalc !== null && !isNaN(pendingAmountCalc)
                  ? `₹${pendingAmountCalc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  : '—'}
              </div>
              <p className='text-xs text-gray-500 mt-1'>Auto-calculated: Total − Advance</p>
            </div>
          </>
        )}

        <div>
          <label
            htmlFor='reference_number'
            className='block text-sm font-medium mb-2'
          >
            Reference Number
          </label>
          <input
            type='text'
            id='reference_number'
            name='reference_number'
            defaultValue={transaction?.reference_number || ''}
            placeholder='INV-001 / UPI Txn ID / etc.'
            className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
          />
          <p className='text-xs text-gray-500 mt-1'>Invoice no., UPI Txn ID, cheque no., etc.</p>
        </div>
      </div>

      <div>
        <label htmlFor='description' className='block text-sm font-medium mb-2'>
          Description
          <span className='text-gray-500 ml-1 font-normal'>(optional)</span>
        </label>
        <textarea
          id='description'
          name='description'
          rows={3}
          defaultValue={transaction?.description || ''}
          placeholder='Brief description of the transaction...'
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>

      <div>
        <label htmlFor='notes' className='block text-sm font-medium mb-2'>
          Notes
        </label>
        <textarea
          id='notes'
          name='notes'
          rows={2}
          defaultValue={transaction?.notes || ''}
          placeholder='Additional notes (optional)...'
          className='w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
        />
      </div>

      <div className='pt-4'>
        <SubmitButton isEdit={!!transaction} />
      </div>
    </form>
  );
}
