import { useEffect } from 'react';
import { useDataStore } from '@/store/data-store';

export function useNotificationsManager() {
  const settings = useDataStore(state => state.settings);
  const invoices = useDataStore(state => state.invoices);
  const clients = useDataStore(state => state.clients);
  const notifications = useDataStore(state => state.notifications);
  const addNotification = useDataStore(state => state.addNotification);
  const updateInvoice = useDataStore(state => state.updateInvoice);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Alerte de Retard (Late Alert)
    if (settings.lateAlert) {
      invoices.forEach(inv => {
        if (inv.type !== 'proforma' && (inv.status === 'sent' || inv.status === 'partially_paid')) {
          const dueDate = new Date(inv.dueDate);
          if (dueDate < today) {
            // It's late! Update status to 'late'
            updateInvoice(inv.id, { status: 'late' });
            
            // Send Notification if we haven't already
            const notifExists = notifications.some(n => 
              n.title.includes('Facture en retard') && n.link === `/invoices/${inv.id}`
            );
            if (!notifExists) {
              const client = clients.find(c => c.id === inv.clientId);
              addNotification({
                title: 'Facture en retard',
                message: `La facture ${inv.number} pour ${client?.name || 'Client inconnu'} est en retard.`,
                type: 'warning',
                link: `/invoices/${inv.id}`
              });
            }
          }
        }
      });
    }

    // 2. Relance Automatique (Auto Reminder - 3 days before)
    if (settings.autoReminder) {
      invoices.forEach(inv => {
        if (inv.type !== 'proforma' && inv.status === 'sent') {
          const dueDate = new Date(inv.dueDate);
          const diffTime = Math.abs(dueDate.getTime() - today.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 3 && dueDate >= today) {
            // Send Notification if we haven't already
            const notifExists = notifications.some(n => 
              n.title.includes('Relance client') && n.link === `/invoices/${inv.id}`
            );
            if (!notifExists) {
              const client = clients.find(c => c.id === inv.clientId);
              addNotification({
                title: 'Relance client imminente',
                message: `La facture ${inv.number} pour ${client?.name || 'Client inconnu'} arrive à échéance dans ${diffDays} jour(s). Pensez à relancer le client.`,
                type: 'info',
                link: `/invoices/${inv.id}`
              });
            }
          }
        }
      });
    }

    // 3. Rapport Mensuel (Monthly Report - 1st of each month)
    if (settings.monthlyReport) {
      if (today.getDate() === 1) {
        const monthYear = `${today.getMonth() + 1}-${today.getFullYear()}`;
        const notifExists = notifications.some(n => n.title === `Rapport mensuel : ${monthYear}`);
        if (!notifExists) {
          addNotification({
            title: `Rapport mensuel : ${monthYear}`,
            message: `Votre rapport financier pour le mois précédent est disponible dans l'onglet Rapports.`,
            type: 'success',
            link: '/reports'
          });
        }
      }
    }
  }, [invoices, settings, notifications, clients, updateInvoice, addNotification]);
}
