import { useEffect } from 'react';
import { useDataStore } from '@/store/data-store';

export function useNotificationEngine() {
  const invoices = useDataStore((state) => state.invoices);
  const settings = useDataStore((state) => state.settings);
  const addNotification = useDataStore((state) => state.addNotification);
  const notifications = useDataStore((state) => state.notifications);
  const workflows = useDataStore((state) => state.workflows);

  useEffect(() => {
    // Only run if there are invoices to process
    if (!invoices || invoices.length === 0) return;

    const today = new Date().toISOString().split('T')[0];

    // Process all active alerts
    if (!settings.alerts) return;

    const getInvoiceTargets = (inv: any) => {
      let roles: any[] = [];
      let ids: string[] = [];
      if (inv.workflowId) {
        const wf = workflows.find((w: any) => w.id === inv.workflowId);
        if (wf) {
          wf.steps.forEach((s: any) => {
            if (s.requiredRole !== 'any') roles.push(s.requiredRole);
          });
        }
        if (roles.length > 0) roles.push('admin'); // Admins always see workflow docs
      }
      
      const historyCreation = inv.history?.find((h: any) => h.action === 'created');
      if (historyCreation?.employeeId) {
        ids.push(historyCreation.employeeId);
      }
      
      return { 
        targetRoles: roles.length > 0 ? [...new Set(roles)] : undefined, 
        targetEmployeeIds: ids.length > 0 ? [...new Set(ids)] : undefined 
      };
    };

    settings.alerts.filter(a => a.isActive).forEach(alert => {
      // 1. Before Due
      if (alert.triggerEvent === 'before_due') {
        const offset = Math.abs(alert.triggerDaysOffset || 0);
        invoices.forEach(inv => {
          if (inv.status === 'sent' && inv.type !== 'proforma') {
            const dueDate = new Date(inv.dueDate);
            const diffTime = dueDate.getTime() - new Date().getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === offset) {
              const alreadyNotified = notifications.some(n => 
                n.message.includes(inv.number || inv.id) && n.title === alert.name
              );
              if (!alreadyNotified) {
                const targets = getInvoiceTargets(inv);
                addNotification({
                  title: alert.name,
                  message: `Alerte (${alert.name}) : La facture ${inv.number || 'Brouillon'} arrive à échéance dans ${offset} jours.`,
                  type: 'warning',
                  link: `/invoices/${inv.id}`,
                  ...targets
                });
              }
            }
          }
        });
      }

      // 2. After Due
      if (alert.triggerEvent === 'after_due') {
        const offset = Math.abs(alert.triggerDaysOffset || 0);
        invoices.forEach(inv => {
          if (['sent', 'partially_paid'].includes(inv.status) && inv.type !== 'proforma') {
            const dueDate = new Date(inv.dueDate);
            const todayDate = new Date();
            dueDate.setHours(0,0,0,0);
            todayDate.setHours(0,0,0,0);
            
            const diffTime = todayDate.getTime() - dueDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= offset) {
              const alreadyNotified = notifications.some(n => 
                 n.message.includes(inv.number || inv.id) && n.title === alert.name
              );
              if (!alreadyNotified) {
                const targets = getInvoiceTargets(inv);
                addNotification({
                   title: alert.name,
                   message: `Alerte (${alert.name}) : La facture ${inv.number || 'Brouillon'} a dépassé son échéance de ${diffDays} jours.`,
                   type: 'warning',
                   link: `/invoices/${inv.id}`,
                   ...targets
                });
              }
            }
          }
        });
      }

      // 3. Monthly Report
      if (alert.triggerEvent === 'monthly') {
         const d = new Date();
         if (d.getDate() === 1) { // 1st of the month
           const monthName = d.toLocaleString('fr-FR', { month: 'long' });
           const alreadyNotified = notifications.some(n => 
              n.title === alert.name && n.message.includes(monthName) && n.date.startsWith(today)
           );
           
           if (!alreadyNotified) {
             addNotification({
                title: alert.name,
                message: alert.description || `Votre résumé financier pour le mois de ${monthName} est prêt.`,
                type: 'info',
                link: '/reports',
                targetRoles: ['admin', 'manager']
             });
           }
         }
      }
    });

  }, [invoices, settings, addNotification, notifications, workflows]); // Dependencies ensure it runs when state changes
}
