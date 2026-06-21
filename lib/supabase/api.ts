import { createClient } from './client'
import { Client, Invoice, InvoiceLine, Payment, Settings, AppNotification, Workflow } from '@/store/data-store'

export const api = {
  // Workflows
  async getWorkflows(companyId: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from('workflows').select('*').eq('company_id', companyId).order('created_at', { ascending: true })
    if (error) throw error
    return data.map((w: any) => ({
      id: w.id,
      name: w.name,
      documentType: w.document_type,
      steps: w.steps
    }))
  },
  async addWorkflow(companyId: string, workflow: Omit<Workflow, 'id'>) {
    const supabase = createClient()
    const { data, error } = await supabase.from('workflows').insert({
      company_id: companyId,
      name: workflow.name,
      document_type: workflow.documentType,
      steps: workflow.steps
    }).select().single()
    if (error) throw error
    return {
      id: data.id,
      name: data.name,
      documentType: data.document_type,
      steps: data.steps
    }
  },
  async updateWorkflow(id: string, updates: Partial<Workflow>) {
    const supabase = createClient()
    const payload: any = {}
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.documentType !== undefined) payload.document_type = updates.documentType
    if (updates.steps !== undefined) payload.steps = updates.steps
    
    if (Object.keys(payload).length === 0) return null
    
    const { data, error } = await supabase.from('workflows').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteWorkflow(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('workflows').delete().eq('id', id)
    if (error) throw error
  },

  // Notifications
  async getNotifications(companyId: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from('notifications').select('*').eq('company_id', companyId).order('created_at', { ascending: false })
    if (error) throw error
    return data.map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      date: n.date,
      isRead: n.is_read,
      type: n.type,
      targetRole: n.target_role,
      targetRoles: n.target_roles,
      targetEmployeeId: n.target_employee_id,
      targetEmployeeIds: n.target_employee_ids,
      link: n.link
    }))
  },
  async addNotification(companyId: string, notification: Omit<AppNotification, 'id'>) {
    const supabase = createClient()
    const payload = {
      company_id: companyId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      is_read: notification.isRead,
      date: notification.date,
      target_role: notification.targetRole,
      target_roles: notification.targetRoles,
      target_employee_id: notification.targetEmployeeId,
      target_employee_ids: notification.targetEmployeeIds,
      link: notification.link
    }
    const { data, error } = await supabase.from('notifications').insert(payload).select().single()
    if (error) throw error
    return {
      ...notification,
      id: data.id
    }
  },
  async markNotificationAsRead(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) throw error
  },
  async markAllNotificationsAsRead(companyId: string, employeeId: string, role: string) {
    // Due to array checking limitations in standard Supabase JS client update, we might do it in SQL or just fetch & update.
    // However, updating all where is_read = false for the company is fine, 
    // but ideally we only update those targeted at this user.
    // For simplicity, we can fetch their unread ones, then update them.
    const supabase = createClient()
    const { data: unreadNotifs, error: getErr } = await supabase.from('notifications').select('id, target_role, target_roles, target_employee_id, target_employee_ids').eq('company_id', companyId).eq('is_read', false)
    if (getErr) throw getErr
    
    if (!unreadNotifs || unreadNotifs.length === 0) return
    
    const idsToUpdate = unreadNotifs.filter((n: any) => {
      const isGlobal = !n.target_role && !n.target_roles && !n.target_employee_id && !n.target_employee_ids;
      const matchesRole = n.target_role === role || n.target_role === 'any' || (n.target_roles && (n.target_roles.includes(role) || n.target_roles.includes('any')));
      const matchesEmployee = n.target_employee_id === employeeId || (n.target_employee_ids && n.target_employee_ids.includes(employeeId));
      return isGlobal || matchesRole || matchesEmployee;
    }).map((n: any) => n.id)
    
    if (idsToUpdate.length > 0) {
      const { error: updErr } = await supabase.from('notifications').update({ is_read: true }).in('id', idsToUpdate)
      if (updErr) throw updErr
    }
  },

  // Workspaces
  async getUserCompanies() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    
    const { data, error } = await supabase
      .from('company_users')
      .select('company_id, role, status, companies(id, name, created_at)')
      .eq('user_id', user.id)
      
    if (error) throw error
    if (!data) return []
    
    return data
      .filter((cu: any) => cu.companies !== null)
      .map((cu: any) => ({
        id: cu.companies.id,
        name: cu.companies.name,
        created_at: cu.companies.created_at,
        role: cu.role,
        status: cu.status
      }))
  },
  async getCurrentUserProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    return data
  },
  async updateProfile(name: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ name }).eq('id', user.id)
  },

  // Employees
  async getEmployees(companyId: string) {
    const supabase = createClient()
    const { data: companyUsers, error } = await supabase
      .from('company_users')
      .select('user_id, role, status')
      .eq('company_id', companyId)
      
    if (error) throw error
    if (!companyUsers || companyUsers.length === 0) return []

    const userIds = companyUsers.map((cu: any) => cu.user_id)
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .in('id', userIds)

    if (profError) throw profError

    // Format to match Employee interface
    return companyUsers.map((cu: any) => {
      const profile = profiles?.find((p: any) => p.id === cu.user_id)
      return {
        id: cu.user_id,
        name: profile?.name || 'Inconnu',
        email: (profile as any)?.email || '', // Note: profiles may not have email, but we map it safely
        avatar: profile?.avatar || null,
        role: cu.role,
        status: cu.status
      }
    })
  },

  async updateEmployeeStatus(companyId: string, userId: string, status: 'active' | 'pending' | 'rejected', role?: 'admin' | 'manager' | 'accountant' | 'creator') {
    const supabase = createClient()
    const updatePayload: any = { status }
    if (role) {
      updatePayload.role = role
    }
    const { error } = await supabase
      .from('company_users')
      .update(updatePayload)
      .match({ company_id: companyId, user_id: userId })

    if (error) throw error
  },

  // Clients
  async getClients(companyId: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from('clients').select('*').eq('company_id', companyId).order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  async addClient(companyId: string, client: Omit<Client, 'id'>) {
    const supabase = createClient()
    const { data, error } = await supabase.from('clients').insert({ ...client, company_id: companyId }).select().single()
    if (error) throw error
    return data
  },
  async updateClient(id: string, updates: Partial<Client>) {
    const supabase = createClient()
    const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteClient(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  },

  async getSettings(companyId: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from('settings').select('*').eq('company_id', companyId).limit(1).single()
    if (error && error.code !== 'PGRST116') throw error // Ignore no rows error
    
    if (!data) return null;
    
    return {
      id: data.id,
      companyName: data.company_name || '',
      ninea: data.ninea || '',
      nineaLabel: data.ninea_label || 'NINEA',
      rccm: data.rccm || '',
      rccmLabel: data.rccm_label || 'RCCM',
      address: data.address || '',
      defaultTva: data.default_tva,
      currency: data.currency || 'XOF',
      footerMentions: data.footer_mentions || '',
      customWordTemplateInvoice: data.custom_word_template_invoice,
      customWordTemplateProforma: data.custom_word_template_proforma,
      autoReminder: data.auto_reminder,
      lateAlert: data.late_alert,
      monthlyReport: data.monthly_report,
      enableWorkflows: data.enable_workflows,
      themeColor: data.theme_color,
      logo: data.logo || '',
      plan: data.plan || 'free',
      isPremium: data.plan === 'premium' || data.is_premium,
      alerts: data.alerts
    }
  },
  async updateSettings(companyId: string, updates: Partial<Settings>) {
    const supabase = createClient()
    
    // Extract userName since it belongs to profiles, not settings
    const { userName, ...rest } = updates;
    
    if (userName !== undefined) {
      await api.updateProfile(userName);
    }
    
    if (Object.keys(rest).length === 0) return null;
    
    const settingsUpdates: any = {};
    if (rest.companyName !== undefined) {
      settingsUpdates.company_name = rest.companyName;
      // Also update the company table
      const { error: companyError } = await supabase.from('companies').update({ name: rest.companyName }).eq('id', companyId);
      if (companyError) console.error("Failed to update company name", companyError);
    }
    if (rest.ninea !== undefined) settingsUpdates.ninea = rest.ninea;
    if (rest.nineaLabel !== undefined) settingsUpdates.ninea_label = rest.nineaLabel;
    if (rest.rccm !== undefined) settingsUpdates.rccm = rest.rccm;
    if (rest.rccmLabel !== undefined) settingsUpdates.rccm_label = rest.rccmLabel;
    if (rest.address !== undefined) settingsUpdates.address = rest.address;
    if (rest.defaultTva !== undefined) settingsUpdates.default_tva = rest.defaultTva;
    if (rest.currency !== undefined) settingsUpdates.currency = rest.currency;
    if (rest.footerMentions !== undefined) settingsUpdates.footer_mentions = rest.footerMentions;
    if (rest.customWordTemplateInvoice !== undefined) settingsUpdates.custom_word_template_invoice = rest.customWordTemplateInvoice;
    if (rest.customWordTemplateProforma !== undefined) settingsUpdates.custom_word_template_proforma = rest.customWordTemplateProforma;
    if (rest.autoReminder !== undefined) settingsUpdates.auto_reminder = rest.autoReminder;
    if (rest.lateAlert !== undefined) settingsUpdates.late_alert = rest.lateAlert;
    if (rest.monthlyReport !== undefined) settingsUpdates.monthly_report = rest.monthlyReport;
    if (rest.enableWorkflows !== undefined) settingsUpdates.enable_workflows = rest.enableWorkflows;
    if (rest.themeColor !== undefined) settingsUpdates.theme_color = rest.themeColor;
    if (rest.logo !== undefined) settingsUpdates.logo = rest.logo;
    if (rest.plan !== undefined) {
      settingsUpdates.plan = rest.plan;
      settingsUpdates.is_premium = rest.plan === 'premium'; // Keep backward compatibility in DB if column exists
    }
    if (rest.isPremium !== undefined) settingsUpdates.is_premium = rest.isPremium;
    if (rest.alerts !== undefined) settingsUpdates.alerts = rest.alerts;

    if (Object.keys(settingsUpdates).length === 0) return null;

    const { data: existing, error: existingError } = await supabase.from('settings').select('id').eq('company_id', companyId).limit(1).maybeSingle()
    if (existingError) throw existingError;
    
    if (existing) {
      const { data, error } = await supabase.from('settings').update(settingsUpdates).eq('id', existing.id).select().single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase.from('settings').insert({ ...settingsUpdates, company_id: companyId }).select().single()
      if (error) throw error
      return data
    }
  },

  // Invoices & Lines
  async getInvoices(companyId: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from('invoices').select('*, lines:invoice_lines(*)').eq('company_id', companyId).order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  async addInvoice(companyId: string, invoice: Omit<Invoice, 'id'>) {
    const supabase = createClient()
    const { lines, history, ...invoiceData } = invoice
    
    // Pack workflowId and currentStepId into metadata since we don't have columns for them
    const metadataToSave = {
      ...(invoiceData.metadata || {}),
    };
    if ((invoiceData as any).workflowId) {
      metadataToSave.workflowId = (invoiceData as any).workflowId;
      metadataToSave.currentStepId = (invoiceData as any).currentStepId;
    }

    // Insert invoice
    const { data: newInvoice, error: invError } = await supabase.from('invoices').insert({
      number: invoiceData.number,
      type: invoiceData.type,
      client_id: invoiceData.clientId,
      issue_date: invoiceData.issueDate,
      due_date: invoiceData.dueDate,
      status: invoiceData.status,
      metadata: metadataToSave,
      is_locked: invoiceData.isLocked || false,
      company_id: companyId
    }).select().single()
    
    if (invError) throw invError

    // Insert lines
    if (lines && lines.length > 0) {
      const linesToInsert = lines.map((l: any, index: number) => ({
        invoice_id: newInvoice.id,
        type: l.type || 'item',
        description: l.description || '',
        quantity: l.quantity ?? 1,
        unit_price: l.unitPrice ?? 0,
        reference: l.reference ?? null,
        deliverables: l.deliverables ?? null,
        unit: l.unit ?? null,
        is_forfait: !!l.isForfait,
        position: index
      }))
      const { error: lineError } = await supabase.from('invoice_lines').insert(linesToInsert)
      if (lineError) throw lineError
    }

    return newInvoice
  },
  async updateInvoiceStatus(id: string, status: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from('invoices').update({ status }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteInvoice(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
  },

  async updateInvoice(id: string, updates: Partial<Invoice>) {
    const supabase = createClient()
    const { lines, history, ...invoiceData } = updates
    
    // Convert camelCase to snake_case for DB
    const dbUpdates: any = {}
    if (invoiceData.number !== undefined) dbUpdates.number = invoiceData.number
    if (invoiceData.type !== undefined) dbUpdates.type = invoiceData.type
    if (invoiceData.clientId !== undefined) dbUpdates.client_id = invoiceData.clientId || null
    if (invoiceData.issueDate !== undefined) dbUpdates.issue_date = invoiceData.issueDate
    if (invoiceData.dueDate !== undefined) dbUpdates.due_date = invoiceData.dueDate
    if (invoiceData.status !== undefined) dbUpdates.status = invoiceData.status
    if (invoiceData.isLocked !== undefined) dbUpdates.is_locked = invoiceData.isLocked

    // Pack workflowId and currentStepId into metadata
    let metadataToSave = invoiceData.metadata;
    if ((invoiceData as any).workflowId !== undefined || (invoiceData as any).currentStepId !== undefined) {
      metadataToSave = {
        ...(invoiceData.metadata || {}),
        workflowId: (invoiceData as any).workflowId,
        currentStepId: (invoiceData as any).currentStepId,
      };
    }
    if (metadataToSave !== undefined) dbUpdates.metadata = metadataToSave;

    const { data: updatedData, error: invError } = await supabase.from('invoices').update(dbUpdates).eq('id', id).select().single()
    if (invError) throw invError

    // Handle lines (simplest way is delete all and re-insert)
    if (lines !== undefined) {
      const { error: delError } = await supabase.from('invoice_lines').delete().eq('invoice_id', id)
      if (delError) throw delError

      if (lines.length > 0) {
        const linesToInsert = lines.map((l: any, index: number) => ({
          invoice_id: id,
          type: l.type || 'item',
          description: l.description || '',
          quantity: l.quantity ?? 1,
          unit_price: l.unitPrice ?? 0,
          reference: l.reference ?? null,
          deliverables: l.deliverables ?? null,
          unit: l.unit ?? null,
          is_forfait: !!l.isForfait,
          position: index
        }))
        const { error: lineError } = await supabase.from('invoice_lines').insert(linesToInsert)
        if (lineError) throw lineError
      }
    }
  },

  // Payments
  async getPayments(companyId: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from('payments').select('*').eq('company_id', companyId).order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  async addPayment(companyId: string, payment: Omit<Payment, 'id'>) {
    const supabase = createClient()
    const { data, error } = await supabase.from('payments').insert({
      invoice_id: payment.invoiceId,
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
      reference: payment.reference,
      company_id: companyId
    }).select().single()
    if (error) throw error
    return data
  }
}
