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
  const { initializeStore, clearStore, employees, activeEmployeeId } = useDataStore();
  const pathname = usePathname();
  const router = useRouter();
  const initialized = useRef(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && pathname !== '/login' && pathname !== '/') {
        router.push('/login');
      } else if (session && (pathname === '/login' || pathname === '/')) {
        router.push('/dashboard');
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
  if (isAuthChecking && pathname !== '/login' && pathname !== '/') {
    return <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">Chargement...</div>;
  }

  // Check if current user is pending
  const activeEmployee = employees.find(e => e.id === activeEmployeeId);
  if (activeEmployee?.status === 'pending' && pathname !== '/login') {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">En attente d'approbation</h2>
          <p className="text-slate-500 leading-relaxed mb-6">
            Votre demande pour rejoindre cette entreprise a bien été envoyée. Vous pourrez accéder à l'espace dès qu'un administrateur aura validé votre compte.
          </p>
          <button onClick={() => createClient().auth.signOut()} className="text-slate-500 hover:text-slate-900 font-medium transition-colors">
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // On determine si on est sur une page de création/édition
  const isEditorPage = pathname.includes('/invoices/') || pathname.includes('/proformas/');

  // Ne pas afficher la sidebar et le header sur la page de login ou la landing page
  if (pathname === '/login' || pathname === '/') {
    return <main className="min-h-screen w-full bg-slate-50">{children}</main>;
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
