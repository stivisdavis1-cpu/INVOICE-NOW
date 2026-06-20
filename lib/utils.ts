import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
// @ts-ignore
import writtenNumber from 'written-number';

import { useI18nStore } from '@/store/i18n-store';
import { useDataStore } from '@/store/data-store';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCFA = (amount: number, compact: boolean = false): string => {
  const safeAmount = Number(amount) || 0;
  const lang = useI18nStore.getState().language;
  const locale = lang === 'en' ? 'en-US' : 'fr-FR';
  
  if (compact && safeAmount >= 1000) {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(safeAmount) + ' FCFA';
  }

  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(Math.round(safeAmount)) + ' FCFA';
};

export const numberToWordsCFA = (amount: number): string => {
  try {
    const lang = useI18nStore.getState().language;
    writtenNumber.defaults.lang = lang;
    const words = writtenNumber(Math.round(amount));
    const currency = lang === 'en' ? 'CFA francs' : 'francs CFA';
    return `${words.charAt(0).toUpperCase() + words.slice(1)} ${currency}`;
  } catch (e) {
    return `${formatCFA(amount)}`; // fallback
  }
};

// Formatage Date JJ/MM/AAAA ou MM/DD/YYYY
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const lang = useI18nStore.getState().language;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  if (lang === 'en') {
    return `${month}/${day}/${year}`;
  }
  return `${day}/${month}/${year}`;
};

// Obsolete constant, kept for backwards compatibility but shouldn't be used directly for logic
export const TVA_RATE = 0.18;
export const getTvaRate = () => (useDataStore.getState().settings.defaultTva || 18) / 100;

// Calculs Facture
export function calculateInvoice(
  lines: { quantity: number; unitPrice: number; type?: string; category?: string }[],
  metadata?: Record<string, any>
) {
  const baseSubtotal = lines.reduce((acc, line: any) => {
    // Si c'est une ligne d'information ou section, on ignore son total dans le calcul normal
    if (line.type === 'section' || line.type === 'subtotal' || line.type === 'text') return acc;
    
    // Si c'est une remise, on la soustrait (unitPrice doit être le montant de la remise en positif)
    if (line.type === 'discount') {
      return acc - (line.unitPrice * (line.quantity || 1));
    }
    
    // Si c'est un forfait, la quantité est ignorée
    if (line.isForfait) {
      return acc + (Number(line.unitPrice) || 0);
    }
    
    // Par défaut, produit classique
    return acc + ((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0));
  }, 0);

  let discountAmount = 0;
  if (metadata?.discountRate) {
    // La remise DocuWare s'applique sur les licences et le support
    const discountableSubtotal = lines.reduce((acc, line) => {
      if (line.category === 'license' || line.category === 'support') {
        return acc + ((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0));
      }
      return acc;
    }, 0);
    // Si pas de catégories spécifiques, on applique sur le sous-total de base
    const applicableBase = discountableSubtotal > 0 ? discountableSubtotal : baseSubtotal;
    discountAmount = applicableBase * (Number(metadata.discountRate) / 100);
  }

  // We make sure subtotal isn't negative
  const safeSubtotal = Math.max(0, baseSubtotal - discountAmount);
  const tvaRate = metadata?.tvaRate !== undefined ? Number(metadata.tvaRate) / 100 : getTvaRate();
  const tva = safeSubtotal * tvaRate;
  const total = safeSubtotal + tva;
  
  return {
    subtotal: safeSubtotal,
    tva,
    total,
    discountAmount,
  };
};

// Injection automatique des sous-totaux par section
export function injectSectionSubtotals(lines: any[]): any[] {
  const result: any[] = [];
  let currentSectionSum = 0;
  let inSection = false;
  let hasSections = lines.some(l => l.type === 'section');

  if (!hasSections) return lines;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Ne pas inclure les anciens sous-totaux manuels s'il y en avait
    if (line.type === 'subtotal') continue;

    if (line.type === 'section') {
      if (inSection && currentSectionSum > 0) {
        result.push({
          id: `subtotal-${i}`,
          type: 'subtotal',
          description: `Sous-total`,
          unitPrice: Math.max(0, currentSectionSum),
        });
      }
      currentSectionSum = 0;
      inSection = true;
      result.push(line);
    } else {
      result.push(line);
      if (inSection) {
        if (line.type === 'discount') {
          currentSectionSum -= (Number(line.unitPrice) * (Number(line.quantity) || 1));
        } else if (line.type !== 'text') {
          if (line.isForfait) {
            currentSectionSum += (Number(line.unitPrice) || 0);
          } else {
            currentSectionSum += ((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0));
          }
        }
      }
    }
  }

  if (inSection && currentSectionSum > 0) {
    result.push({
      id: `subtotal-final`,
      type: 'subtotal',
      description: `Sous-total`,
      unitPrice: Math.max(0, currentSectionSum),
    });
  }

  return result;
}

// Génération numéro facture
export const generateInvoiceNumber = (count: number): string => {
  return `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
};

// Statut en retard (auto)
export const isLate = (dueDate: string, status: string): boolean => {
  return status !== 'paid' && new Date(dueDate) < new Date();
};
