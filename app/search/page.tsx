'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useDataStore } from '@/store/data-store';
import { calculateInvoice, formatCFA, formatDate, cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, User, FileText, ChevronRight, Search } from 'lucide-react';
import { Suspense } from 'react';

// Highlight component
const Highlight = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? <mark key={i} className="bg-yellow-200 text-gray-900 px-1 rounded-sm font-semibold">{part}</mark> : <span key={i}>{part}</span>
      )}
    </span>
  );
};

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: 'Payée', className: 'bg-paid/10 text-paid' },
  sent: { label: 'Envoyée', className: 'bg-sent/10 text-sent' },
  draft: { label: 'Brouillon', className: 'bg-draft/10 text-draft' },
  late: { label: 'En retard', className: 'bg-late/10 text-late' },
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const clients = useDataStore((state) => state.clients);
  const invoices = useDataStore((state) => state.invoices);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.email.toLowerCase().includes(query.toLowerCase())
  );

  const filteredInvoices = invoices.filter(inv => {
    const client = clients.find(c => c.id === inv.clientId);
    return inv.id.toLowerCase().includes(query.toLowerCase()) || 
           client?.name.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-all duration-300 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-slate-800 tracking-tight">Résultats de recherche</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 sm:mt-2 font-light">
            Recherche pour &quot;<span className="font-semibold text-gray-900">{query}</span>&quot; ({filteredClients.length + filteredInvoices.length} résultats)
          </p>
        </div>
      </div>

      {query.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
          <p className="text-gray-500">Veuillez entrer un terme de recherche valide.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Clients Results */}
          {filteredClients.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Clients trouvés ({filteredClients.length})
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">Nom du Client</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Téléphone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredClients.map((client) => (
                      <tr 
                        key={client.id} 
                        className="group hover:bg-gray-50 transition-colors duration-300 cursor-pointer"
                        onClick={() => router.push('/clients')}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <Highlight text={client.name} highlight={query} />
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <Highlight text={client.email} highlight={query} />
                        </td>
                        <td className="px-6 py-4 text-gray-600">{client.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invoices Results */}
          {filteredInvoices.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Factures trouvées ({filteredInvoices.length})
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">N° Facture</th>
                      <th className="px-6 py-4 font-medium">Client</th>
                      <th className="px-6 py-4 font-medium">Date d'émission</th>
                      <th className="px-6 py-4 font-medium">Montant TTC</th>
                      <th className="px-6 py-4 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredInvoices.map((invoice) => {
                      const client = clients.find(c => c.id === invoice.clientId);
                      const { total } = calculateInvoice(invoice.lines);
                      const config = statusConfig[invoice.status] || statusConfig.draft;

                      return (
                        <tr 
                          key={invoice.id} 
                          className="group hover:bg-gray-50 transition-colors duration-300 cursor-pointer"
                          onClick={() => router.push(`/invoices/${invoice.id}`)}
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            <Highlight text={invoice.id} highlight={query} />
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {client ? <Highlight text={client.name} highlight={query} /> : 'Client inconnu'}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{formatDate(invoice.issueDate)}</td>
                          <td className="px-6 py-4 font-bold text-gray-900">{formatCFA(total)}</td>
                          <td className="px-6 py-4">
                            <span className={cn("px-3 py-1.5 rounded-full text-xs font-semibold inline-block", config.className)}>
                              {config.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredClients.length === 0 && filteredInvoices.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-50 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Aucun résultat</h3>
              <p className="text-gray-500">Nous n'avons trouvé aucun client ou facture pour &quot;{query}&quot;.</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
