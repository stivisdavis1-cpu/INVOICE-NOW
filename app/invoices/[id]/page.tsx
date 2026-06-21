'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDataStore, InvoiceStatus } from '@/store/data-store';
import { ArrowLeft, Printer, Download, Edit2, Trash2, Send, CheckCircle, Clock, FileText, CheckCircle2, AlertCircle, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';
import { formatCFA, formatDate, calculateInvoice, cn, injectSectionSubtotals, getTvaRate } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { PaymentModal } from '@/components/invoices/payment-modal';
import { useState } from 'react';
import { generateWordInvoice } from '@/lib/word-generator';
import { generateProTemplateAsBase64 } from '@/lib/template-generator';


export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const invoices = useDataStore((state) => state.invoices);
  const clients = useDataStore((state) => state.clients);
  const paymentsStore = useDataStore((state) => state.payments);
  const settings = useDataStore((state) => state.settings);
  const updateInvoiceStatus = useDataStore((state) => state.updateInvoiceStatus);
  const deleteInvoice = useDataStore((state) => state.deleteInvoice);
  const toggleInvoiceLock = useDataStore((state) => state.toggleInvoiceLock);
  const workflows = useDataStore((state) => state.workflows);
  const employees = useDataStore((state) => state.employees);
  const activeEmployeeId = useDataStore((state) => state.activeEmployeeId);
  const updateInvoice = useDataStore((state) => state.updateInvoice);
  const addInvoice = useDataStore((state) => state.addInvoice);
  const addNotification = useDataStore((state) => state.addNotification);

  const invoice = invoices.find(inv => inv.id === id);
  const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  if (!invoice || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-gray-500">Facture introuvable.</p>
        <Link href="/invoices" className="text-primary hover:underline">
          <ArrowLeft className="w-4 h-4 inline mr-2" />
          Retour aux factures
        </Link>
      </div>
    );
  }

  const { subtotal, tva, total } = calculateInvoice(invoice.lines, invoice.metadata);
  const invoicePayments = paymentsStore.filter(p => p.invoiceId === invoice.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, total - totalPaid);

  const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
    draft: { label: 'Brouillon', icon: FileText, className: 'bg-gray-100 text-gray-700 border-gray-200' },
    sent: { label: 'Envoyée', icon: Send, className: 'bg-blue-50 text-blue-700 border-blue-200' },
    partially_paid: { label: 'Partiellement payée', icon: Clock, className: 'bg-orange-50 text-orange-700 border-orange-200' },
    paid: { label: 'Payée', icon: CheckCircle2, className: 'bg-paid/10 text-paid border-paid/20' },
    late: { label: 'En retard', icon: AlertCircle, className: 'bg-late/10 text-late border-late/20' },
    accepted: { label: 'Acceptée', icon: CheckCircle, className: 'bg-green-50 text-green-700 border-green-200' },
    rejected: { label: 'Refusée', icon: AlertCircle, className: 'bg-red-50 text-red-700 border-red-200' },
    invoiced: { label: 'Facturée', icon: CheckCircle2, className: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  const config = statusConfig[invoice.status] || statusConfig.draft;
  const StatusIcon = config.icon;
  const isProforma = invoice.type === 'proforma';

  const activeEmployee = employees.find(e => e.id === activeEmployeeId);
  const canLock = activeEmployee && ['admin', 'manager'].includes(activeEmployee.role);

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteInvoice(id);
    router.push(isProforma ? '/proformas' : '/invoices');
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateInvoiceStatus(id, e.target.value as InvoiceStatus);
  };

  const handleConvertToInvoice = () => {
    const id = `INV-${Date.now()}`;
    const number = `FAC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const newInvoice = {
      ...invoice,
      id,
      number,
      type: 'invoice' as const,
      status: 'draft' as const,
      proformaId: invoice.id,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +30 days
    };
    addInvoice(newInvoice as any);
    updateInvoiceStatus(invoice.id, 'invoiced');
    router.push(`/invoices/${newInvoice.id}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      {/* Workflow Banner */}
      {invoice.workflowId && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl shadow-sm p-5 flex items-center justify-between print:hidden">
          <div>
            <h3 className="text-primary font-bold">Workflow en cours</h3>
            {(() => {
              const wf = workflows.find(w => w.id === invoice.workflowId);
              const step = wf?.steps.find(s => s.id === invoice.currentStepId);
              const activeEmployee = employees.find(e => e.id === activeEmployeeId);
              const isAllowed = step && activeEmployee && (step.requiredRole === 'any' || step.requiredRole === activeEmployee.role);
              
              if (!wf || !step) return <p className="text-sm text-primary/80">Workflow terminé ou introuvable.</p>;

              return (
                <p className="text-sm text-primary/80 mt-1">
                  Étape actuelle : <span className="font-semibold">{step.name}</span> 
                  (Requis : {step.requiredRole === 'any' ? "N'importe qui" : (employees.find(e => e.id === step.requiredRole)?.name || step.requiredRole)})
                </p>
              );
            })()}
          </div>
          
          {(() => {
            const wf = workflows.find(w => w.id === invoice.workflowId);
            const stepIndex = wf?.steps.findIndex(s => s.id === invoice.currentStepId) ?? -1;
            const step = wf?.steps[stepIndex];
            const activeEmployee = employees.find(e => e.id === activeEmployeeId);
            const isAllowed = step && activeEmployee && (step.requiredRole === 'any' || step.requiredRole === activeEmployee.id);

            if (!wf || !step || !isAllowed) return null;

            return (
              <button
                onClick={() => {
                  const nextStep = wf.steps[stepIndex + 1];
                  if (nextStep) {
                    updateInvoice(invoice.id, { currentStepId: nextStep.id });
                    addNotification({
                      title: `Document en attente de validation`,
                      message: `Le document ${invoice.number} nécessite votre validation (Étape: ${nextStep.name}).`,
                      type: 'warning',
                      targetEmployeeId: nextStep.requiredRole !== 'any' ? nextStep.requiredRole : undefined,
                      targetRole: nextStep.requiredRole === 'any' ? 'any' : undefined,
                      link: `/invoices/${invoice.id}`
                    });
                  } else {
                    // Workflow finished
                    updateInvoice(invoice.id, { currentStepId: undefined, workflowId: undefined });
                    updateInvoiceStatus(invoice.id, 'sent');
                    addNotification({
                      title: `Document validé`,
                      message: `Votre document ${invoice.number} a été validé avec succès par l'équipe.`,
                      type: 'success',
                      targetEmployeeId: invoice.assigneeId || undefined,
                      targetRole: !invoice.assigneeId ? 'creator' : undefined,
                      link: `/invoices/${invoice.id}`
                    });
                  }
                }}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full font-medium shadow-md transition-all active:scale-95"
              >
                {step.actionLabel}
              </button>
            );
          })()}
        </div>
      )}

      {/* Header Actions - hidden on print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link 
            href={isProforma ? "/proformas" : "/invoices"} 
            className="p-2.5 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-all duration-300 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">
              {isProforma ? 'Proforma' : 'Facture'} {invoice.number || invoice.id}
            </h1>
          </div>
          <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border", config.className)}>
            <StatusIcon className="w-4 h-4" />
            {config.label}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 justify-end">
          {isProforma && (invoice.status === 'sent' || invoice.status === 'accepted') && (
            <button
              onClick={handleConvertToInvoice}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm active:scale-95"
            >
              Convertir en Facture
            </button>
          )}
          {!isProforma && balanceDue > 0 && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-[0_8px_20px_rgba(45,139,111,0.25)] hover:-translate-y-0.5 active:scale-95"
            >
              Saisir un encaissement
            </button>
          )}
          <select 
            value={invoice.status}
            onChange={handleStatusChange}
            disabled={invoice.status === 'paid' || invoice.status === 'partially_paid' || invoice.status === 'invoiced'}
            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-full focus:ring-primary focus:border-primary block px-4 py-2.5 outline-none transition-all duration-300 hover:shadow-sm cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyée</option>
            {isProforma ? (
              <>
                <option value="accepted">Acceptée</option>
                <option value="rejected">Refusée</option>
                {invoice.status === 'invoiced' && <option value="invoiced">Facturée</option>}
              </>
            ) : (
              <>
                <option value="late">En retard</option>
                {(invoice.status === 'paid' || invoice.status === 'partially_paid') && (
                  <option value={invoice.status}>{config.label}</option>
                )}
              </>
            )}
          </select>

          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm active:scale-95"
            title="Imprimer / PDF"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimer</span>
          </button>

          <button 
            onClick={async () => {
              const prefix = isProforma ? 'Proforma' : 'Facture';
              const finalFilename = `${prefix}_${invoice.number || invoice.id}`.replace(/[^a-zA-Z0-9_\-]/g, '_') + '.docx';
              
              let fileHandle;
              if ('showSaveFilePicker' in window) {
                try {
                  fileHandle = await (window as any).showSaveFilePicker({
                    suggestedName: finalFilename,
                    types: [{
                      description: 'Document Word',
                      accept: {'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']}
                    }]
                  });
                } catch (e) {
                  if ((e as Error).name === 'AbortError') return;
                }
              }

              let template = isProforma ? settings.customWordTemplateProforma : settings.customWordTemplateInvoice;
              if (!template) {
                template = await generateProTemplateAsBase64(isProforma ? 'PROFORMA' : 'FACTURE', settings.logo);
              }
              generateWordInvoice(template as string, invoice, client, settings, fileHandle, finalFilename);
            }}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-sm active:scale-95"
            title="Télécharger en Word (.docx)"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Word</span>
          </button>

          {canLock && (
            <button 
              onClick={() => toggleInvoiceLock(invoice.id, !invoice.isLocked)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm active:scale-95",
                invoice.isLocked ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              title={invoice.isLocked ? "Déverrouiller le document" : "Verrouiller le document"}
            >
              {invoice.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span className="hidden lg:inline">{invoice.isLocked ? "Verrouillé" : "Verrouiller"}</span>
            </button>
          )}

          {!invoice.isLocked && (
            <>
              <Link 
                href={`/invoices/${id}/edit`}
                className="p-2.5 text-gray-500 hover:text-primary hover:bg-white rounded-full transition-all duration-300 active:scale-90 shadow-sm bg-gray-50 border border-gray-100"
                title="Modifier"
              >
                <Edit2 className="w-5 h-5" />
              </Link>
              <button 
                onClick={handleDelete}
                className="p-2.5 text-gray-500 hover:text-red-500 hover:bg-white rounded-full transition-all duration-300 active:scale-90 shadow-sm bg-gray-50 border border-gray-100"
                title="Supprimer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Document Style */}
      <div id="invoice-print-container" className="bg-white mx-auto shadow-[0_4px_20px_rgba(0,0,0,0.03)] print:shadow-none w-full max-w-4xl rounded-xl flex flex-col relative border border-slate-100 print:border-slate-200 transition-all duration-300">
        
        <div className="h-4 w-full bg-primary rounded-t-xl print:rounded-t-xl" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}></div>

        <div className="p-5 sm:p-5 flex-1">
          <div className="flex flex-col md:flex-row print:flex-row justify-between items-start gap-5 mb-8">
            <div className="space-y-4">
              {settings.logo && (
                <img 
                  src={`${settings.logo}${settings.logo.includes('?') ? '&' : '?'}cors=1`} 
                  alt="Logo de l'entreprise" 
                  className="max-h-24 max-w-[250px] object-contain print:max-w-[200px]" 
                  crossOrigin="anonymous"
                />
              )}
              <div className="text-gray-500 text-[12px] sm:text-[13px] space-y-1 leading-relaxed">
                <p className="font-semibold text-gray-900">{invoice.metadata?.companyName || settings.companyName}</p>
                <p className="whitespace-pre-wrap">{invoice.metadata?.address || settings.address}</p>
                <p>NINEA: {invoice.metadata?.ninea || settings.ninea}</p>
                <p>RCCM: {invoice.metadata?.rccm || settings.rccm}</p>
              </div>
            </div>
            
            <div className="text-left md:text-right print:text-right">
              <h2 className="text-2xl sm:text-3xl print:text-3xl font-black text-gray-100 tracking-tighter uppercase leading-none mb-3 print:text-gray-200" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                {isProforma ? 'PROFORMA' : 'FACTURE'}
              </h2>
              
              <div className="inline-block bg-gray-50 rounded-xl p-3 sm:p-4 print:p-4 text-left border border-gray-100 print:bg-gray-50 print:border-gray-100" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] sm:text-[13px]">
                  <span className="text-gray-500">{isProforma ? "N° Proforma :" : "N° Facture :"}</span>
                  <span className="font-bold text-gray-900 text-right">{invoice.number || invoice.id}</span>
                  
                  <span className="text-gray-500">Date d'émission :</span>
                  <span className="font-medium text-gray-900 text-right">{formatDate(invoice.issueDate)}</span>
                  
                  <span className="text-gray-500">Date d'échéance :</span>
                  <span className="font-medium text-gray-900 text-right">{formatDate(invoice.dueDate)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-5">
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 print:p-5 border border-gray-100 print:bg-gray-50 print:border-gray-100" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Facturé à</h3>
              <div className="text-[13px] space-y-1">
                <p className="font-bold text-gray-900 text-[14px] sm:text-[15px] print:text-[15px] mb-1.5">{client.name}</p>
                <p className="text-gray-600">{client.email}</p>
                {client.phone && <p className="text-gray-600">{client.phone}</p>}
                {client.address && <p className="text-gray-600 whitespace-pre-wrap mt-2">{client.address}</p>}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <table className="w-full text-left text-[12px] sm:text-[13px] border-separate border-spacing-y-1.5">
              <thead>
                <tr className="text-gray-500">
                  <th className="py-2 px-4 font-medium text-[11px] sm:text-[12px] border-b border-gray-100">Description</th>
                  <th className="py-2 px-4 font-medium text-[11px] sm:text-[12px] text-center w-20 sm:w-24 border-b border-gray-100">Qté</th>
                  <th className="py-2 px-4 font-medium text-[11px] sm:text-[12px] text-right w-24 sm:w-32 border-b border-gray-100">Prix Unitaire</th>
                  <th className="py-2 px-4 font-medium text-[11px] sm:text-[12px] text-right w-28 sm:w-40 border-b border-gray-100">Montant</th>
                </tr>
              </thead>
              <tbody>
                {injectSectionSubtotals(invoice.lines).map((line, i) => {
                  if (line.type === 'section') {
                    return (
                      <tr key={i} className="bg-gray-50/80 print:bg-gray-50/80 rounded-xl sm:rounded-xl print:rounded-xl overflow-hidden" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                        <td colSpan={4} className="py-3 px-4 sm:px-6 print:px-6 text-center font-bold text-gray-900 uppercase tracking-widest text-[11px] sm:text-[12px] print:text-[12px] rounded-xl sm:rounded-xl print:rounded-xl">
                          {line.description}
                        </td>
                      </tr>
                    );
                  }
                  if (line.type === 'discount') {
                    return (
                      <tr key={i} className="group hover:bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 rounded-xl sm:rounded-xl bg-green-50/50 print:bg-transparent text-green-800 print:shadow-none print:hover:translate-y-0 print:hover:bg-transparent overflow-hidden">
                        <td colSpan={3} className="py-3 px-4 sm:px-6 font-bold uppercase text-[11px] sm:text-[12px] rounded-l-xl sm:rounded-l-2xl">{line.description}</td>
                        <td className="py-3 px-4 sm:px-6 text-right font-bold tabular-nums rounded-r-xl sm:rounded-r-2xl">-{formatCFA(line.unitPrice * (line.quantity || 1))}</td>
                      </tr>
                    );
                  }
                  if (line.type === 'subtotal') {
                    return (
                      <tr key={i} className="bg-blue-50/50 print:bg-blue-50/50 text-blue-900 rounded-xl sm:rounded-xl print:rounded-xl overflow-hidden" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                        <td colSpan={3} className="py-3 px-4 sm:px-6 print:px-6 font-bold uppercase text-[11px] sm:text-[12px] print:text-[12px] text-right rounded-l-xl sm:rounded-l-2xl print:rounded-l-2xl">{line.description}</td>
                        <td className="py-3 px-4 sm:px-6 text-right font-bold tabular-nums rounded-r-xl sm:rounded-r-2xl">{formatCFA(line.unitPrice)}</td>
                      </tr>
                    );
                  }
                  if (line.type === 'text') {
                    return (
                      <tr key={i} className="group hover:bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 rounded-xl sm:rounded-xl print:rounded-xl print:shadow-none print:hover:translate-y-0 print:hover:bg-transparent overflow-hidden">
                        <td className="py-3 px-4 sm:px-6 print:px-6 text-gray-800 font-medium rounded-l-xl sm:rounded-l-2xl print:rounded-l-2xl">{line.description}</td>
                        <td className="py-3 px-4 sm:px-6 text-center text-gray-600">-</td>
                        <td className="py-3 px-4 sm:px-6 text-right text-gray-600">-</td>
                        <td className="py-3 px-4 sm:px-6 text-right font-bold text-gray-900 rounded-r-xl sm:rounded-r-2xl">-</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={i} className="group hover:bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 rounded-xl sm:rounded-xl print:rounded-xl print:shadow-none print:hover:translate-y-0 print:hover:bg-transparent overflow-hidden">
                      <td className="py-3 px-4 sm:px-6 print:px-6 text-gray-800 font-medium rounded-l-xl sm:rounded-l-2xl print:rounded-l-2xl">{line.description}</td>
                      <td className="py-3 px-4 sm:px-6 print:px-6 text-center text-gray-600 w-20 sm:w-24 print:w-24">{line.quantity}</td>
                      <td className="py-3 px-4 sm:px-6 text-right text-gray-600 tabular-nums w-24 sm:w-32">{formatCFA(line.unitPrice)}</td>
                      <td className="py-3 px-4 sm:px-6 text-right font-bold text-gray-900 tabular-nums w-28 sm:w-40 rounded-r-xl sm:rounded-r-2xl">{formatCFA(line.quantity * line.unitPrice)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col-reverse md:flex-row print:flex-row justify-between gap-5 mb-16">
            <div className="w-full md:w-1/2 print:w-1/2">
              {invoicePayments.length > 0 && (
                <div className="bg-gray-50/50 print:bg-gray-50/50 rounded-xl p-5 border border-gray-100 print:border-gray-100" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                  <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    Historique des paiements
                  </h3>
                  <div className="space-y-3">
                    {invoicePayments.map(payment => (
                      <div key={payment.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-gray-900">{formatDate(payment.date)}</p>
                          <p className="text-gray-500 text-xs mt-0.5 capitalize">{payment.method} {payment.reference && `• Réf: ${payment.reference}`}</p>
                        </div>
                        <span className="font-bold text-primary tabular-nums">+{formatCFA(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-2/5 print:w-2/5">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm print:bg-slate-50 print:border-slate-200 print:p-5 print:shadow-none space-y-4" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                <div className="flex justify-between text-gray-600 text-[14px]">
                  <span>Sous-total HT</span>
                  <span className="font-medium tabular-nums">{formatCFA(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">TVA ({invoice.metadata?.tvaRate ?? (getTvaRate() * 100)}%)</span>
                  <span className="font-medium tabular-nums">{formatCFA(tva)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-4 mt-4">
                  <span className="font-bold text-gray-900 text-sm">Total TTC</span>
                  <span className="font-bold text-gray-900 text-lg tabular-nums">{formatCFA(total)}</span>
                </div>
                {totalPaid > 0 && (
                  <div className="flex justify-between items-center text-primary pt-2">
                    <span className="font-medium text-sm">Déjà payé</span>
                    <span className="font-bold tabular-nums">-{formatCFA(totalPaid)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t-2 border-gray-900 pt-4 mt-4">
                  <span className="font-black text-gray-900 uppercase tracking-wider text-sm">Reste à payer</span>
                  <span className={cn(
                    "font-black text-2xl tracking-tight tabular-nums",
                    balanceDue === 0 ? "text-paid" : "text-orange-600"
                  )}>
                    {formatCFA(balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 mt-auto">
            <p className="text-center text-gray-400 text-[12px] leading-relaxed whitespace-pre-wrap">
              {invoice.metadata?.footerMentions || settings.footerMentions}
            </p>
          </div>
        </div>
      </div>

      {/* Audit Trail / History */}
      {invoice.history && invoice.history.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mt-8 print:hidden max-w-4xl mx-auto w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Historique des actions
          </h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {invoice.history.slice().reverse().map((event, index) => {
              const employee = employees.find(e => e.id === event.employeeId);
              const isStatusChange = event.action === 'status_changed';
              return (
                <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {event.action === 'created' ? <FileText className="w-4 h-4" /> : 
                     event.action === 'updated' ? <Edit2 className="w-4 h-4" /> :
                     event.action === 'status_changed' ? <CheckCircle2 className="w-4 h-4" /> :
                     event.action === 'locked' ? <Lock className="w-4 h-4" /> :
                     event.action === 'unlocked' ? <Unlock className="w-4 h-4" /> :
                     <Clock className="w-4 h-4" />}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">{employee ? employee.name : 'Système'}</span>
                      <time className="text-xs font-medium text-slate-500">
                        {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <p className="text-sm text-slate-600">
                      {event.action === 'created' && 'a créé le document'}
                      {event.action === 'updated' && 'a modifié le document'}
                      {event.action === 'locked' && 'a verrouillé le document'}
                      {event.action === 'unlocked' && 'a déverrouillé le document'}
                      {event.action === 'status_changed' && `a changé le statut en `}
                      {isStatusChange && <span className="font-semibold text-slate-800">{event.details}</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Supprimer la facture"
        message="Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible et supprimera également les encaissements associés."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoiceId={invoice.id}
        balanceDue={balanceDue}
      />
    </div>
  );
}
