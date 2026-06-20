'use client';

import { useUIStore } from '@/store/ui-store';
import { useDataStore } from '@/store/data-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useUIStore();
  const { initializeStore, clearStore } = useDataStore();
  const pathname = usePathname();
  const router = useRouter();
  const initialized = useRef(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && pathname !== '/login') {
        router.push('/login');
      } else if (session && pathname === '/login') {
        router.push('/');
      } else if (session && !initialized.current) {
        initialized.current = true;
        initializeStore();
      }
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearStore();
        initialized.current = false;
        router.push('/login');
      } else if (event === 'SIGNED_IN' && session) {
        if (!initialized.current) {
          initialized.current = true;
          initializeStore();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeStore, clearStore, pathname, router]);

  // Prevent rendering protected content before auth check
  if (isAuthChecking && pathname !== '/login') {
    return <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">Chargement...</div>;
  }

  // On determine si on est sur une page de création/édition
  const isEditorPage = pathname.includes('/invoices/') || pathname.includes('/proformas/');

  // Ne pas afficher la sidebar et le header sur la page de login
  if (pathname === '/login') {
    return <main className="min-h-screen w-full bg-slate-50 flex items-center justify-center">{children}</main>;
  }

  return (
    <>
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className={cn("flex-1 min-w-0 ml-0 flex flex-col transition-all duration-300 print:bg-white print:ml-0 print:block print:overflow-visible", 
        isSidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
      )}>
        <div className="print:hidden">
          <Header />
        </div>
        <main className={cn("flex-1 w-full min-w-0 print:p-0 print:m-0 print:bg-white print:block print:overflow-visible",
          isEditorPage ? "p-0" : "p-4 sm:p-5 lg:p-5"
        )}>
          {children}
        </main>
      </div>
    </>
  );
}
