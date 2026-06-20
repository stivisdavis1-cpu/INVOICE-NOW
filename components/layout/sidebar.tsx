'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  FileText, 
  FileArchive,
  User, 
  BarChart2, 
  Settings, 
  HelpCircle, 
  ChevronDown,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { useDataStore } from '@/store/data-store';
import { Logo } from '@/components/ui/logo';
import { useTranslation } from '@/hooks/use-translation';

const navItems = [
  { translationKey: 'nav.dashboard', href: '/', icon: LayoutGrid },
  { translationKey: 'nav.invoices', href: '/invoices', icon: FileText, countKey: 'invoices' },
  { translationKey: 'nav.proformas', href: '/proformas', icon: FileArchive, countKey: 'proformas' },
  { translationKey: 'nav.clients', href: '/clients', icon: User, hasSubmenu: true, countKey: 'clients' },
  { translationKey: 'nav.reports', href: '/reports', icon: BarChart2 },
  { translationKey: 'nav.settings', href: '/settings', icon: Settings },
];

const bottomItems = [
  { translationKey: 'nav.help', label: 'Aide & FAQ', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, closeSidebar, isSidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const { t } = useTranslation();
  
  const invoicesData = useDataStore((state) => state.invoices);
  const clientsData = useDataStore((state) => state.clients);
  const companies = useDataStore((state) => state.companies);
  const activeCompanyId = useDataStore((state) => state.activeCompanyId);
  const setActiveCompany = useDataStore((state) => state.setActiveCompany);
  const settings = useDataStore((state) => state.settings);

  const currentPlan = settings?.plan || (settings?.isPremium ? 'premium' : 'free');

  const visibleNavItems = navItems.filter(item => {
    if (item.translationKey === 'nav.proformas' && currentPlan === 'free') {
      return false;
    }
    return true;
  });

  const counts: Record<string, number> = {
    invoices: invoicesData.filter(i => i.type === 'invoice').length,
    proformas: invoicesData.filter(i => i.type === 'proforma').length,
    clients: clientsData.length,
  };

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      <aside className={cn(
        "h-screen bg-white border-r border-gray-50 flex flex-col fixed left-0 top-0 overflow-y-auto overflow-x-hidden hide-scrollbar z-50 shadow-[4px_0_30px_rgba(0,0,0,0.03)] transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)",
        // Mobile transform
        isSidebarOpen ? "translate-x-0 w-[280px]" : "-translate-x-full lg:translate-x-0",
        // Desktop collapse width
        isSidebarCollapsed ? "lg:w-[80px]" : "lg:w-[280px] lg:rounded-tr-[32px] lg:rounded-br-[32px]"
      )}>
        <div className={cn("p-5 pb-4 flex items-center transition-all duration-300", isSidebarCollapsed ? "justify-center" : "justify-between")}>
          {!isSidebarCollapsed ? (
            <Logo onClick={closeSidebar} />
          ) : (
            <Logo iconOnly onClick={closeSidebar} />
          )}
          
          <button onClick={closeSidebar} className="lg:hidden text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-all duration-300 active:scale-90 flex-shrink-0">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Workspace Switcher */}
        {!isSidebarCollapsed && companies.length > 0 && (
          <div className="px-6 mb-4 mt-2">
            <div className="relative group">
              <select 
                className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-transparent text-gray-900 text-sm rounded-xl px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer font-medium"
                value={activeCompanyId || ''}
                onChange={(e) => setActiveCompany(e.target.value)}
                title="Changer d'espace de travail"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        <div className={cn("flex-1 py-4 space-y-2", isSidebarCollapsed ? "px-3" : "px-6")}>
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.translationKey}
                href={item.href}
                onClick={closeSidebar}
                title={isSidebarCollapsed ? t(item.translationKey) : undefined}
                className={cn(
                  "flex items-center transition-all duration-300 ease-out group active:scale-[0.98] relative",
                  isSidebarCollapsed ? "justify-center px-0 py-3.5 rounded-2xl" : "justify-between px-4 py-3.5 rounded-full",
                  isActive 
                    ? "bg-primary text-white shadow-[0_8px_20px_rgba(45,139,111,0.25)] hover:bg-primary-dark hover:shadow-[0_10px_25px_rgba(45,139,111,0.35)] hover:-translate-y-0.5" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 hover:scale-[1.02]"
                )}
              >
                <div className={cn("flex items-center font-medium text-[15px]", isSidebarCollapsed ? "justify-center" : "gap-3.5")}>
                  <item.icon className={cn("w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300", isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700", !isActive && "group-hover:scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                  {!isSidebarCollapsed && t(item.translationKey)}
                </div>

                {/* Notifications & Submenu */}
                {!isSidebarCollapsed ? (
                  <div className="flex items-center gap-2">
                    {item.countKey && counts[item.countKey] > 0 && (
                      <span className="bg-[#E67E22] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {counts[item.countKey]}
                      </span>
                    )}
                    {item.hasSubmenu && (
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isActive ? "text-white" : "text-gray-400 group-hover:translate-y-0.5")} />
                    )}
                  </div>
                ) : (
                  // Tiny notification dot when collapsed
                  item.countKey && counts[item.countKey] > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#E67E22] rounded-full"></span>
                  )
                )}
              </Link>
            );
          })}
        </div>

        <div className={cn("space-y-2 mb-4", isSidebarCollapsed ? "p-3" : "p-5")}>
          {bottomItems.map((item) => (
            <Link
              key={item.translationKey}
              href={item.href}
              title={isSidebarCollapsed ? item.label || t(item.translationKey) : undefined}
              className={cn(
                "flex items-center text-gray-500 hover:bg-gray-50/80 hover:text-gray-900 transition-all duration-300 ease-out font-medium text-[15px] group hover:scale-[1.02] active:scale-[0.98]",
                isSidebarCollapsed ? "justify-center px-0 py-3.5 rounded-2xl" : "gap-3.5 px-4 py-3.5 rounded-full"
              )}
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-700 transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
              {!isSidebarCollapsed && (item.label || t(item.translationKey))}
            </Link>
          ))}
          
          <button
            onClick={toggleSidebarCollapse}
            className={cn(
              "hidden lg:flex w-full items-center text-gray-400 hover:bg-gray-50/80 hover:text-primary transition-all duration-300 ease-out font-medium text-[15px] group hover:scale-[1.02] active:scale-[0.98]",
              isSidebarCollapsed ? "justify-center px-0 py-3.5 rounded-2xl mt-4" : "gap-3.5 px-4 py-3.5 rounded-full mt-2"
            )}
            title={isSidebarCollapsed ? "Agrandir le menu" : "Réduire le menu"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" strokeWidth={2} />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" strokeWidth={2} />
                Réduire
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
