'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { RightSidebar } from '@/components/RightSidebar';
import { usePathname } from 'next/navigation';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <ToastProvider>
      <AuthProvider>
        <div className="flex flex-col min-h-screen font-sans text-gray-800">
          <Header />
          <div className="flex flex-1 relative">
            <main className="flex-grow min-w-0">
              {children}
            </main>
            <RightSidebar />
          </div>
          {!isHomePage && <Footer />}
        </div>
      </AuthProvider>
    </ToastProvider>
  );
}
