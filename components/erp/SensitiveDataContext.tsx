'use client';

/**
 * Global show/hide control for salary and financial figures across the ERP
 * admin area. A single toggle (in ERPHeader) flips every wrapped figure at
 * once, rather than each amount needing its own click — the whole point is
 * to let someone blank the screen instantly before turning it toward a
 * colleague, not hunt down individual numbers.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'erp_financials_visible';

interface SensitiveDataContextValue {
  visible: boolean;
  toggle: () => void;
}

const SensitiveDataContext = createContext<SensitiveDataContextValue | undefined>(undefined);

export function SensitiveDataProvider({ children }: { children: ReactNode }) {
  // Defaults to hidden so the very first render (before localStorage is read
  // client-side) never briefly flashes real figures.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === 'true') setVisible(true);
  }, []);

  const toggle = () => {
    setVisible((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <SensitiveDataContext.Provider value={{ visible, toggle }}>
      {children}
    </SensitiveDataContext.Provider>
  );
}

export function useSensitiveData(): SensitiveDataContextValue {
  const ctx = useContext(SensitiveDataContext);
  if (!ctx) {
    throw new Error('useSensitiveData must be used within a SensitiveDataProvider');
  }
  return ctx;
}
