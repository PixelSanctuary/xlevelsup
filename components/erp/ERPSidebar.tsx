'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ERPSidebarProps {
  userRole: string;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function ERPSidebar({
  userRole,
  isCollapsed,
  setIsCollapsed,
}: ERPSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFinancesActive = pathname?.startsWith('/erp/finances');
  const [isFinancesOpen, setIsFinancesOpen] = useState(isFinancesActive);
  const isMyWorkspaceActive = pathname?.startsWith('/employee');
  const [isMyWorkspaceOpen, setIsMyWorkspaceOpen] = useState(isMyWorkspaceActive);

  const isActivePath = (href: string) => {
    if (pathname === href) return true;
    const pathSegs = pathname.split('/').filter(Boolean);
    const hrefSegs = href.split('/').filter(Boolean);
    if (hrefSegs.length > pathSegs.length) return false;
    return hrefSegs.every((seg, i) => pathSegs[i] === seg);
  };

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

  // Helper for sub-tab checks
  const isActiveSubtab = (href: string) => {
    const url = new URL(href, 'http://localhost');
    if (pathname !== url.pathname) return false;
    const tabParam = url.searchParams.get('tab');
    const activeTab = searchParams.get('tab') || 'overview';
    return activeTab === tabParam;
  };

  // Finance sub-items (admin and HR only)
  const financeItems = userRole === 'employee' ? [] : [
          {
            href: '/erp/finances?tab=overview',
            label: 'Overview',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              </svg>
            ),
          },
          {
            href: '/erp/finances?tab=ledger',
            label: 'General Ledger',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
          },
          {
            href: '/erp/finances?tab=income',
            label: 'Client Income',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1" />
              </svg>
            ),
          },
          {
            href: '/erp/finances?tab=expenses',
            label: 'Expenses',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            ),
          },
          {
            href: '/erp/finances?tab=investments',
            label: 'Capital Inflow',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            href: '/erp/finances?tab=reports',
            label: 'Analytics',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            ),
          },
        ];

  // "My Workspace" — self-service pages for admins/HR who are also staff
  // members (e.g. the CEO/CTO/CFO), reached via their existing admin login.
  const myWorkspaceItems = userRole === 'employee' ? [] : [
          {
            href: '/employee/dashboard',
            label: 'My Dashboard',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              </svg>
            ),
          },
          {
            href: '/employee/attendance',
            label: 'My Attendance',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            href: '/employee/leave',
            label: 'My Leave Requests',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.07 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            ),
          },
        ];

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
      className="hidden md:flex flex-col h-screen fixed left-0 top-0 bg-[#0c0c0e]/95 backdrop-blur-md border-r border-gray-800/80 z-40 text-gray-400 select-none overflow-hidden"
    >
      {/* Brand Section */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800/80">
        <Link href="/erp/dashboard" className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan to-purple flex items-center justify-center font-bold text-white text-lg">
            X
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-lg text-white tracking-wider whitespace-nowrap bg-gradient-to-r from-cyan to-purple bg-clip-text text-transparent"
              >
                XLEVELSUP
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        
        {/* Toggle Button */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-md hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {navItems.map((item) => {
          const isActive = isActivePath(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? 'bg-cyan/10 text-cyan border border-cyan/20'
                  : 'hover:bg-gray-800/40 hover:text-white border border-transparent'
              }`}
            >
              <div className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-cyan' : 'text-gray-400 group-hover:text-cyan'}`}>
                {item.icon}
              </div>
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              
              {/* Tooltip on Collapsed */}
              {isCollapsed && (
                <div className="absolute left-16 bg-gray-900 border border-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}

        {/* Finances Group */}
        <div>
          <button
            onClick={() => !isCollapsed && setIsFinancesOpen(!isFinancesOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
              isFinancesActive
                ? 'bg-cyan/10 text-cyan border border-cyan/20'
                : 'hover:bg-gray-800/40 hover:text-white border border-transparent text-gray-400'
            }`}
          >
            {/* Wallet icon */}
            <div className={`flex-shrink-0 transition-colors duration-200 ${isFinancesActive ? 'text-cyan' : 'text-gray-400 group-hover:text-cyan'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium text-sm whitespace-nowrap flex-1 text-left"
                >
                  Finances
                </motion.span>
              )}
            </AnimatePresence>
            {!isCollapsed && (
              <svg
                className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isFinancesOpen ? 'rotate-180' : ''} ${isFinancesActive ? 'text-cyan' : 'text-gray-500'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {/* Tooltip on Collapsed */}
            {isCollapsed && (
              <div className="absolute left-16 bg-gray-900 border border-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                Finances
              </div>
            )}
          </button>

          {/* Sub-items */}
          <AnimatePresence initial={false}>
            {(isFinancesOpen || isCollapsed) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className={`mt-1 space-y-1 ${!isCollapsed ? 'pl-4 border-l border-gray-800/80 ml-4' : ''}`}>
                  {financeItems.map((item) => {
                    const isActive = isActiveSubtab(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-cyan/10 text-cyan border border-cyan/20'
                            : 'hover:bg-gray-800/40 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-cyan' : 'text-gray-400 group-hover:text-cyan'}`}>
                          {item.icon}
                        </div>
                        <AnimatePresence initial={false}>
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.2 }}
                              className="font-medium text-sm whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {/* Tooltip on Collapsed */}
                        {isCollapsed && (
                          <div className="absolute left-16 bg-gray-900 border border-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                            {item.label}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* My Workspace Group — self-service access for admin/HR who are also staff */}
        {myWorkspaceItems.length > 0 && (
          <div>
            <button
              onClick={() => !isCollapsed && setIsMyWorkspaceOpen(!isMyWorkspaceOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                isMyWorkspaceActive
                  ? 'bg-cyan/10 text-cyan border border-cyan/20'
                  : 'hover:bg-gray-800/40 hover:text-white border border-transparent text-gray-400'
              }`}
            >
              {/* Person icon */}
              <div className={`flex-shrink-0 transition-colors duration-200 ${isMyWorkspaceActive ? 'text-cyan' : 'text-gray-400 group-hover:text-cyan'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium text-sm whitespace-nowrap flex-1 text-left"
                  >
                    My Workspace
                  </motion.span>
                )}
              </AnimatePresence>
              {!isCollapsed && (
                <svg
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isMyWorkspaceOpen ? 'rotate-180' : ''} ${isMyWorkspaceActive ? 'text-cyan' : 'text-gray-500'}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {/* Tooltip on Collapsed */}
              {isCollapsed && (
                <div className="absolute left-16 bg-gray-900 border border-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                  My Workspace
                </div>
              )}
            </button>

            {/* Sub-items */}
            <AnimatePresence initial={false}>
              {(isMyWorkspaceOpen || isCollapsed) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className={`mt-1 space-y-1 ${!isCollapsed ? 'pl-4 border-l border-gray-800/80 ml-4' : ''}`}>
                    {myWorkspaceItems.map((item) => {
                      const isActive = isActivePath(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                            isActive
                              ? 'bg-cyan/10 text-cyan border border-cyan/20'
                              : 'hover:bg-gray-800/40 hover:text-white border border-transparent'
                          }`}
                        >
                          <div className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-cyan' : 'text-gray-400 group-hover:text-cyan'}`}>
                            {item.icon}
                          </div>
                          <AnimatePresence initial={false}>
                            {!isCollapsed && (
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="font-medium text-sm whitespace-nowrap"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {/* Tooltip on Collapsed */}
                          {isCollapsed && (
                            <div className="absolute left-16 bg-gray-900 border border-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                              {item.label}
                            </div>
                          )}
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

      {/* Collapse Trigger for Collapsed Sidebar */}
      {isCollapsed && (
        <div className="p-3 border-t border-gray-800/80 flex justify-center">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Role Tag Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800/80 bg-gray-900/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
              {userRole} Portal
            </span>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
