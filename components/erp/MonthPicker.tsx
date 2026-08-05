'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface MonthPickerProps {
  /** Value in 'YYYY-MM' format, or '' for no selection */
  value: string;
  onChange: (value: string) => void;
  /** Renders a hidden input with this name, so the picker can be used inside a native <form> */
  name?: string;
  placeholder?: string;
  className?: string;
  /** Hide the "Clear" option — use when a month is always required */
  required?: boolean;
}

interface Position {
  top: number;
  left: number;
  width: number;
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function parseValue(value: string): { year: number; month: number } | null {
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const [year, month] = value.split('-').map(Number);
  return { year, month };
}

export default function MonthPicker({
  value,
  onChange,
  name,
  placeholder = 'Select month',
  className = '',
  required = false,
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const parsed = parseValue(value);
  const now = new Date();
  const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear());

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (parsed) setViewYear(parsed.year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Position the portalled popover against the trigger button, and keep it
  // pinned there on scroll/resize — rendering into document.body escapes any
  // ancestor stacking context (e.g. backdrop-filter panels), which otherwise
  // trap an absolutely-positioned dropdown behind later siblings.
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const displayLabel = parsed ? `${MONTH_LABELS[parsed.month - 1]} ${parsed.year}` : placeholder;

  const handleSelectMonth = (m: number) => {
    onChange(`${viewYear}-${String(m).padStart(2, '0')}`);
    setIsOpen(false);
  };

  return (
    <div className='relative'>
      {name && <input type='hidden' name={name} value={value} />}
      <button
        ref={buttonRef}
        type='button'
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-4 py-2 rounded-lg bg-dark-800 border border-gray-700 text-white text-left focus:outline-none focus:border-[var(--cyan)] transition-colors flex items-center justify-between gap-2 ${className}`}
      >
        <span className={parsed ? '' : 'text-gray-500'}>{displayLabel}</span>
        <svg className='w-4 h-4 text-gray-400 shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
        </svg>
      </button>

      {isOpen && mounted && position &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: 'absolute', top: position.top, left: position.left }}
            className='z-[9999] w-64 glass rounded-lg border border-gray-700 p-3 shadow-xl'
          >
            <div className='flex items-center justify-between mb-3'>
              <button
                type='button'
                onClick={() => setViewYear((y) => y - 1)}
                className='w-7 h-7 flex items-center justify-center rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors'
                aria-label='Previous year'
              >
                ‹
              </button>
              <span className='text-sm font-semibold text-white'>{viewYear}</span>
              <button
                type='button'
                onClick={() => setViewYear((y) => y + 1)}
                className='w-7 h-7 flex items-center justify-center rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors'
                aria-label='Next year'
              >
                ›
              </button>
            </div>
            <div className='grid grid-cols-3 gap-2'>
              {MONTH_LABELS.map((label, idx) => {
                const m = idx + 1;
                const isSelected = parsed?.year === viewYear && parsed?.month === m;
                return (
                  <button
                    key={label}
                    type='button'
                    onClick={() => handleSelectMonth(m)}
                    className={`text-xs py-2 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-[var(--cyan)] text-black font-semibold'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {!required && value && (
              <button
                type='button'
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className='w-full mt-3 text-xs text-gray-400 hover:text-white transition-colors'
              >
                Clear — show all months
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
