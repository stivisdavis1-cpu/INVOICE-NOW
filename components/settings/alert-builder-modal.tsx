import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Info, Bell, Mail, Zap } from 'lucide-react';
import { AlertConfig } from '@/store/data-store';
import { cn } from '@/lib/utils';

interface AlertBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alert: AlertConfig) => void;
  initialAlert?: AlertConfig | null;
}

export function AlertBuilderModal({ isOpen, onClose, onSave, initialAlert }: AlertBuilderModalProps) {
  const [alert, setAlert] = useState<AlertConfig>({
    id: `custom-alert-${Date.now()}`,
    name: '',
    description: '',
    type: 'email',
    triggerEvent: 'before_due',
    triggerDaysOffset: 0,
    isActive: true,
    subjectTemplate: '',
    contentTemplate: '',
    isSystem: false
  });

  useEffect(() => {
    if (initialAlert) {
      setAlert(initialAlert);
    } else {
      setAlert({
        id: `custom-alert-${Date.now()}`,
        name: '',
        description: '',
        type: 'email',
        triggerEvent: 'before_due',
        triggerDaysOffset: 0,
        isActive: true,
        subjectTemplate: '',
        contentTemplate: '',
        isSystem: false
      });
    }
  }, [initialAlert, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(alert);
  };

  const isEmail = alert.type === 'email' || alert.type === 'both';

  const insertVariable = (variable: string) => {
    setAlert(prev => ({
      ...prev,
      contentTemplate: prev.contentTemplate + variable
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {initialAlert ? 'Éditer l\'alerte' : 'Nouvelle alerte personnalisée'}
              </h2>
              <p className="text-sm text-slate-500">Configurez le déclencheur et le contenu du message.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="alert-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Infos de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom de l'alerte</label>
                <input
                  type="text"
                  required
                  value={alert.name}
                  onChange={e => setAlert({...alert, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Ex: Relance J-3"
                  readOnly={alert.isSystem}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type de canal</label>
                <select
                  value={alert.type}
                  onChange={e => setAlert({...alert, type: e.target.value as any})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="email">Email uniquement</option>
                  <option value="in_app">Notification In-App</option>
                  <option value="both">Email + In-App</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (Interne)</label>
                <input
                  type="text"
                  value={alert.description}
                  onChange={e => setAlert({...alert, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Courte description de l'objectif de cette alerte"
                />
              </div>
            </div>

            {/* Déclencheur */}
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-2 text-blue-800 font-semibold mb-3">
                <Zap className="w-4 h-4" />
                Déclencheur (Trigger)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900/70 mb-1.5">Évènement</label>
                  <select
                    value={alert.triggerEvent}
                    onChange={e => setAlert({...alert, triggerEvent: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    disabled={alert.isSystem}
                  >
                    <option value="before_due">Avant échéance</option>
                    <option value="after_due">Après échéance (Retard)</option>
                    <option value="status_change">Changement de statut</option>
                    <option value="monthly">Mensuel</option>
                    <option value="custom">Personnalisé</option>
                  </select>
                </div>
                {(alert.triggerEvent === 'before_due' || alert.triggerEvent === 'after_due') && (
                  <div>
                    <label className="block text-sm font-medium text-blue-900/70 mb-1.5">Décalage (en jours)</label>
                    <input
                      type="number"
                      value={Math.abs(alert.triggerDaysOffset || 0)}
                      onChange={e => setAlert({
                        ...alert, 
                        triggerDaysOffset: alert.triggerEvent === 'before_due' ? -Math.abs(Number(e.target.value)) : Math.abs(Number(e.target.value))
                      })}
                      className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      disabled={alert.isSystem}
                      min="0"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Contenu */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                Contenu du message
              </h3>
              
              {isEmail && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Objet de l'email</label>
                  <input
                    type="text"
                    required
                    value={alert.subjectTemplate || ''}
                    onChange={e => setAlert({...alert, subjectTemplate: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                    placeholder="Ex: Rappel de facture {invoiceId}"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Corps du message</label>
                
                {/* Variable toolbar */}
                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 border border-slate-200 rounded-t-xl border-b-0">
                  <span className="text-xs font-semibold text-slate-500 px-2 py-1">Variables :</span>
                  {['{clientName}', '{invoiceId}', '{dueDate}', '{totalAmount}', '{companyName}'].map(variable => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => insertVariable(variable)}
                      className="text-xs bg-white border border-slate-200 hover:border-primary hover:text-primary px-2 py-1 rounded transition-colors font-mono"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
                
                <textarea
                  required
                  value={alert.contentTemplate}
                  onChange={e => setAlert({...alert, contentTemplate: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-b-xl rounded-t-none focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[150px] resize-y"
                  placeholder="Tapez votre message ici..."
                />
              </div>
            </div>

            {alert.isSystem && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200/50">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">Il s'agit d'une alerte système. Vous pouvez modifier son contenu et son type de notification, mais son déclencheur et son nom sont verrouillés.</p>
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={alert.isActive}
              onChange={e => setAlert({...alert, isActive: e.target.checked})}
              className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
              Alerte active
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="alert-form"
              className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
