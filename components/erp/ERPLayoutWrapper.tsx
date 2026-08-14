'use client';

import { useState, useEffect } from 'react';
import ERPSidebar from './ERPSidebar';
import ERPHeader from './ERPHeader';
import QuickActionFAB from './QuickActionFAB';
import { SensitiveDataProvider } from './SensitiveDataContext';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { m as motion, AnimatePresence } from 'framer-motion';

interface ERPLayoutWrapperProps {
  children: React.ReactNode;
  userEmail: string;
  userRole: string;
}

export default function ERPLayoutWrapper({
  children,
  userEmail,
  userRole,
}: ERPLayoutWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFinancesOpen, setIsMobileFinancesOpen] = useState(false);
  const [isMobileMyWorkspaceOpen, setIsMobileMyWorkspaceOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Close mobile menu on page change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    {
      href: '/erp/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      href: '/erp/employees',
      label: 'Employees',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      href: '/erp/attendance',
      label: 'Attendance',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: '/erp/time-tracking',
      label: 'Time Tracking',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: '/erp/attendance-change-requests',
      label: 'Attendance Requests',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: '/erp/leave-requests',
      label: 'Leave Requests',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.07 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      ),
    },
    {
      href: '/erp/payroll',
      label: 'Payroll',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    ...(userRole !== 'employee'
      ? [
          {
            href: '/erp/billing',
            label: 'Billing',
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
          },
          {
            href: '/erp/clients',
            label: 'Clients',
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  const mobileFinanceItems = userRole === 'employee' ? [] : [
          {
            href: '/erp/finances?tab=overview',
            label: 'Overview',
          },
          {
            href: '/erp/finances?tab=ledger',
            label: 'General Ledger',
          },
          {
            href: '/erp/finances?tab=income',
            label: 'Client Income',
          },
          {
            href: '/erp/finances?tab=expenses',
            label: 'Expenses',
          },
          {
            href: '/erp/finances?tab=investments',
            label: 'Capital Inflow',
          },
          {
            href: '/erp/finances?tab=reports',
            label: 'Analytics',
          },
        ];

  // "My Workspace" — self-service pages for admins/HR who are also staff
  // members (e.g. the CEO/CTO/CFO), reached via their existing admin login.
  const myWorkspaceItems = userRole === 'employee' ? [] : [
          { href: '/employee/dashboard', label: 'My Dashboard' },
          { href: '/employee/attendance', label: 'My Attendance' },
          { href: '/employee/leave', label: 'My Leave Requests' },
        ];

  const isActivePath = (href: string) => {
    if (pathname === href) return true;
    const pathSegs = pathname.split('/').filter(Boolean);
    const hrefSegs = href.split('/').filter(Boolean);
    if (hrefSegs.length > pathSegs.length) return false;
    return hrefSegs.every((seg, i) => pathSegs[i] === seg);
  };

  return (
    <SensitiveDataProvider>
    <div className="min-h-screen bg-[#060608] text-gray-200 antialiased flex">
      {/* Desktop Persistent Sidebar */}
      <ERPSidebar
        userRole={userRole}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Screen Layout Container */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isCollapsed ? 'md:pl-[72px]' : 'md:pl-[260px]'
        }`}
      >
        {/* Top Header */}
        <ERPHeader
          userEmail={userEmail}
          userRole={userRole}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
        />

        {/* Inner Content Area */}
        <div className="flex-grow flex flex-col">
          {children}
        </div>

        {/* Global Floating Action Button */}
        <QuickActionFAB />
      </div>

      {/* Mobile Drawered Sidebar Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-[#0c0c0e] border-r border-gray-800 z-50 p-6 flex flex-col gap-6 md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <Link href="/erp/dashboard" className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan to-purple flex items-center justify-center font-bold text-white text-lg">
                    X
                  </div>
                  <span className="font-bold text-lg text-white tracking-wider bg-gradient-to-r from-cyan to-purple bg-clip-text text-transparent">
                    XLEVELSUP
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-850 text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation list */}
              <div className="flex-grow overflow-y-auto py-4 space-y-2">
                {navItems.map((item) => {
                  const isActive = isActivePath(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-cyan/10 text-cyan border border-cyan/20'
                          : 'hover:bg-gray-800/40 text-gray-300'
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  );
                })}

                {/* Finances Group (mobile) */}
                <div>
                  <button
                    onClick={() => setIsMobileFinancesOpen(!isMobileFinancesOpen)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      pathname?.startsWith('/erp/finances')
                        ? 'bg-cyan/10 text-cyan border border-cyan/20'
                        : 'hover:bg-gray-800/40 text-gray-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium text-sm flex-1 text-left">Finances</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isMobileFinancesOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {isMobileFinancesOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 border-l border-gray-800/80 ml-4 mt-1 space-y-1">
                          {mobileFinanceItems.map((item) => {
                            const url = new URL(item.href, 'http://localhost');
                            const tabParam = url.searchParams.get('tab');
                            const activeTab = searchParams.get('tab') || 'overview';
                            const isActive = pathname === url.pathname && activeTab === tabParam;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                  isActive
                                    ? 'bg-cyan/10 text-cyan border border-cyan/20'
                                    : 'hover:bg-gray-800/40 text-gray-300'
                                }`}
                              >
                                <span className="font-medium text-sm">{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* My Workspace Group (mobile) — self-service access for admin/HR who are also staff */}
                {myWorkspaceItems.length > 0 && (
                  <div>
                    <button
                      onClick={() => setIsMobileMyWorkspaceOpen(!isMobileMyWorkspaceOpen)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                        pathname?.startsWith('/employee')
                          ? 'bg-cyan/10 text-cyan border border-cyan/20'
                          : 'hover:bg-gray-800/40 text-gray-300'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium text-sm flex-1 text-left">My Workspace</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isMobileMyWorkspaceOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {isMobileMyWorkspaceOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 border-l border-gray-800/80 ml-4 mt-1 space-y-1">
                            {myWorkspaceItems.map((item) => {
                              const isActive = pathname === item.href;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                    isActive
                                      ? 'bg-cyan/10 text-cyan border border-cyan/20'
                                      : 'hover:bg-gray-800/40 text-gray-300'
                                  }`}
                                >
                                  <span className="font-medium text-sm">{item.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-800 pt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {userRole} Portal
                  </span>
                </div>
                <div className="text-xs text-gray-400 px-1 truncate">
                  {userEmail}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </SensitiveDataProvider>
  );
}
