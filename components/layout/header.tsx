'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Bell, Menu, LogOut } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useDataStore } from '@/store/data-store';
import { useTranslation } from '@/hooks/use-translation';
import { Logo } from '@/components/ui/logo';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/store/toast-store';

export function Header() {
  const { toggleSidebar } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  
  const settings = useDataStore((state) => state.settings);
  const employees = useDataStore((state) => state.employees);
  const activeEmployeeId = useDataStore((state) => state.activeEmployeeId);
  const setActiveEmployee = useDataStore((state) => state.setActiveEmployee);
  
  const notifications = useDataStore((state) => state.notifications);
  const markNotificationAsRead = useDataStore((state) => state.markNotificationAsRead);
  const markAllAsRead = useDataStore((state) => state.markAllAsRead);
  const checkLateInvoices = useDataStore((state) => state.checkLateInvoices);

  useEffect(() => {
    // Check for late invoices when the application loads
    checkLateInvoices();
  }, [checkLateInvoices]);

  const activeEmployee = employees.find(e => e.id === activeEmployeeId);

  // Filter notifications for active employee
  const myNotifications = notifications.filter(n => {
    if (!activeEmployee) return false;
    
    // Si c'est une notification générique (sans cible spécifique) -> on l'affiche si c'est pas restreint
    if (!n.targetRole && !n.targetRoles && !n.targetEmployeeId && !n.targetEmployeeIds) {
      return true; // Notification globale
    }

    const matchesRole = n.targetRole === activeEmployee.role || n.targetRole === 'any' || (n.targetRoles && (n.targetRoles.includes(activeEmployee.role) || n.targetRoles.includes('any')));
    const matchesEmployee = n.targetEmployeeId === activeEmployee.id || (n.targetEmployeeIds && n.targetEmployeeIds.includes(activeEmployee.id));

    return matchesRole || matchesEmployee;
  });

  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("À très bientôt !", "Vous avez été déconnecté en toute sécurité.");
      window.location.href = '/login';
    } catch (error) {
      toast.error("Erreur", "Un problème est survenu lors de la déconnexion.");
    }
  };

  return (
    <header className="h-[100px] flex items-center justify-between px-6 lg:px-10 bg-transparent pt-4">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-300 active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Logo only visible on mobile in header */}
          <div className="lg:hidden">
            <Logo />
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="relative flex items-center hidden sm:flex w-full group">
          <Search className="absolute left-5 w-[18px] h-[18px] text-gray-400 group-focus-within:text-primary transition-colors duration-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full max-w-[400px] h-[46px] pl-12 pr-12 bg-white rounded-full border-none shadow-[0_2px_15px_rgba(0,0,0,0.03)] focus:shadow-[0_4px_20px_rgba(45,139,111,0.1)] focus:ring-2 focus:ring-primary/20 outline-none text-[15px] text-gray-700 placeholder:text-gray-400 placeholder:font-medium transition-all duration-300"
          />
          <button type="button" className="absolute right-4 sm:left-[360px] sm:right-auto">
            <SlidersHorizontal className="w-[18px] h-[18px] text-gray-400 hover:text-primary transition-colors duration-300 active:scale-95" />
          </button>
        </form>
      </div>

      <div className="flex items-center gap-4 lg:gap-5">
        <button
          onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors font-bold text-gray-700 text-sm"
          title={language === 'fr' ? 'Switch to English' : 'Passer en Français'}
        >
          {language.toUpperCase()}
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-all duration-300 active:scale-90"
          >
            <Bell className="w-[22px] h-[22px]" />
            {unreadCount > 0 && (
              <span className="absolute top-[6px] right-[6px] w-[9px] h-[9px] bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-gray-50 z-50 animate-in fade-in slide-in-from-top-4 p-4">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => activeEmployee && markAllAsRead(activeEmployee.id, activeEmployee.role)}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                  {myNotifications.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Aucune notification</p>
                  ) : (
                    myNotifications.map((notif) => {
                      const bgColors = {
                        info: 'bg-blue-50 text-blue-900 border border-blue-100',
                        warning: 'bg-orange-50 text-orange-900 border border-orange-100',
                        success: 'bg-green-50 text-green-900 border border-green-100'
                      };
                      const textColors = {
                        info: 'text-blue-700/80',
                        warning: 'text-orange-700/80',
                        success: 'text-green-700/80'
                      };
                      return (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            if (notif.link) {
                              router.push(notif.link);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3 rounded-xl transition-all cursor-pointer hover:shadow-sm ${bgColors[notif.type]} ${!notif.isRead ? 'opacity-100 ring-1 ring-black/5' : 'opacity-60'}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-semibold leading-tight">{notif.title}</p>
                            {!notif.isRead && <span className="w-2 h-2 rounded-full bg-current flex-shrink-0 mt-1"></span>}
                          </div>
                          <p className={`text-xs mt-1 ${textColors[notif.type]}`}>{notif.message}</p>
                          <p className={`text-[10px] mt-1.5 opacity-60 ${textColors[notif.type]}`}>
                            {new Date(notif.date).toLocaleDateString()} {new Date(notif.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        


        <div className="flex items-center gap-3 cursor-pointer group relative">
          <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(45,139,111,0.2)] group-hover:scale-105 uppercase">
            {activeEmployee?.name ? activeEmployee.name.replace(/\s*\(.*?\)/g, '').charAt(0) : (settings.userName ? settings.userName.charAt(0) : 'U')}
          </div>
          
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.1)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
            <div className="p-2">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
