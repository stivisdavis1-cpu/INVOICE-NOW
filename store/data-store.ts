import { create } from 'zustand';
import { api } from '@/lib/supabase/api';
import { toast } from '@/store/toast-store';
import { calculateInvoice } from '@/lib/utils';

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'late' | 'partially_paid' | 'accepted' | 'rejected' | 'invoiced';
export type DocumentType = 'invoice' | 'proforma';
export type LineType = 'item' | 'section' | 'subtotal' | 'discount' | 'text' | 'license' | 'support' | 'service';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  ninea?: string;
}

export interface Company {
  id: string;
  name: string;
  created_at?: string;
}

export interface InvoiceLine {
  id: string;
  type?: LineType;
  description: string;
  quantity: number;
  unitPrice: number;
  reference?: string;
  deliverables?: string;
  unit?: string;
  isForfait?: boolean;
}

export type EmployeeRole = 'admin' | 'manager' | 'accountant' | 'creator';

export interface Employee {
  id: string;
  name: string;
  email?: string;
  role: EmployeeRole;
  avatar?: string;
  password?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  requiredRole: string; // "any" or Employee ID
  actionLabel: string;
  allowReject?: boolean;
  rejectLabel?: string;
  allowRequestChanges?: boolean;
  requestChangesLabel?: string;
  isFinal?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  documentType: 'invoice' | 'proforma' | 'both';
  steps: WorkflowStep[];
}

export type NotificationType = 'info' | 'warning' | 'success';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: NotificationType;
  targetRole?: EmployeeRole | 'any';
  targetEmployeeId?: string;
  link?: string;
}

export interface InvoiceEvent {
  id: string;
  action: 'created' | 'updated' | 'status_changed' | 'payment_added' | 'step_approved' | 'step_rejected' | 'converted' | 'locked' | 'unlocked';
  employeeId: string | null;
  date: string;
  details?: string;
}

export interface Invoice {
  id: string;
  number?: string;
  type?: DocumentType;
  proformaId?: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  metadata?: Record<string, any>;
  workflowId?: string;
  currentStepId?: string;
  assigneeId?: string;
  history?: InvoiceEvent[];
  isLocked?: boolean;
}

export type PaymentMethod = 'transfer' | 'card' | 'cash' | 'mobile';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string;
}

export interface AlertConfig {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'in_app' | 'both';
  triggerEvent: 'before_due' | 'after_due' | 'status_change' | 'monthly' | 'custom';
  triggerDaysOffset?: number;
  isActive: boolean;
  subjectTemplate?: string;
  contentTemplate: string;
  isSystem?: boolean;
}

export interface Settings {
  userName: string;
  companyName: string;
  ninea: string;
  rccm: string;
  address: string;
  defaultTva: number;
  currency: string;
  footerMentions: string;
  customWordTemplateInvoice: string | null;
  customWordTemplateProforma: string | null;
  autoReminder: boolean;
  lateAlert: boolean;
  monthlyReport: boolean;
  alerts: AlertConfig[];
  enableWorkflows: boolean;
  themeColor?: string;
  logo?: string;
  plan?: 'free' | 'intermediate' | 'premium';
  isPremium?: boolean; // Kept for backwards compatibility
  twoFactorEnabled?: boolean;
}

interface DataStore {
  companies: Company[];
  activeCompanyId: string | null;
  setActiveCompany: (id: string) => void;

  clients: Client[];
  invoices: Invoice[];
  payments: Payment[];
  settings: Settings;
  
  initializeStore: () => Promise<void>;
  clearStore: () => void;
  
  // Workflows & Employees
  employees: Employee[];
  workflows: Workflow[];
  activeEmployeeId: string | null;

  // Notifications
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllAsRead: (employeeId: string, role: string) => void;

