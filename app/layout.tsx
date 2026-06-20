import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ClientOnly } from '@/components/ClientOnly';
import { ThemeManager } from '@/components/theme-manager';
import { AppLayoutShell } from '@/components/layout/app-layout-shell';
import { Toaster } from '@/components/ui/toaster';



export const metadata: Metadata = {
  title: 'Invoice Now - SaaS Facturation',
  description: 'Facturez comme un pro en FCFA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="fr">
      <body className={`font-sans antialiased bg-background text-foreground print:bg-white`}>
        <div className="flex min-h-screen relative w-full overflow-x-hidden print:overflow-visible print:bg-white">
          <ClientOnly>
            <ThemeManager />
            <AppLayoutShell>
              {children}
            </AppLayoutShell>
            <Toaster />
          </ClientOnly>
        </div>
      </body>
    </html>
  );
}
