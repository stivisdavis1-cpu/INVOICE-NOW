'use client';

import { useDataStore } from '@/store/data-store';
import { calculateInvoice, formatCFA, formatDate } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: 'Payé', className: 'bg-paid/10 text-paid' },
  sent: { label: 'Envoyé', className: 'bg-sent/10 text-sent' },
  draft: { label: 'Brouillon', className: 'bg-draft/10 text-draft' },
  late: { label: 'En retard', className: 'bg-late/10 text-late' },
};

export function RecentInvoices() {
  const invoices = useDataStore((state) => state.invoices);
  const clients = useDataStore((state) => state.clients);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Dernières Factures</h3>
        <button className="text-sm font-medium text-primary hover:text-primary-dark">
          Voir tout
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[600px]">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 font-medium">N° Facture</th>
              <th className="px-6 py-4 font-medium">Client</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Montant TTC</th>
              <th className="px-6 py-4 font-medium">Statut</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.slice(0, 5).map((invoice) => {
              const client = clients.find(c => c.id === invoice.clientId);
              const { total } = calculateInvoice(invoice.lines);
              const config = statusConfig[invoice.status] || statusConfig.draft;

              return (
                <tr key={invoice.id} className="group hover:bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 relative z-0 hover:z-10 bg-transparent rounded-xl">
                  <td className="px-6 py-4 font-medium text-gray-900 first:rounded-l-2xl">{invoice.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 transition-colors duration-300 group-hover:text-primary">{client?.name}</div>
                    <div className="text-gray-500 text-xs">{client?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 tabular-nums">
                    {formatCFA(total)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-transform duration-300 group-hover:scale-105 inline-block", config.className)}>
                      {config.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right last:rounded-r-2xl">
                    <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-300 active:scale-90 hover:shadow-sm">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