  // Employee & Workflow Actions
  setActiveEmployee: (id: string | null) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addWorkflow: (workflow: Omit<Workflow, 'id'>) => void;
  updateWorkflow: (id: string, data: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  
  // Client Actions
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Invoice Actions
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<string | undefined>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  toggleInvoiceLock: (id: string, isLocked: boolean) => void;
  checkLateInvoices: () => void;
  
  // Payment Actions
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  
  // Settings Actions
  updateSettings: (data: Partial<Settings>) => void;
}


const initialSettings: Settings = {
  userName: '',
  companyName: '',
  ninea: '',
  rccm: '',
  address: '',
  defaultTva: 18,
  currency: 'XOF',
  footerMentions: 'Conditions de paiement : 30 jours fin de mois.',
  customWordTemplateInvoice: null,
  customWordTemplateProforma: null,
  autoReminder: true,
  lateAlert: false,
  monthlyReport: true,
  alerts: [
    {
      id: 'sys-auto-reminder',
      name: 'Relance Automatique',
      description: "Envoyer un email au client 3 jours avant l'échéance.",
      type: 'email',
      triggerEvent: 'before_due',
      triggerDaysOffset: -3,
      isActive: true,
      subjectTemplate: 'Rappel : Votre facture {invoiceId} arrive à échéance',
      contentTemplate: 'Bonjour {clientName},\n\nSauf erreur de notre part, le paiement de la facture {invoiceId} d\'un montant de {totalAmount} arrivera à échéance le {dueDate}.\n\nMerci de procéder au règlement dans les meilleurs délais.\n\nCordialement,\n{companyName}',
      isSystem: true
    },
    {
      id: 'sys-late-alert',
      name: 'Alerte de Retard',
      description: "Me notifier lorsqu'une facture devient en retard.",
      type: 'in_app',
      triggerEvent: 'after_due',
      triggerDaysOffset: 1,
      isActive: false,
      contentTemplate: 'La facture {invoiceId} pour {clientName} est maintenant en retard de paiement.',
      isSystem: true
    },
    {
      id: 'sys-monthly-report',
      name: 'Rapport Mensuel',
      description: 'Recevoir un résumé financier le 1er de chaque mois.',
      type: 'email',
      triggerEvent: 'monthly',
      isActive: true,
      subjectTemplate: 'Votre rapport mensuel Invoice Now',
      contentTemplate: 'Bonjour,\nVoici le résumé financier du mois pour {companyName}.',
      isSystem: true
    }
  ],
  enableWorkflows: false,
  plan: 'premium',
  isPremium: true,
  themeColor: '#0B60B0',
  twoFactorEnabled: false,
};

export const useDataStore = create<DataStore>((set, get) => ({
  companies: [],
  activeCompanyId: null,
  setActiveCompany: async (id) => {
    set({ activeCompanyId: id });
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeCompanyId', id);
    }
    // Re-initialize store for the new active company
    await get().initializeStore();
  },

  clients: [],
  invoices: [],
  payments: [],
  settings: initialSettings,
  employees: [],
  workflows: [],
  activeEmployeeId: null,
  notifications: [],

  clearStore: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('activeCompanyId');
    }
    set({
      companies: [],
      activeCompanyId: null,
      clients: [],
      invoices: [],
      payments: [],
      settings: initialSettings,
      employees: [],
      workflows: [],
      activeEmployeeId: null,
      notifications: []
    });
  },

