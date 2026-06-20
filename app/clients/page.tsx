'use client';

import { useState } from 'react';
import { useDataStore, Client } from '@/store/data-store';
import { Plus, Search, MoreHorizontal, Mail, Phone, MapPin, Edit2, Trash2, ChevronUp, ChevronDown, Users } from 'lucide-react';
import { ClientModal } from '@/components/clients/client-modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useTranslation } from '@/hooks/use-translation';

export default function ClientsPage() {
  const clients = useDataStore((state) => state.clients);
  const deleteClient = useDataStore((state) => state.deleteClient);
  const { t } = useTranslation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'email'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Delete modal state
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const valA = a[sortField]?.toLowerCase() || '';
    const valB = b[sortField]?.toLowerCase() || '';
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: 'name' | 'email') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setClientToDelete(id);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      deleteClient(clientToDelete);
      setClientToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-slate-800 tracking-tight">{t('clients.title')}</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 sm:mt-2 font-light">{t('clients.subtitle')}</p>
        </div>
        
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95 border border-slate-800"
        >
          <Plus className="w-5 h-5" />
          {t('clients.create')}
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors duration-300" />
          <input
            type="text"
            placeholder={t('common.search')}
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
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    {t('common.client')}
                    {sortField === 'name' && (
                      sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-1">
                    {t('clients.contact')}
                    {sortField === 'email' && (
                      sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 font-medium">{t('clients.address')}</th>
                <th className="px-6 py-4 font-medium text-right rounded-tr-3xl">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="group hover:bg-gray-50/50 transition-all duration-300">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-[15px] group-hover:text-primary transition-colors">{client.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {client.address ? (
                        <div className="flex items-start gap-2 max-w-xs">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <span className="truncate" title={client.address}>{client.address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">{t('clients.notProvided')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                          onClick={() => handleEdit(client)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-300 active:scale-90"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300 active:scale-90"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="text-gray-500 max-w-sm mx-auto">
                        {searchTerm ? (
                          <p>Aucun client trouvé pour "{searchTerm}".</p>
                        ) : (
                          <p>Vous n'avez pas encore de clients enregistrés. Commencez par ajouter un nouveau client.</p>
                        )}
                      </div>
                      {!searchTerm && (
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="mt-2 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-md active:scale-[0.98]"
                        >
                          <Plus className="w-4 h-4" />
                          Nouveau Client
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        client={editingClient} 
      />

      <ConfirmModal
        isOpen={!!clientToDelete}
        title={t('clients.deleteTitle')}
        message={t('clients.deleteMessage')}
        onConfirm={confirmDelete}
        onCancel={() => setClientToDelete(null)}
      />
    </div>
  );
}
