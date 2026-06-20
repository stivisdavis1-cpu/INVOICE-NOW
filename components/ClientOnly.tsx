'use client';

import { useMounted } from '@/hooks/use-mounted';
import { useNotificationEngine } from '@/hooks/use-notification-engine';

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const isMounted = useMounted();
  
  // Start the notification engine once the client is mounted
  useNotificationEngine();

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Chargement d'Invoice Now...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
