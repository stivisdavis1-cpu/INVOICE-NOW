'use client';

import { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone, Receipt } from 'lucide-react';
import { useDataStore, PaymentMethod } from '@/store/data-store';
import { formatCFA, cn } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  balanceDue: number;
}

const paymentMethods: { id: PaymentMethod; label: string; icon: any }[] = [
  { id: 'transfer', label: 'Virement', icon: Receipt },
  { id: 'mobile', label: 'Mobile Money', icon: Smartphone },
  { id: 'cash', label: 'Espèces', icon: Banknote },
  { id: 'card', label: 'Carte', icon: CreditCard },
];

export function PaymentModal({ isOpen, onClose, invoiceId, balanceDue }: PaymentModalProps) {
  const addPayment = useDataStore((state) => state.addPayment);

  const [amount, setAmount] = useState<number | ''>(balanceDue);
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [reference, setReference] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    addPayment({
      invoiceId,
      amount: Number(amount),
      date,
      method,
      reference: reference.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Saisir un paiement</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Montant (FCFA) *</label>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:border-primary focus:ring-primary/20 outline-none transition-all duration-300 text-lg font-semibold text-gray-900"
              placeholder="Ex: 50000"
            />
            <p className="text-xs text-gray-500 mt-2">Reste à payer : <span className="font-semibold text-gray-900">{formatCFA(balanceDue)}</span></p>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Date du paiement *</label>
            <DatePicker 
              value={date}
              onChange={setDate}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-2">Méthode de paiement *</label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200",
                      method === m.id 
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" 
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Référence (Optionnel)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:border-primary focus:ring-primary/20 outline-none transition-all duration-300 text-[15px]"
              placeholder="N° chèque, ID transaction..."
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!amount || amount <= 0}
              className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-full transition-all shadow-[0_8px_20px_rgba(45,139,111,0.25)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