  initializeStore: async () => {
    try {
      const companies = await api.getUserCompanies();
      let activeCompanyId = get().activeCompanyId;

      if (!activeCompanyId && typeof window !== 'undefined') {
        activeCompanyId = localStorage.getItem('activeCompanyId');
      }

      if (!activeCompanyId || !companies.find(c => c.id === activeCompanyId)) {
        activeCompanyId = companies.length > 0 ? companies[0].id : null;
        if (activeCompanyId && typeof window !== 'undefined') {
          localStorage.setItem('activeCompanyId', activeCompanyId);
        }
      }

      if (!activeCompanyId) {
        set({ companies });
        return;
      }

      const [dbClients, dbInvoices, dbSettings, dbPayments, dbEmployees, currentUserProfile] = await Promise.all([
        api.getClients(activeCompanyId),
        api.getInvoices(activeCompanyId),
        api.getSettings(activeCompanyId),
        api.getPayments(activeCompanyId),
        api.getEmployees(activeCompanyId),
        api.getCurrentUserProfile()
      ]);

      const mappedClients = dbClients.map((c: any) => ({
        ...c,
        companyName: c.company_name,
        taxId: c.tax_id
      }));

      const mappedInvoices = dbInvoices.map((i: any) => ({
        ...i,
        clientId: i.client_id,
        issueDate: i.issue_date,
        dueDate: i.due_date,
        isLocked: i.is_locked,
        workflowId: i.metadata?.workflowId,
        currentStepId: i.metadata?.currentStepId,
        lines: (i.lines || []).sort((a: any, b: any) => a.position - b.position).map((l: any) => ({
          id: l.id,
          type: l.type,
          description: l.description,
          quantity: typeof l.quantity === 'string' ? parseFloat(l.quantity) : l.quantity,
          unitPrice: typeof l.unit_price === 'string' ? parseFloat(l.unit_price) : l.unit_price,
          reference: l.reference,
          deliverables: l.deliverables,
          unit: l.unit,
          isForfait: l.is_forfait
        })) || []
      }));

      const mappedPayments = dbPayments.map((p: any) => ({
        ...p,
        invoiceId: p.invoice_id
      }));

      const settings = dbSettings ? { ...initialSettings, ...dbSettings } : { ...initialSettings };
      if (!settings.alerts) {
        settings.alerts = initialSettings.alerts;
      }
      if (currentUserProfile?.name) {
        settings.userName = currentUserProfile.name;
      }

      set({ 
        companies,
        activeCompanyId,
        clients: mappedClients, 
        invoices: mappedInvoices, 
        settings: settings, 
        payments: mappedPayments,
        employees: dbEmployees,
        activeEmployeeId: dbEmployees.length > 0 ? dbEmployees[0].id : null
      });
    } catch (e: any) {
      console.error('Failed to initialize store from Supabase', e.message || JSON.stringify(e));
    }
  },
  
