'use client';

import { formatCFA, calculateInvoice } from '@/lib/utils';
import { Receipt, Banknote, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { CashflowChart } from '@/components/dashboard/cashflow-chart';
import { InvoiceAmountChart } from '@/components/dashboard/invoice-amount-chart';
import { useDataStore } from '@/store/data-store';
import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useNotificationsManager } from '@/hooks/use-notifications';

export default function DashboardPage() {
  const invoices = useDataStore((state) => state.invoices);
  const payments = useDataStore((state) => state.payments);
  const settings = useDataStore((state) => state.settings);
  const activeEmployeeId = useDataStore((state) => state.activeEmployeeId);
  const employees = useDataStore((state) => state.employees);
  const { t } = useTranslation();
  useNotificationsManager();

  const activeEmployee = employees.find(e => e.id === activeEmployeeId);

  type PeriodFilter = 'all' | 'thisMonth' | 'lastMonth' | 'thisYear';
  const [period, setPeriod] = useState<PeriodFilter>('thisMonth');

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filterByDate = (dateString: string) => {
      if (period === 'all') return true;
      const date = new Date(dateString);
      if (period === 'thisMonth') return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      if (period === 'lastMonth') {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
      }
      if (period === 'thisYear') return date.getFullYear() === currentYear;
      return true;
    };

    const filteredInvoices = invoices.filter(inv => filterByDate(inv.issueDate));
    const filteredPayments = payments.filter(p => filterByDate(p.date));

    // 1. Chiffre d'affaires total (hors proformas, hors refusées/brouillons)
    const totalRevenue = filteredInvoices
      .filter(inv => inv.type !== 'proforma' && inv.status !== 'draft' && inv.status !== 'rejected')
      .reduce((acc, inv) => acc + calculateInvoice(inv.lines, inv.metadata).total, 0);
      
    // 2. Encours (Factures envoyées, en retard, partiellement payées - le total moins ce qui a été payé)
    const outstandingInvoices = filteredInvoices.filter(inv => 
      inv.type !== 'proforma' && ['sent', 'late', 'partially_paid'].includes(inv.status)
    );
    
    let outstandingAmounts = 0;
    outstandingInvoices.forEach(inv => {
      const invTotal = calculateInvoice(inv.lines, inv.metadata).total;
      const invPaid = payments.filter(p => p.invoiceId === inv.id).reduce((sum, p) => sum + p.amount, 0); // Always check all payments for outstanding balance
      outstandingAmounts += Math.max(0, invTotal - invPaid);
    });

    // 3. Total des encaissements (Factures payées) dans la période
    const paidThisMonth = filteredPayments.reduce((acc, pay) => acc + pay.amount, 0);
    
    // 4. Actions rapides / Brouillons
    const upcoming = filteredInvoices.filter(inv => inv.type !== 'proforma' && inv.status === 'draft').length;

    return {
      totalRevenue,
      outstandingAmounts,
      paidThisMonth,
      upcoming
    };
  }, [invoices, payments]);

  return (
    <div className="space-y-6 sm:space-y-10 max-w-[1400px] mx-auto">
      
      {/* Header Corporate Minimaliste */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 pb-4 sm:pb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-slate-800 tracking-tight">
            Bienvenue sur votre espace, <span className="font-medium text-slate-900">{(activeEmployee?.name || settings.userName || 'Utilisateur').replace(/\s*\(.*?\)/g, '')}</span>.
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 sm:mt-2 font-light">
            {t('dashboard.title')} - Résumé de vos activités financières
          </p>
        </div>
        
        {/* Subtle Date Filter */}
        <div className="shrink-0">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="bg-white border border-slate-200 text-slate-600 text-sm rounded-full px-4 py-2 hover:border-slate-300 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer pr-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NDc0OGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat shadow-sm"
          >
            <option value="all">Toute la période</option>
            <option value="thisYear">Cette année</option>
            <option value="thisMonth">Ce mois-ci</option>
            <option value="lastMonth">Mois dernier</option>
          </select>
        </div>
      </div>

      {/* KPI Cards - Style Banque en Ligne (Gris, Fin, Epuré) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Chiffre d'Affaires */}
        <Link href="/invoices" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 cursor-pointer group block">
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">{t('dashboard.stats.totalRevenue')}</p>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-colors group-hover:bg-slate-100">
              <Receipt className="w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-light text-slate-900 tracking-tight truncate group-hover:text-primary transition-colors" title={formatCFA(stats.totalRevenue)}>
              {formatCFA(stats.totalRevenue, true)}
            </p>
          </div>
        </Link>

        {/* Card 2: Encours Clients */}
        <Link href="/invoices?filter=encours" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 cursor-pointer group block">
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">{t('dashboard.stats.pendingAmount')}</p>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-colors group-hover:bg-slate-100">
              <Clock className="w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-light text-slate-900 tracking-tight truncate group-hover:text-primary transition-colors" title={formatCFA(stats.outstandingAmounts)}>
              {formatCFA(stats.outstandingAmounts, true)}
            </p>
          </div>
        </Link>

        {/* Card 3: Encaissements */}
        <Link href="/invoices?filter=paid" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 cursor-pointer group block">
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">{t('dashboard.stats.paidInvoices')}</p>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-colors group-hover:bg-slate-100">
              <CheckCircle className="w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-light text-slate-900 tracking-tight truncate group-hover:text-primary transition-colors" title={formatCFA(stats.paidThisMonth)}>
              {formatCFA(stats.paidThisMonth, true)}
            </p>
          </div>
        </Link>

        {/* Card 4: Actions Rapides */}
        <Link href="/invoices?filter=draft" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 cursor-pointer group block">
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">{t('dashboard.quickActions')}</p>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-colors group-hover:bg-slate-100">
              <Banknote className="w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-light text-slate-900 tracking-tight truncate group-hover:text-primary transition-colors">
              {stats.upcoming}
            </p>
          </div>
        </Link>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <CashflowChart />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <InvoiceAmountChart />
        </div>
      </div>
    </div>
  );
}
