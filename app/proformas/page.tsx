'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDataStore, Invoice, InvoiceStatus } from '@/store/data-store';
import { Plus, Search, MoreHorizontal, ChevronUp, ChevronDown, FileText, Send, CheckCircle2, AlertCircle, Download, Eye, FileArchive } from 'lucide-react';
import { calculateInvoice, formatCFA, formatDate, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import { generateWordInvoice } from '@/lib/word-generator';
import { generateProTemplateAsBase64 } from '@/lib/template-generator';

export default function ProformasPage() {
  const router = useRouter();
  const invoices = useDataStore((state) => state.invoices);
  const clients = useDataStore((state) => state.clients);
  const settings = useDataStore((state) => state.settings);
  const { t } = useTranslation();
  
  const statusConfig = useMemo(() => ({
    draft: { label: t('status.draft'), className: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText },
    sent: { label: t('status.sent'), className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
    accepted: { label: t('status.accepted'), className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
    rejected: { label: t('status.rejected'), className: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
    invoiced: { label: t('status.invoiced'), className: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle2 },
  }), [t]);

  const filterTabs = useMemo(() => [
    { id: 'all', label: t('common.all') },
    { id: 'draft', label: t('status.draft') },
    { id: 'sent', label: t('status.sent') },
    { id: 'accepted', label: t('status.accepted') },
    { id: 'rejected', label: t('status.rejected') },
    { id: 'invoiced', label: t('status.invoiced') },
  ], [t]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Sorting state
  const [sortField, setSortField] = useState<'id' | 'issueDate' | 'total'>('issueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filteredProformas = invoices.filter((invoice) => {
    // Only proformas
    if (invoice.type !== 'proforma') return false;

    // Statut filter
    if (activeFilter !== 'all' && invoice.status !== activeFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const client = clients.find(c => c.id === invoice.clientId);
      const matchesClient = client?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesId = invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesClient || matchesId;
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
    if (sortField === 'issueDate') {
      const valA = new Date(a.issueDate).getTime();
      const valB = new Date(b.issueDate).getTime();
      return sortDir === 'asc' ? valA - valB : valB - valA;
    }
    if (sortField === 'total') {
      const valA = calculateInvoice(a.lines).total;
      const valB = calculateInvoice(b.lines).total;
      return sortDir === 'asc' ? valA - valB : valB - valA;
    }
    return 0;
  });

  const handleSort = (field: 'id' | 'issueDate' | 'total') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredProformas.length / itemsPerPage);
  const paginatedProformas = filteredProformas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page to 1 when filters or search change
  const handleFilterChange = (id: string) => {
    setActiveFilter(id);
    setCurrentPage(1);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const currentPlan = settings?.plan || (settings?.isPremium ? 'premium' : 'free');

  if (currentPlan === 'free') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <FileArchive className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Passez à la vitesse supérieure</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          La gestion des proformas est disponible à partir du plan Intermédiaire. Améliorez votre compte pour créer des devis professionnels.
        </p>
        <Link href="/settings" className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all duration-300">
          Voir les forfaits
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Header Minimaliste */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 sm:pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-slate-800 tracking-tight">{t('proformas.title')}</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 sm:mt-2 font-light">{t('proformas.subtitle')}</p>
        </div>
        
        <Link 
          href="/proformas/new"
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95 w-fit border border-slate-800"
        >
          <Plus className="w-5 h-5" />
          {t('proformas.create')}
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 hide-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id)}
              className={cn(
                "px-5 py-2 rounded-xl text-[14px] font-light transition-all duration-300 whitespace-nowrap active:scale-95 border",
                activeFilter === tab.id
                  ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full xl:max-w-xs group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition-colors duration-300" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 outline-none transition-all duration-300 text-[14px] font-light text-slate-800"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 font-light">
              <tr>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    {t('proformas.number')}
                    {sortField === 'id' && (
                      sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">{t('common.client')}</th>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                  onClick={() => handleSort('issueDate')}
                >
                  <div className="flex items-center gap-1">
                    {t('common.date')}
                    {sortField === 'issueDate' && (
                      sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">{t('invoices.dueDate')}</th>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center gap-1">
                    {t('form.totalTtc')}
                    {sortField === 'total' && (
                      sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">{t('common.status')}</th>
                <th className="px-6 py-4 font-medium text-right whitespace-nowrap">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProformas.length > 0 ? (
                paginatedProformas.map((proforma) => {
                  const client = clients.find(c => c.id === proforma.clientId);
                  const { total } = calculateInvoice(proforma.lines);
                  const config = statusConfig[proforma.status as keyof typeof statusConfig] || statusConfig.draft;

                  return (
                    <tr 
                      key={proforma.id} 
                      className="group hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
                      onClick={() => router.push(`/invoices/${proforma.id}`)}
                    >
                      <td className="px-6 py-4 font-light text-slate-800 whitespace-nowrap">{proforma.number || proforma.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 whitespace-nowrap">{client?.name || 'Client Inconnu'}</div>
                        <div className="text-slate-500 text-xs font-light whitespace-nowrap">{client?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-light whitespace-nowrap">
                        {formatDate(proforma.issueDate)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-light whitespace-nowrap">
                        {formatDate(proforma.dueDate)}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCFA(total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium border inline-block whitespace-nowrap", config.className)}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                            title="Télécharger Modèle Word"
                            onClick={async (e) => {
                              e.stopPropagation();
                              let template = settings.customWordTemplateProforma;
                              if (!template) {
                                template = await generateProTemplateAsBase64('PROFORMA', settings.logo);
                              }
                              generateWordInvoice(template as string, proforma, client!, settings);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-all duration-200"
                            title="Voir"
                            onClick={(e) => {
                              e.stopPropagation(); // prevent row click
                              router.push(`/invoices/${proforma.id}`);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500 font-light">
                    Aucune proforma trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-sm font-light shadow-sm"
          >
            {t('common.back')}
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "w-10 h-10 rounded-xl text-sm font-light transition-colors shadow-sm",
                  currentPage === i + 1 
                    ? "bg-slate-800 text-white border border-slate-800" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-sm font-light shadow-sm"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
