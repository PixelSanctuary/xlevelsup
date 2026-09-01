'use client';

/**
 * Attendance Change Request Review Form Component
 * For admin to approve/reject attendance change requests
 */

import { useActionState, useEffect, useRef } from 'react';
import { reviewAttendanceChangeRequestAction } from '@/actions/erp/attendance-change-requests';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { restoreFormValues } from '@/lib/utils/form';

interface AttendanceChangeRequestReviewFormProps {
  requestId: number;
  onSuccess?: () => void;
}

export default function AttendanceChangeRequestReviewForm({
  requestId,
  onSuccess,
}: AttendanceChangeRequestReviewFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const lastFormData = useRef<FormData | null>(null);

  const handleFormAction = async (prevState: any, formData: FormData) => {
    lastFormData.current = formData;
    const status = formData.get('status') as 'approved' | 'rejected';
    const comments = (formData.get('review_comments') as string) || undefined;
    return await reviewAttendanceChangeRequestAction(
      requestId,
      status,
      comments,
    );
  };

  const [state, formAction] = useActionState(handleFormAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success('Request reviewed.');
      if (onSuccess) {
        onSuccess();
      }
    } else if (state?.error) {
      toast.error(state.error);
      // React resets uncontrolled fields once the action resolves, even
      // though this is an error — put the user's input back.
      restoreFormValues(formRef.current, lastFormData.current);
    }
  }, [state, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className='space-y-4'>
      {/* Review Decision */}
      <div>
        <label className='block text-sm font-medium mb-2'>
          Decision <span className='text-red-500'>*</span>
        </label>
        <div className='flex gap-4'>
          <label className='flex items-center space-x-2 cursor-pointer'>
            <input
              type='radio'
              name='status'
              value='approved'
              required
              className='w-4 h-4 text-green-500 focus:ring-green-500'
            />
            <span className='text-sm'>Approve</span>
          </label>
          <label className='flex items-center space-x-2 cursor-pointer'>
            <input
              type='radio'
              name='status'
              value='rejected'
              required
              className='w-4 h-4 text-red-500 focus:ring-red-500'
            />
            <span className='text-sm'>Reject</span>
          </label>
        </div>
      </div>

      {/* Review Comments */}
      <div>
        <label
          htmlFor='review_comments'
          className='block text-sm font-medium mb-2'
        >
          Comments (Optional)
        </label>
        <textarea
          id='review_comments'
          name='review_comments'
          rows={3}
          placeholder='Add any comments about your decision...'
          className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500 resize-none'
        />
      </div>

      {/* Info */}
      <div className='bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3'>
        <p className='text-xs text-yellow-300'>
          <strong>Note:</strong> This submits your decision for another admin to confirm — the
          attendance record is only created/updated once a <em>different</em> admin approves it.
        </p>
      </div>

      {/* Submit Button */}
      <div className='flex gap-2'>
        <Button type='submit' variant='primary' className='flex-1'>
          Submit for Approval
        </Button>
      </div>
    </form>
  );
}
