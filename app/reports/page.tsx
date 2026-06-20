'use client';

import { useState, useMemo } from 'react';
import { useDataStore } from '@/store/data-store';
import { PaymentAgingChart } from '@/components/reports/payment-aging-chart';
import { RevenueByClientChart } from '@/components/reports/revenue-by-client-chart';
import { calculateInvoice, formatCFA } from '@/lib/utils';
import { TrendingUp, Users, FileText, ArrowRight, Filter, Download } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { exportToExcel } from '@/lib/excel-export';
import { AlertModal } from '@/components/ui/alert-modal';

export default function ReportsPage() {
  const invoices = useDataStore((state) => state.invoices);
  const clients = useDataStore((state) => state.clients);
  const payments = useDataStore((state) => state.payments);
  const { t } = useTranslation();
  const settings = useDataStore((state) => state.settings);

  const [includeProformas, setIncludeProformas] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // KPIs Calculations
  const { totalRevenue, pendingInvoices, outstandingAmount, mrr } = useMemo(() => {
    const activeInvoices = includeProformas ? invoices : invoices.filter(inv => inv.type !== 'proforma');
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
    const pendingInvoices = activeInvoices.filter(inv => inv.status === 'sent' || inv.status === 'late' || inv.status === 'accepted');
    const outstandingAmount = pendingInvoices.reduce((acc, inv) => acc + calculateInvoice(inv.lines).total, 0);
    const mrr = totalRevenue > 0 ? Math.round(totalRevenue / 3) : 0;
    
    return { totalRevenue, pendingInvoices, outstandingAmount, mrr };
  }, [invoices, payments, includeProformas]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Corporate */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">{t('reports.title')}</h1>
          <p className="text-gray-500 mt-1">{t('reports.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setIncludeProformas(!includeProformas)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border",
              includeProformas 
                ? "bg-purple-50 text-purple-700 border-purple-200 shadow-sm" 
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}
          >
            <Filter className="w-4 h-4" />
            {includeProformas ? t('reports.proformasIncluded') : t('reports.includeProformas')}
          </button>
          
          <button
            onClick={() => {
              if (!settings.isPremium) {
                setIsAlertOpen(true);
                return;
              }
              exportToExcel(invoices, clients, payments, includeProformas);
            }}
            className={cn(
              "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border",
              settings.isPremium 
                ? "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 active:scale-95 border-slate-800"
                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            )}
            title={!settings.isPremium ? "Fonctionnalité Premium" : "Exporter les données"}
          >
            {settings.isPremium ? <Download className="w-4 h-4" /> : <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center">👑</span>}
            Exporter Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px] group hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-4">{t('reports.kpi.revenue')}</p>
              <h3 className="text-3xl font-light text-slate-900 tracking-tight truncate group-hover:text-primary transition-colors" title={formatCFA(totalRevenue)}>{formatCFA(totalRevenue, true)}</h3>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-colors group-hover:bg-slate-100">
                <TrendingUp className="w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px] group hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-4">{t('reports.kpi.outstanding')}</p>
              <h3 className="text-3xl font-light text-slate-900 tracking-tight truncate group-hover:text-primary transition-colors" title={formatCFA(outstandingAmount)}>{formatCFA(outstandingAmount, true)}</h3>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-colors group-hover:bg-slate-100">
                <FileText className="w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
              </div>
              <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">{pendingInvoices.length} factures</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px] group hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-4">{t('reports.kpi.mrr')}</p>
              <h3 className="text-3xl font-light text-slate-900 tracking-tight truncate group-hover:text-primary transition-colors" title={formatCFA(mrr)}>{formatCFA(mrr, true)}</h3>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-colors group-hover:bg-slate-100">
                <Users className="w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white p-5 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="h-[350px]">
            <PaymentAgingChart />
          </div>
        </div>

        <div className="bg-white p-5 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="h-[350px]">
            <RevenueByClientChart />
          </div>
        </div>
      </div>

      {/* Top Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('reports.topClients.title')}</h2>
            <p className="text-gray-500 text-sm mt-1">{t('reports.topClients.subtitle')}</p>
          </div>
          <Link href="/clients" className="flex items-center gap-2 text-primary font-medium hover:underline">
            {t('reports.topClients.viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-50">
              <tr>
                <th className="px-6 py-4 font-medium rounded-tl-3xl">{t('common.client')}</th>
                <th className="px-6 py-4 font-medium text-center">{t('reports.topClients.invoicesPaid')}</th>
                <th className="px-6 py-4 font-medium text-right rounded-tr-3xl">{t('reports.topClients.revenueGenerated')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(() => {
                const clientsWithCA = clients.map(client => {
                  const clientInvoices = invoices.filter(inv => 
                    (includeProformas || inv.type !== 'proforma') && 
                    inv.clientId === client.id && 
                    (inv.status === 'paid' || inv.status === 'accepted')
                  );
                  const ca = clientInvoices.reduce((acc, inv) => acc + calculateInvoice(inv.lines).total, 0);
                  return { ...client, ca, invoiceCount: clientInvoices.length };
                });
                
                const topClients = clientsWithCA
                  .filter(client => client.ca > 0)
                  .sort((a, b) => b.ca - a.ca)
                  .slice(0, 3);
                
                if (topClients.length === 0) {
                  return (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        {t('reports.topClients.noRevenue')}
                      </td>
                    </tr>
                  );
                }

                return topClients.map((client, idx) => (
                  <tr key={client.id} className="group hover:bg-gray-50/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 150}ms` }}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 text-[15px] group-hover:text-primary transition-colors">{client.name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{client.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">
                      <span className="bg-gray-100 px-3 py-1 rounded-full text-xs">{client.invoiceCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 tabular-nums">
                      {formatCFA(client.ca)}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <AlertModal
        isOpen={isAlertOpen}
        title="Fonctionnalité Premium"
        message="L'export Excel est une fonctionnalité réservée aux utilisateurs Premium."
        onClose={() => setIsAlertOpen(false)}
      />
    </div>
  );
}
