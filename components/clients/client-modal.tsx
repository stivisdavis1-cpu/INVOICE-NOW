'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { useDataStore, Client } from '@/store/data-store';
import { cn } from '@/lib/utils';

const clientSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export function ClientModal({ isOpen, onClose, client }: ClientModalProps) {
  const addClient = useDataStore((state) => state.addClient);
  const updateClient = useDataStore((state) => state.updateClient);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
    }
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        address: client.address || '',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        address: '',
      });
    }
  }, [client, reset, isOpen]);

  const onSubmit = (data: ClientFormValues) => {
    if (client) {
      updateClient(client.id, data);
    } else {
      addClient(data);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-300">
        <div className="p-5 sm:p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {client ? 'Modifier le client' : 'Nouveau client'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-300 active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Nom complet ou Entreprise *</label>
              <input
                {...register('name')}
                className={cn(
                  "w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-4 outline-none transition-all duration-300",
                  errors.name ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 focus:border-primary focus:ring-primary/20"
                )}
                placeholder="Ex: IZI Tech"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Adresse Email *</label>
              <input
                {...register('email')}
                type="email"
                className={cn(
                  "w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-4 outline-none transition-all duration-300",
                  errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 focus:border-primary focus:ring-primary/20"
                )}
                placeholder="contact@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Téléphone</label>
              <input
                {...register('phone')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300"
                placeholder="+221 XX XXX XX XX"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Adresse complète</label>
              <textarea
                {...register('address')}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300 resize-none"
                placeholder="123 Rue de la Paix..."
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-3 rounded-full font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-300 active:scale-[0.98]"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-5 py-3 rounded-full font-medium text-white bg-primary hover:bg-primary-dark shadow-[0_8px_20px_rgba(45,139,111,0.25)] hover:shadow-[0_10px_25px_rgba(45,139,111,0.35)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {client ? 'Enregistrer' : 'Créer client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
