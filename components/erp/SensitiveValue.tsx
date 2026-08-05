'use client';

/**
 * Wraps a salary/financial figure so it renders as masked dots until the
 * global reveal toggle (ERPHeader eye icon) is switched on. Renders children
 * untouched when visible, so callers can keep formatting values (e.g.
 * `formatCurrency(x).split('.')[0]`) however they already do.
 */

import type { ReactNode } from 'react';
import { useSensitiveData } from './SensitiveDataContext';

interface SensitiveValueProps {
  children: ReactNode;
}

export default function SensitiveValue({ children }: SensitiveValueProps) {
  const { visible } = useSensitiveData();

  if (visible) return <>{children}</>;

  return (
    <span
      className="select-none tracking-wide"
      title="Hidden — click the eye icon in the header to reveal financial figures"
    >
      ••••••
    </span>
  );
}