  addNotification: (notification) => set((state) => ({
    notifications: [{ ...notification, id: generateId('NOTIF'), date: new Date().toISOString(), isRead: false }, ...state.notifications]
  })),

  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
  })),

  markAllAsRead: (employeeId, role) => set((state) => ({
    notifications: state.notifications.map(n => 
      (n.targetEmployeeId === employeeId || n.targetRole === role || n.targetRole === 'any')
        ? { ...n, isRead: true } 
        : n
    )
  })),

  setActiveEmployee: (id) => set({ activeEmployeeId: id }),
  addEmployee: (employee) => set((state) => ({ employees: [...state.employees, { ...employee, id: generateId('EMP') }] })),
  updateEmployee: (id, data) => set((state) => ({ employees: state.employees.map(e => e.id === id ? { ...e, ...data } : e) })),
  deleteEmployee: (id) => set((state) => ({ employees: state.employees.filter(e => e.id !== id) })),
  addWorkflow: (workflow) => set((state) => ({ workflows: [...state.workflows, { ...workflow, id: generateId('WF') }] })),
  updateWorkflow: (id, data) => set((state) => ({ workflows: state.workflows.map(w => w.id === id ? { ...w, ...data } : w) })),
  deleteWorkflow: (id) => set((state) => ({ workflows: state.workflows.filter(w => w.id !== id) })),

  addClient: async (client) => {
    const companyId = get().activeCompanyId;
    if (!companyId) return;
    const tmpId = generateId('CLI');
    set((state) => ({ clients: [{ ...client, id: tmpId }, ...state.clients] }));
    
    try {
      const realClient = await api.addClient(companyId, client);
      set((state) => ({
        clients: state.clients.map(c => c.id === tmpId ? { ...c, id: realClient.id } : c)
      }));
      toast.success('Client ajouté', 'Le client a été ajouté avec succès.');
    } catch (e: any) {
      set((state) => ({ clients: state.clients.filter(c => c.id !== tmpId) }));
      toast.error('Erreur', e.message || "Impossible d'ajouter le client.");
    }
  },
  
  updateClient: async (id, data) => {
    const prevClients = get().clients;
    set((state) => ({ clients: state.clients.map(c => c.id === id ? { ...c, ...data } : c) }));
    
    try {
      await api.updateClient(id, data);
      toast.success('Client mis à jour', 'Les informations ont été sauvegardées.');
    } catch (e: any) {
      set({ clients: prevClients });
      toast.error('Erreur', e.message || "Impossible de mettre à jour le client.");
    }
  },
  
  deleteClient: async (id) => {
    const prevClients = get().clients;
    set((state) => ({ clients: state.clients.filter(c => c.id !== id) }));
    
    try {
      await api.deleteClient(id);
      toast.success('Client supprimé', 'Le client a été retiré de votre carnet.');
    } catch (e: any) {
      set({ clients: prevClients });
      toast.error('Erreur', e.message || "Impossible de supprimer le client.");
    }
  },
  
  addInvoice: async (invoice) => {
    const companyId = get().activeCompanyId;
    if (!companyId) return;
    const tmpId = generateId('INV');
    set((state) => ({ invoices: [{ ...invoice, id: tmpId, companyId }, ...state.invoices] }));
    
    try {
      const realInvoice = await api.addInvoice(companyId, invoice);
      set((state) => ({
        invoices: state.invoices.map(inv => inv.id === tmpId ? { ...inv, id: realInvoice.id } : inv)
      }));
      toast.success('Document créé', `Le document ${invoice.number || ''} a été généré.`);
      return realInvoice.id;
    } catch (e: any) {
      set((state) => ({ invoices: state.invoices.filter(inv => inv.id !== tmpId) }));
      toast.error('Erreur', e.message || "Impossible de créer le document.");
      throw e;
    }
  },
  
  updateInvoice: async (id, data) => {
    const prevInvoices = get().invoices;
    set((state) => ({
      invoices: state.invoices.map(inv => {
        if (inv.id !== id) return inv;
        const updated = { ...inv, ...data };
        
        if (updated.type === 'invoice' && (updated.status === 'sent' || updated.status === 'partially_paid') && updated.dueDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(updated.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          if (dueDate < today) updated.status = 'late';
        }
        
        const event: InvoiceEvent = {
          id: `EV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          action: 'updated',
          employeeId: state.activeEmployeeId,
          date: new Date().toISOString()
        };
        
        updated.history = [...(inv.history || []), event];
        return updated;
      })
    }));

    try {
      await api.updateInvoice(id, data);
      toast.success('Document mis à jour', 'Les modifications ont été sauvegardées.');
    } catch (e: any) {
      console.error('Update Invoice Error:', e);
      set({ invoices: prevInvoices });
      toast.error('Erreur', e.message || "Impossible de mettre à jour le document.");
      throw e;
    }
  },
  
  deleteInvoice: async (id) => {
    const prevInvoices = get().invoices;
    set((state) => ({ invoices: state.invoices.filter(inv => inv.id !== id) }));
    
    try {
      await api.deleteInvoice(id);
      toast.success('Document supprimé', 'Le document a été retiré.');
    } catch (e: any) {
      set({ invoices: prevInvoices });
      toast.error('Erreur', e.message || "Impossible de supprimer le document.");
    }
  },
  
  updateInvoiceStatus: async (id, status) => {
    const prevInvoices = get().invoices;
    set((state) => ({
      invoices: state.invoices.map(inv => {
        if (inv.id !== id) return inv;
        const updated = { ...inv, status };
        
        if (updated.type === 'invoice' && (updated.status === 'sent' || updated.status === 'partially_paid') && updated.dueDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(updated.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          if (dueDate < today) updated.status = 'late';
        }
        
        const event: InvoiceEvent = {
          id: `EV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          action: 'status_changed',
          employeeId: state.activeEmployeeId,
          date: new Date().toISOString(),
          details: status
        };
        
        updated.history = [...(inv.history || []), event];
        return updated;
      })
    }));
    
    try {
      await api.updateInvoiceStatus(id, status);
      toast.success('Statut mis à jour', `Le document est maintenant: ${status}`);
    } catch (e: any) {
      set({ invoices: prevInvoices });
      toast.error('Erreur', e.message || "Impossible de modifier le statut.");
    }
  },

  toggleInvoiceLock: (id, isLocked) => set((state) => ({
    invoices: state.invoices.map(inv => {
      if (inv.id !== id) return inv;
      const updated = { ...inv, isLocked };
      const event: InvoiceEvent = {
        id: `EV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        action: isLocked ? 'locked' : 'unlocked',
        employeeId: state.activeEmployeeId,
        date: new Date().toISOString()
      };
      updated.history = [...(inv.history || []), event];
      return updated;
    })
  })),
  
  checkLateInvoices: () => set((state) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let hasChanges = false;
    const newNotifications: AppNotification[] = [];
    
    const updatedInvoices = state.invoices.map(inv => {
      if (inv.type === 'invoice' && (inv.status === 'sent' || inv.status === 'partially_paid') && inv.dueDate) {
        const dueDate = new Date(inv.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          hasChanges = true;
          
          if (state.settings.lateAlert) {
            newNotifications.push({
              id: generateId('NOTIF'),
              title: `Facture en retard`,
              message: `La facture ${inv.number} est arrivée à échéance le ${dueDate.toLocaleDateString()}.`,
              type: 'warning',
              date: new Date().toISOString(),
              isRead: false,
              targetRole: 'creator',
              link: `/invoices/${inv.id}`
            });
          }
          
          return { ...inv, status: 'late' as InvoiceStatus };
        }
      }
      return inv;
    });

    if (!hasChanges) return state;

    return { 
      invoices: updatedInvoices,
      notifications: [...newNotifications, ...state.notifications]
    };
  }),
  
  addPayment: (payment) => {
    const companyId = get().activeCompanyId;
    if (!companyId) return;
    const id = generateId('PAY');
    set((state) => {
      // 1. Ajouter le paiement
      const updatedPayments = [{ ...payment, id }, ...state.payments];
      
      // 2. Mettre à jour le statut de la facture liée
      const invoice = state.invoices.find(i => i.id === payment.invoiceId);
      if (invoice) {
        const total = calculateInvoice(invoice.lines, invoice.metadata).total;
        const totalPaid = updatedPayments
          .filter(p => p.invoiceId === invoice.id)
          .reduce((sum, p) => sum + p.amount, 0);

        let newStatus = invoice.status;
        if (totalPaid >= total) newStatus = 'paid';
        else if (totalPaid > 0) newStatus = 'partially_paid';

        // Mettre à jour dans Supabase
        if (newStatus !== invoice.status) {
          api.updateInvoiceStatus(invoice.id, newStatus).catch(console.error);
        }

        return {
          payments: updatedPayments,
          invoices: state.invoices.map(inv => 
            inv.id === invoice.id ? { ...inv, status: newStatus } : inv
          )
        };
      }
      
      return { payments: updatedPayments };
    });
    
    api.addPayment(companyId, payment).catch(console.error);
  },

  updateSettings: async (data) => {
    const companyId = get().activeCompanyId;
    if (!companyId) {
      return;
    }
    const prevSettings = get().settings;
    const prevCompanies = get().companies;
    set((state) => ({ 
      settings: { ...state.settings, ...data },
      companies: data.companyName 
        ? state.companies.map(c => c.id === companyId ? { ...c, name: data.companyName! } : c) 
        : state.companies
    }));
    try {
      await api.updateSettings(companyId, data);
      toast.success('Paramètres enregistrés', 'Vos modifications ont été appliquées.');
    } catch (e: any) {
      console.error('Update settings failed:', e);
      set({ settings: prevSettings, companies: prevCompanies });
      
      const errorMessage = e instanceof Error ? e.message : JSON.stringify(e);
      alert(`Erreur détaillée: ${errorMessage}`);
      toast.error('Erreur de sauvegarde', errorMessage);
    }
  }
}));
