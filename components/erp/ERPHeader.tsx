'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { logout } from '@/actions/erp/auth';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useSensitiveData } from './SensitiveDataContext';
import UpcomingEventsPanel from './UpcomingEventsPanel';

interface ERPHeaderProps {
  userEmail: string;
  userRole: string;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onMobileMenuToggle: () => void;
}

export default function ERPHeader({
  userEmail,
  userRole,
  isCollapsed,
  setIsCollapsed,
  onMobileMenuToggle,
}: ERPHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { visible: financialsVisible, toggle: toggleFinancialsVisible } = useSensitiveData();

  // Generate page title and breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // Format path segment for display (e.g. 'attendance-change-requests' -> 'Attendance Change Requests')
  const formatSegment = (segment: string) => {
    return segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pageTitle = pathSegments.length > 1 ? formatSegment(pathSegments[pathSegments.length - 1]) : 'Dashboard';

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.success('Logged out successfully', {
        duration: 2000,
        position: 'top-center',
      });
      router.push(result.redirectTo || '/erp/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-[#0c0c0e]/80 backdrop-blur-md border-b border-gray-800/80 flex items-center justify-between px-4 sm:px-6">
      {/* Left Section: Menu Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger menu */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop Expand Sidebar button (only visible if sidebar is collapsed) */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            aria-label="Expand sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm font-medium text-gray-400 select-none">
          <Link href="/erp/dashboard" className="hover:text-white transition-colors">
            ERP
          </Link>
          {pathSegments.length > 1 && (
            <>
              <span className="text-gray-600">/</span>
              <span className="text-gray-200 font-semibold">{pageTitle}</span>
            </>
          )}
        </nav>
      </div>

      {/* Right Section: User & Logout */}
      <div className="flex items-center gap-4">
        {/* Upcoming events: birthdays, work anniversaries, holidays */}
        <UpcomingEventsPanel />

        {/* Show/Hide financial figures — one global switch for every salary
            and financial number rendered across the ERP admin area, so it
            can be blanked instantly before turning a screen toward someone. */}
        <button
          onClick={toggleFinancialsVisible}
          className="p-2 rounded-lg hover:bg-gray-800/40 text-gray-400 hover:text-white transition-colors"
          title={financialsVisible ? 'Hide financial figures' : 'Show financial figures'}
          aria-label={financialsVisible ? 'Hide financial figures' : 'Show financial figures'}
        >
          {financialsVisible ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
        </button>

        {/* User Info Card */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-800/40 border border-transparent hover:border-gray-800/80 transition-all text-left group"
          >
            {/* Custom styled avatar bubble */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan/30 to-purple/30 border border-cyan/40 flex items-center justify-center font-bold text-cyan text-sm">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-gray-200 group-hover:text-cyan transition-colors truncate max-w-[120px]">
                {userEmail}
              </p>
              <p className="text-[10px] text-gray-400 capitalize truncate">
                {userRole}
              </p>
            </div>
            <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <>
              {/* Overlay listener */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-[#0c0c0e]/95 border border-gray-800/80 shadow-2xl p-2 z-50 animate-in fade-in-50 slide-in-from-top-1">
                <div className="px-3 py-2 border-b border-gray-800/80 mb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                  <p className="text-sm font-medium text-white truncate">{userEmail}</p>
                  <p className="text-xs text-gray-400 capitalize">{userRole} Portal</p>
                </div>
                
                <Link
                  href="/erp/employees"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white rounded-md hover:bg-gray-850 transition-colors"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Team Directory</span>
                </Link>

                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 rounded-md hover:bg-red-500/10 transition-colors mt-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
