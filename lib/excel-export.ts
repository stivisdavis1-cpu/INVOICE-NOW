import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { Client, Invoice, Payment } from '@/store/data-store';
import { calculateInvoice } from '@/lib/utils';

export async function exportToExcel(
  invoices: Invoice[], 
  clients: Client[], 
  payments: Payment[], 
  includeProformas: boolean = false
) {
  // 1. Filtrer les factures selon la préférence (inclure ou non les proformas)
  const activeInvoices = includeProformas ? invoices : invoices.filter(inv => inv.type !== 'proforma');
  
  // Création du contenu CSV
  // On utilise le point-virgule comme séparateur, ce qui est le standard pour Excel en français
  const separator = ';';
  
  // En-têtes des colonnes
  const headers = [
    'N° Facture',
    'Type',
    'Client',
    'Date d\'émission',
    'Échéance',
    'Montant HT',
    'TVA',
    'Montant TTC',
    'Statut'
  ];
  
  let csvContent = headers.join(separator) + '\n';

  // Lignes de données
  activeInvoices.forEach(inv => {
    const client = clients.find(c => c.id === inv.clientId);
    const { subtotal, tva, total } = calculateInvoice(inv.lines, inv.metadata);
    
    const row = [
      inv.id,
      inv.type === 'proforma' ? 'Proforma' : 'Facture',
      `"${client?.name || 'Inconnu'}"`, // Guillemets au cas où il y a des points-virgules dans le nom
      format(new Date(inv.issueDate), 'dd/MM/yyyy'),
      format(new Date(inv.dueDate), 'dd/MM/yyyy'),
      subtotal,
      tva,
      total,
      inv.status
    ];
    
    csvContent += row.join(separator) + '\n';
  });

  // Pour que les caractères accentués soient bien reconnus dans Excel,
  // il faut ajouter le BOM (Byte Order Mark) UTF-8 au début du fichier.
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Génération et téléchargement du fichier
  const fileName = `Export_Factures_Invoice_Now_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'Fichier CSV',
          accept: {'text/csv': ['.csv']}
        }]
      });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      // otherwise fallback
    }
  }

  saveAs(blob, fileName);
}
