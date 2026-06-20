'use client';

import { useState } from 'react';
import { useDataStore } from '@/store/data-store';
import { Search, ArrowDownLeft, Building2, Smartphone, CreditCard, Banknote, ChevronUp, ChevronDown } from 'lucide-react';
import { formatCFA, formatDate, cn } from '@/lib/utils';
import Link from 'next/link';

const methodConfig: Record<string, { label: string; icon: any; className: string }> = {
  transfer: { label: 'Virement Bancaire', icon: Building2, className: 'bg-blue-50 text-blue-700 border-blue-100' },
  mobile: { label: 'Mobile Money', icon: Smartphone, className: 'bg-orange-50 text-orange-700 border-orange-100' },
  card: { label: 'Carte Bancaire', icon: CreditCard, className: 'bg-purple-50 text-purple-700 border-purple-100' },
  cash: { label: 'Espèces', icon: Banknote, className: 'bg-green-50 text-green-700 border-green-100' },
};

export default function PaymentsPage() {
  const payments = useDataStore((state) => state.payments);
  const clients = useDataStore((state) => state.clients);
  const invoices = useDataStore((state) => state.invoices);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting state
  const [sortField, setSortField] = useState<'id' | 'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filteredPayments = payments.filter((payment) => {
    if (searchTerm) {
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      const client = clients.find(c => c.id === invoice?.clientId);
      
      const matchRef = payment.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchInv = payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClient = client?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchRef || matchInv || matchClient;
    }
    return true;
  }).sort((a, b) => {
    if (sortField === 'id') {
      const valA = a.id;
      const valB = b.id;
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    }
    if (sortField === 'date') {
      const valA = new Date(a.date).getTime();
      const valB = new Date(b.date).getTime();
      return sortDir === 'asc' ? valA - valB : valB - valA;
    }
    if (sortField === 'amount') {
      const valA = a.amount;
      const valB = b.amount;
      return sortDir === 'asc' ? valA - valB : valB - valA;
    }
    return 0;
  });

  const handleSort = (field: 'id' | 'date' | 'amount') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const totalCollected = payments.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Corporate */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-slate-800 tracking-tight">Historique des Encaissements</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 sm:mt-2 font-light">Suivez l'évolution de vos flux de trésorerie entrants.</p>
        </div>
        
        <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total encaissé</p>
            <p className="text-xl font-bold text-gray-900 leading-none">{formatCFA(totalCollected)}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors duration-300" />
          <input
            type="text"
            placeholder="Rechercher par client, facture ou réf..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 rounded-xl border border-gray-100 focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 text-[15px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider">
              <tr>
                <th 
                  className="px-6 py-4 font-medium rounded-tl-3xl cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    Réf. Paiement
                    {sortField === 'id' && (
                      sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 font-medium">Facture Liée</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortField === 'date' && (
                      sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 font-medium">Méthode</th>
                <th 
                  className="px-6 py-4 font-medium text-right rounded-tr-3xl cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Montant
                    {sortField === 'amount' && (
                      sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => {
                  const invoice = invoices.find(inv => inv.id === payment.invoiceId);
                  const client = clients.find(c => c.id === invoice?.clientId);
                  const method = methodConfig[payment.method];
                  const MethodIcon = method.icon;

                  return (
                    <tr key={payment.id} className="group hover:bg-gray-50/50 transition-all duration-300">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{payment.id}</div>
                        {payment.reference && <div className="text-gray-500 text-xs mt-0.5">Réf: {payment.reference}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/invoices/${payment.invoiceId}`} className="font-medium text-primary hover:underline">
                          {payment.invoiceId}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{client?.name || 'Inconnu'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(payment.date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", method.className)}>
                          <MethodIcon className="w-3.5 h-3.5" />
                          {method.label}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 tabular-nums">
                        {formatCFA(payment.amount)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Aucun encaissement trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
