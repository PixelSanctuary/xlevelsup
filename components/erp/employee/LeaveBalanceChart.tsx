'use client';

/**
 * Leave Balance Chart Component (Employee Portal)
 * Displays leave balances visually with progress bars
 */

import type { LeaveBalance } from '@/types/erp';

interface LeaveBalanceChartProps {
  leaveBalances: LeaveBalance[];
}

export default function LeaveBalanceChart({
  leaveBalances,
}: LeaveBalanceChartProps) {
  // Filter to only show casual, floater, sick, and earned
  const displayBalances = leaveBalances.filter((balance) =>
    ['casual', 'floater', 'sick', 'earned'].includes(balance.leave_type),
  );

  // Calculate accrued casual leave for current month
  const calculateAccruedCasualLeave = () => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    return currentMonth * 1.5; // 1.5 days per month
  };

  const getLeaveTypeInfo = (type: string) => {
    const types: Record<
      string,
      { label: string; icon: string; color: string }
    > = {
      casual: { label: 'Casual Leave', icon: '🏖️', color: 'cyan' },
      floater: { label: 'Floater Leave', icon: '🎈', color: 'purple' },
      sick: { label: 'Sick Leave', icon: '🏥', color: 'red' },
      earned: { label: 'Earned Leave', icon: '⭐', color: 'yellow' },
    };
    return types[type] || { label: type, icon: '📅', color: 'gray' };
  };

  const getProgressColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressBarColor = (type: string) => {
    const colors: Record<string, string> = {
      casual: 'bg-[var(--cyan)]',
      floater: 'bg-[var(--purple)]',
      sick: 'bg-red-500',
      earned: 'bg-yellow-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
      <h2 className='text-xl font-bold text-white mb-4'>Your Leave Balance</h2>

      <div className='space-y-4'>
        {displayBalances.map((balance) => {
          const info = getLeaveTypeInfo(balance.leave_type);
          // Fill based on consumption (used/total), not what's left — a bar
          // that fills up as leave is *used* matches how progress bars are
          // read; filling it from remaining_days made an almost-untouched
          // balance look almost fully consumed.
          const usedPercentage =
            balance.total_allocated > 0
              ? Math.min(100, (balance.used_days / balance.total_allocated) * 100)
              : 0;

          // For casual leave, calculate accrued amount up to current month
          const isCasualLeave = balance.leave_type === 'casual';
          const accruedAmount = isCasualLeave
            ? calculateAccruedCasualLeave()
            : balance.total_allocated;
          const availableThisMonth = isCasualLeave
            ? Math.max(0, accruedAmount - balance.used_days)
            : balance.remaining_days;

          return (
            <div key={balance.id} className='space-y-2'>
              {/* Header */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='text-xl'>{info.icon}</span>
                  <span className='text-sm font-medium text-white'>
                    {info.label}
                  </span>
                </div>
                <div className='text-right'>
                  <span
                    className={`text-lg font-bold ${
                      balance.remaining_days > 5
                        ? 'text-green-400'
                        : balance.remaining_days > 0
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {balance.remaining_days}
                  </span>
                  <span className='text-sm text-gray-400'>
                    {' '}
                    / {balance.total_allocated}
                  </span>
                </div>
              </div>

              {/* Casual Leave Monthly Accrual Info */}
              {isCasualLeave && (
                <div className='text-xs text-gray-400 bg-gray-800/50 rounded px-2 py-1'>
                  💡 Accrued so far: {accruedAmount.toFixed(1)} days (1.5
                  days/month) • Available now: {availableThisMonth.toFixed(1)}{' '}
                  days
                </div>
              )}

              {/* Progress Bar */}
              <div className='relative w-full h-2 bg-gray-800 rounded-full overflow-hidden'>
                <div
                  className={`h-full ${getProgressBarColor(balance.leave_type)} transition-all duration-300`}
                  style={{ width: `${usedPercentage}%` }}
                />
              </div>

              {/* Stats */}
              <div className='flex items-center justify-between text-xs'>
                <span className='text-gray-500'>
                  Used:{' '}
                  <span className='text-gray-400'>
                    {balance.used_days} days
                  </span>
                </span>
                <span className='text-gray-500'>
                  {usedPercentage.toFixed(0)}% used
                </span>
              </div>
            </div>
          );
        })}

        {displayBalances.length === 0 && (
          <div className='text-center py-8'>
            <p className='text-gray-400'>No leave balances available</p>
            <p className='text-sm text-gray-500 mt-2'>
              Contact HR to initialize your leave balances
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {displayBalances.length > 0 && (
        <div className='mt-6 pt-6 border-t border-gray-800'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-white'>
                {displayBalances.reduce((sum, b) => sum + b.remaining_days, 0)}
              </p>
              <p className='text-xs text-gray-400 mt-1'>Total Available</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-white'>
                {displayBalances.reduce((sum, b) => sum + b.used_days, 0)}
              </p>
              <p className='text-xs text-gray-400 mt-1'>Total Used</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
