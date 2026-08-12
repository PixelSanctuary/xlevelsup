'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from './Navbar';
import Footer from './Footer';
import Preloader from '@/components/marketing/Preloader';

const WhatsAppButton = dynamic(() => import('@/components/ui/WhatsAppButton'), {
  ssr: false,
});

const InstagramReels = dynamic(() => import('@/components/sections/InstagramReels'), {
  ssr: false,
});

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isERPRoute = pathname?.startsWith('/erp');
  const isEmployeeRoute = pathname?.startsWith('/employee');
  const isPublicRoute = !isERPRoute && !isEmployeeRoute;

  return (
    <>
      {/* Marketing only — never covers ERP or employee screens. Self-gates to
          once per session via sessionStorage. */}
      {isPublicRoute && <Preloader />}
      {!isERPRoute && <Navbar />}
      <div className={isERPRoute ? '' : 'pt-20'}>{children}</div>
      {isPublicRoute && <InstagramReels />}
      {!isERPRoute && <Footer />}
      {isPublicRoute && <WhatsAppButton />}
    </>
  );
}
