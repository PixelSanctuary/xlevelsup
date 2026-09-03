'use client';

/**
 * Employee Portal Login Page
 */

import { useActionState, useEffect, Suspense, useRef, useState, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { employeeLoginAction } from '@/actions/erp/employee-auth';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { getCurrentPosition } from '@/lib/utils/geolocation';

function EmployeeLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(
    employeeLoginAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Check for password change success message
  useEffect(() => {
    const passwordChanged = searchParams.get('passwordChanged');
    if (passwordChanged === 'true') {
      toast.success(
        'Password changed successfully! Please login with your new password.',
      );
      // Clean up URL
      router.replace('/employee/login');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (state?.success) {
      toast.success('Login successful!');
      if (state.requirePasswordChange) {
        router.push('/employee/change-password');
      } else if (state.employmentType === 'freelancer') {
        router.push('/employee/attendance');
      } else {
        router.push('/employee/dashboard');
      }
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  // Handle form submission with location capture
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formRef.current) return;

    setIsCapturingLocation(true);

    // Try to get location
    try {
      const position = await getCurrentPosition();

      // Add location to form data via hidden inputs
      const latInput = document.createElement('input');
      latInput.type = 'hidden';
      latInput.name = 'latitude';
      latInput.value = position.latitude.toString();
      formRef.current.appendChild(latInput);

      const lonInput = document.createElement('input');
      lonInput.type = 'hidden';
      lonInput.name = 'longitude';
      lonInput.value = position.longitude.toString();
      formRef.current.appendChild(lonInput);

      const accInput = document.createElement('input');
      accInput.type = 'hidden';
      accInput.name = 'accuracy';
      accInput.value = position.accuracy.toString();
      formRef.current.appendChild(accInput);

      toast.success('Location captured', { duration: 1000 });
    } catch (error) {
      // Location failed, continue without it
      console.warn('Location capture failed:', error);
      toast('Location unavailable - continuing without location', {
        icon: '⚠️',
        duration: 2000,
      });
    } finally {
      setIsCapturingLocation(false);
    }

    // Submit the form - build FormData from controlled state so values survive re-renders
    const formData = new FormData();
    formData.set('email', email);
    formData.set('password', password);
    // Copy any hidden inputs (location fields) from the form element
    if (formRef.current) {
      new FormData(formRef.current).forEach((value, key) => {
        if (key !== 'email' && key !== 'password') {
          formData.set(key, value);
        }
      });
    }
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-4'>
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] bg-clip-text text-transparent mb-2'>
            Employee Portal
          </h1>
          <p className='text-gray-400'>XLEVELSUP ERP System</p>
        </div>

        {/* Login Form */}
        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl'>
          <form ref={formRef} onSubmit={handleSubmit} className='space-y-4'>
            {/* Email */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium mb-2 text-gray-300'
              >
                Email Address
              </label>
              <input
                type='email'
                id='email'
                name='email'
                required
                placeholder='you@example.com'
                disabled={isPending}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500'
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium mb-2 text-gray-300'
              >
                Password
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  name='password'
                  required
                  placeholder='••••••••'
                  disabled={isPending}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full pl-4 pr-10 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none'
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 hover:text-white transition-colors">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 hover:text-white transition-colors">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Default Password Info */}
            <div className='bg-blue-900/20 border border-blue-700/30 rounded-lg p-3'>
              <p className='text-xs text-blue-300'>
                <strong>First time login?</strong> Use your default password:{' '}
                <code className='bg-blue-800/30 px-1 rounded'>
                  Welcome@[YourEmployeeID]
                </code>
                <br />
                Example:{' '}
                <code className='bg-blue-800/30 px-1 rounded'>
                  Welcome@XLU000
                </code>{' '}
                or{' '}
                <code className='bg-blue-800/30 px-1 rounded'>
                  Welcome@TEMP000
                </code>
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type='submit'
              variant='primary'
              className='w-full'
              disabled={isPending || isCapturingLocation}
            >
              {isCapturingLocation
                ? 'Capturing location...'
                : isPending
                  ? 'Logging in...'
                  : 'Login'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className='mt-6 text-center text-xs text-gray-500'>
          <p>Need help? Contact your HR department</p>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeLoginPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]'>
          <div className='text-white'>Loading...</div>
        </div>
      }
    >
      <EmployeeLoginForm />
    </Suspense>
  );
}
