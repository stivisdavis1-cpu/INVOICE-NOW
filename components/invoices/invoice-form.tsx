'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useDataStore, Invoice, InvoiceStatus, LineType, InvoiceLine, DocumentType } from '@/store/data-store';
import { Plus, Trash2, ArrowLeft, Save, Send } from 'lucide-react';
import { formatCFA, TVA_RATE, cn, calculateInvoice } from '@/lib/utils';
import Link from 'next/link';
import { InvoicePreview } from '@/components/invoices/invoice-preview';
import { DatePicker } from '@/components/ui/date-picker';
import { Controller } from 'react-hook-form';
import { useTranslation } from '@/hooks/use-translation';
import { useUIStore } from '@/store/ui-store';

const invoiceLineSchema = z.object({
  id: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  deliverables: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  isForfait: z.boolean().nullable().optional(),
  description: z.string().min(1, 'La description est requise'),
  quantity: z.coerce.number().min(0, 'Min 0'),
  unitPrice: z.coerce.number().min(0, 'Min 0'),
});

const invoiceSchema = z.object({
  number: z.string().nullable().optional(),
  clientId: z.string().min(1, 'Le client est requis'),
  type: z.string().nullable().optional(),
  issueDate: z.string().min(1, 'La date est requise'),
  dueDate: z.string().min(1, 'L\'échéance est requise'),
  lines: z.array(invoiceLineSchema).min(1, 'Au moins une ligne est requise'),
  metadata: z.record(z.string(), z.any()).optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  initialData?: Invoice;
  fixedType?: 'invoice' | 'proforma';
}

export function InvoiceForm({ initialData, fixedType }: InvoiceFormProps) {
  const router = useRouter();
  const clients = useDataStore((state) => state.clients);
  const invoices = useDataStore((state) => state.invoices);
  const workflows = useDataStore((state) => state.workflows);
  const addInvoice = useDataStore((state) => state.addInvoice);
  const updateInvoice = useDataStore((state) => state.updateInvoice);
  const addNotification = useDataStore((state) => state.addNotification);
  const settings = useDataStore((state) => state.settings);
  
  const [isAdvancedMode, setIsAdvancedMode] = useState(
    initialData?.lines.some(l => l.type && l.type !== 'item') || false
  );
  const [docType, setDocType] = useState<string>(fixedType || initialData?.type || 'invoice');
  const { setSidebarCollapsed } = useUIStore();

  useEffect(() => {
    // Replier le menu automatiquement pour avoir plus de place
    setSidebarCollapsed(true);
    
    // Optionnel : on pourrait le ré-ouvrir en quittant
    return () => setSidebarCollapsed(false);
  }, [setSidebarCollapsed]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(initialData?.workflowId || '');

  const { t } = useTranslation();

  // Default dates
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const defaultDueDate = nextMonth.toISOString().split('T')[0];

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormValues>({
    // @ts-ignore
    resolver: zodResolver(invoiceSchema),
    mode: 'onChange',
    defaultValues: initialData ? {
      number: initialData.number || '',
      clientId: initialData.clientId,
      type: initialData.type || 'invoice',
      issueDate: initialData.issueDate,
      dueDate: initialData.dueDate,
      lines: initialData.lines,
      metadata: initialData.metadata || {},
    } : {
      number: '',
      clientId: '',
      type: fixedType || 'invoice',
      issueDate: today,
      dueDate: defaultDueDate,
      lines: [{ description: '', quantity: 1, unitPrice: 0, type: 'item' as LineType }],
      metadata: {
        tvaRate: settings.defaultTva,
        companyName: settings.companyName,
        address: settings.address,
        ninea: settings.ninea,
        rccm: settings.rccm,
        footerMentions: settings.footerMentions,
      },
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const watchMetadata = watch('metadata');
  const watchClientId = watch('clientId');
  
  const selectedClient = clients.find(c => c.id === watchClientId) || null;
  const watchAll = watch();

  const [hasSyncedSettings, setHasSyncedSettings] = useState(false);

  useEffect(() => {
    // Si on crée une nouvelle facture (pas de données initiales)
    // et que le store a bien chargé l'entreprise (companyName n'est pas vide)
    // alors on met à jour les valeurs par défaut du formulaire
    if (!initialData && !hasSyncedSettings && settings.companyName) {
      setValue('metadata.companyName', settings.companyName);
      setValue('metadata.address', settings.address || '');
      setValue('metadata.ninea', settings.ninea || '');
      setValue('metadata.rccm', settings.rccm || '');
      setValue('metadata.footerMentions', settings.footerMentions || '');
      setValue('metadata.tvaRate', settings.defaultTva ?? 18);
      setHasSyncedSettings(true);
    }
  }, [settings, initialData, hasSyncedSettings, setValue]);

  // @ts-ignore
  const { subtotal, tva, total, discountAmount } = calculateInvoice(watchAll.lines as any || [], watchAll.metadata);

  const onSave = async (data: InvoiceFormValues, status: InvoiceStatus) => {
    // Generate IDs for new lines if missing
    const linesWithIds = data.lines.map(line => ({
      ...line,
      id: line.id || `LINE-${Math.random().toString(36).substr(2, 9)}`
    })) as InvoiceLine[];

    try {
      if (initialData) {
        await updateInvoice(initialData.id, {
          ...(data as any),

          type: docType as any as DocumentType,
          status,
          lines: linesWithIds
        });
        router.push(`/invoices/${initialData.id}`);
      } else {
        const prefix = docType === 'proforma' ? 'PRO' : 'FAC';
        const idPrefix = docType === 'proforma' ? 'PROF' : 'INV';
        const defaultNumber = `${prefix}-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const finalNumber = data.number || defaultNumber;

        const newInvoice = {
          ...data,
          type: docType as any as DocumentType,
          number: finalNumber,
          status,
          lines: linesWithIds,
          companyId: useDataStore.getState().activeCompanyId || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const realId = await addInvoice(newInvoice as any as Invoice);
        if (realId) {
          router.push(`/invoices/${realId}`);
        } else {
          router.push('/invoices');
        }
      }
    } catch (e: any) {
      console.error(e);
      alert("Erreur de sauvegarde : " + (e.message || JSON.stringify(e)));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] lg:h-screen bg-gray-50 lg:overflow-hidden animate-in fade-in duration-500 print:block print:h-auto print:overflow-visible print:bg-white">
      
      {/* Left Panel: Form */}
      <form className="w-full lg:w-[450px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col lg:h-full relative z-10 shadow-xl print:hidden font-[Gill_Sans_MT,Gill_Sans,sans-serif]">
        
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shrink-0">
          <Link 
            href={docType === 'proforma' ? "/proformas" : "/invoices"} 
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <button 
            type="button"
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className="text-[11px] font-medium px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
          >
            {isAdvancedMode ? 'Mode Simple' : 'Mode Avancé'}
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 lg:overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          <div className="mb-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {initialData ? (docType === 'proforma' ? 'Éditer le proforma' : 'Éditer la facture') : (
                docType === 'proforma' ? 'Nouveau proforma' : 'Nouvelle facture'
              )}
            </h1>
          </div>

          {/* Client & Dates */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('form.client')} <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  {...register('clientId')}
                  className={cn(
                    "w-full bg-gray-50 border rounded-sm px-2.5 py-1.5 outline-none text-[11px] font-medium text-gray-900 transition-all appearance-none cursor-pointer",
                    errors.clientId ? "border-red-300 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500/20" : "border-gray-300 hover:border-gray-400 focus:bg-white focus:border-gray-800 focus:ring-1 focus:ring-gray-800/20"
                  )}
                >
                  <option value="" disabled>Sélectionner un client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              {errors.clientId && <p className="text-red-500 text-[10px] mt-1">{errors.clientId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Numéro
                </label>
                <input
                  {...register('number')}
                  placeholder={docType === 'proforma' ? 'PRO-...' : 'FAC-...'}
                  className="w-full bg-gray-50 border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none text-[11px] font-medium text-gray-900 transition-all placeholder:text-gray-400 focus:bg-white focus:border-gray-800 focus:ring-1 focus:ring-gray-800/20 hover:border-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('form.issueDate')} <span className="text-red-400">*</span></label>
                <Controller
                  control={control}
                  name="issueDate"
                  render={({ field }) => (
                    <DatePicker 
                      value={field.value} 
                      onChange={field.onChange} 
                      hasError={!!errors.issueDate}
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('form.dueDate')} <span className="text-red-400">*</span></label>
                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field }) => (
                    <DatePicker 
                      value={field.value} 
                      onChange={field.onChange} 
                      hasError={!!errors.dueDate}
                    />
                  )}
                />
              </div>
            </div>
            
            {settings.enableWorkflows && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Circuit de validation
                </label>
                <div className="relative">
                  <select
                    value={selectedWorkflowId}
                    onChange={(e) => setSelectedWorkflowId(e.target.value)}
                    disabled={!!initialData}
                    className="w-full bg-gray-100 border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none text-[11px] font-medium text-gray-800 transition-all appearance-none cursor-pointer focus:border-gray-800 focus:ring-1 focus:ring-gray-800/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">Aucun (Normal)</option>
                    {workflows
                      .filter(wf => wf.documentType === docType || wf.documentType === 'both')
                      .map(wf => (
                      <option key={wf.id} value={wf.id}>{wf.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary/60">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          {isAdvancedMode && (
            <div className="pt-4 border-t border-gray-100">
              <h2 className="text-[11px] font-bold text-gray-800 tracking-tight mb-3 uppercase">Paramètres Avancés</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Titre du projet</label>
                  <input
                    {...register(`metadata.projectTitle`)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 outline-none text-sm focus:border-primary focus:bg-white transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Remise Globale (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`metadata.discountRate`, { valueAsNumber: true })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-sm px-1.5 py-1 outline-none text-[11px] focus:border-gray-800 focus:ring-1 focus:ring-gray-800/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">TVA (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`metadata.tvaRate`, { valueAsNumber: true })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-sm px-1.5 py-1 outline-none text-[11px] focus:border-gray-800 focus:ring-1 focus:ring-gray-800/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Informations de l'émetteur</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nom de l'entreprise</label>
                      <input
                        {...register(`metadata.companyName`)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-sm px-1.5 py-1 outline-none text-[11px] focus:border-gray-800 focus:ring-1 focus:ring-gray-800/20 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Adresse</label>
                      <textarea
                        {...register(`metadata.address`)}
                        rows={2}
                        className="w-full bg-gray-50 border border-gray-200 rounded-sm px-1.5 py-1 outline-none text-[11px] focus:border-gray-800 focus:ring-1 focus:ring-gray-800/20 focus:bg-white transition-all custom-scrollbar resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{settings.nineaLabel || 'NINEA'}</label>
                        <input
                          {...register(`metadata.ninea`)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-sm px-1.5 py-1 outline-none text-[11px] focus:border-gray-800 focus:ring-1 focus:ring-gray-800/20 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{settings.rccmLabel || 'RCCM'}</label>
                        <input
                          {...register(`metadata.rccm`)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-sm px-1.5 py-1 outline-none text-[11px] focus:border-gray-800 focus:ring-1 focus:ring-gray-800/20 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Mentions de pied de page</label>
                      <textarea
                        {...register(`metadata.footerMentions`)}
                        rows={2}
                        className="w-full bg-gray-50 border border-gray-200 rounded-sm px-1.5 py-1 outline-none text-[11px] focus:border-gray-800 focus:ring-1 focus:ring-gray-800/20 focus:bg-white transition-all custom-scrollbar resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lines Items */}
          <div className="pt-4 border-t border-gray-100">
            <h2 className="text-[11px] font-bold text-gray-800 tracking-tight mb-3 uppercase">Lignes</h2>

            <div className="space-y-2.5">
              {fields.map((field, index) => {
                const lineType = watchAll.lines[index]?.type || 'item';
                const isSection = lineType === 'section';
                const isDiscount = lineType === 'discount';
                
                return (
                  <div key={field.id} className={cn("group relative bg-gray-50 border border-gray-200 rounded-lg p-3 transition-all",
                    isSection && "bg-gray-800 text-white border-gray-800 mt-4",
                    isDiscount && "bg-orange-50 border-orange-200",
                    watchAll.lines[index]?.isForfait && "bg-emerald-50/50 border-emerald-200"
                  )}>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className={cn("absolute -left-2.5 -top-2.5 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10",
                          isSection && "text-gray-500 hover:text-red-400"
                        )}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="flex flex-col gap-2.5">
                      <input
                        {...register(`lines.${index}.description`)}
                        className={cn("w-full bg-transparent outline-none text-[11px] transition-colors placeholder-gray-400",
                          isSection ? "font-bold text-white placeholder-gray-400" :
                          isDiscount ? "font-medium text-orange-800" : "font-medium text-gray-900"
                        )}
                        placeholder={isSection ? 'TITRE DE SECTION' : "Description..."}
                      />

                      {!isSection && lineType !== 'text' && (
                        <div className="flex items-center gap-2">
                          {!isDiscount && (
                            <div className="w-16">
                              <input
                                type="number"
                                {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                                disabled={!!watchAll.lines[index]?.isForfait}
                                className="w-full bg-white border border-gray-300 rounded-sm px-1.5 py-1 focus:border-gray-800 focus:ring-1 focus:ring-gray-800/20 outline-none text-[11px] text-gray-900 disabled:opacity-50"
                                placeholder="Qté"
                              />
                            </div>
                          )}
                          <div className="w-24">
                            <input
                              type="number"
                              {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                              className={cn("w-full bg-white border rounded-sm px-1.5 py-1 outline-none text-[11px] text-right focus:border-gray-800 focus:ring-1 focus:ring-gray-800/20",
                                isDiscount ? "border-orange-200 text-orange-700" : "border-gray-300 text-gray-900"
                              )}
                              placeholder="P.U."
                            />
                          </div>
                          <div className={cn("flex-1 text-sm text-right truncate font-semibold",
                            isDiscount ? "text-orange-600" : "text-gray-900"
                          )}>
                            {isDiscount ? '-' : ''}
                            {formatCFA(watchAll.lines[index]?.isForfait 
                              ? (watchAll.lines[index]?.unitPrice || 0)
                              : ((watchAll.lines[index]?.quantity || 0) * (watchAll.lines[index]?.unitPrice || 0)))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0, type: 'item' })}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Ligne
              </button>
              
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0, type: 'item', isForfait: true })}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Forfait
              </button>
              
              {isAdvancedMode && (
                <>
                  <button
                    type="button"
                    onClick={() => append({ description: '', quantity: 0, unitPrice: 0, type: 'section' })}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
                  >
                    + Section
                  </button>
                  <button
                    type="button"
                    onClick={() => append({ description: '', quantity: 1, unitPrice: 0, type: 'discount' })}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 hover:bg-orange-50 px-3 py-2 rounded-md transition-colors"
                  >
                    + Remise
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-gray-900 rounded-xl p-5 text-white mt-6 shadow-lg">
            <div className="space-y-1.5 text-sm text-gray-400 mb-3">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{formatCFA(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-orange-400">
                  <span>Remise Globale</span>
                  <span>- {formatCFA(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>TVA ({watchAll.metadata?.tvaRate ?? 18}%)</span>
                <span>{formatCFA(tva)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-gray-700 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">Total TTC</span>
              <span className="text-2xl font-bold">{formatCFA(total)}</span>
            </div>
          </div>
          
        </div>

        {/* Fixed Footer */}
        <div className="p-4 bg-white border-t border-gray-200 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-20 sticky bottom-0 lg:relative">
           <button 
            onClick={handleSubmit(
              (data) => onSave(data as unknown as InvoiceFormValues, initialData ? initialData.status : 'sent'),
              (errors) => alert("Le formulaire contient des erreurs : " + JSON.stringify(errors))
            )}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-[24px] shadow-sm hover:shadow-[0_12px_30px_rgba(45,139,111,0.2)] hover:-translate-y-1 transition-all duration-300 ease-out active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
             <Save className="w-5 h-5" />
             {initialData ? 'Enregistrer les modifications' : 'Créer le document'}
           </button>
        </div>
      </form>

      {/* Right Panel: Live Preview (DocuWare style) */}
      <div className="flex-1 bg-[#e4e4e7] lg:overflow-y-auto overflow-x-auto p-4 sm:p-10 flex items-start justify-center lg:justify-center relative custom-scrollbar print:block print:p-0 print:overflow-visible print:bg-white">
        <InvoicePreview 
          data={watchAll}
          client={selectedClient}
          settings={settings}
          subtotal={subtotal}
          tva={tva}
          total={total}
          docType={docType}
        />
      </div>
    </div>
  );
}
