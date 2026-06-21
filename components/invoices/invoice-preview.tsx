'use client';

import { useDataStore, Client, Settings } from '@/store/data-store';
import { formatCFA, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface InvoicePreviewProps {
  data: any;
  client: Client | null;
  settings: Settings;
  subtotal: number;
  tva: number;
  total: number;
  docType: string;
}

export function InvoicePreview({ data, client, settings, subtotal, tva, total, docType }: InvoicePreviewProps) {
  const isProforma = docType === 'proforma';
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const availableWidth = entry.contentRect.width;
        // On veut laisser un peu de marge (ex: 40px)
        const targetWidth = availableWidth - 40;
        
        // Sur grand écran, on limite le zoom à 0.85 maximum pour garder une vue d'ensemble
        // Sur petit écran (mobile), on autorise à dézoomer encore plus pour que tout rentre
        let newScale = Math.min(0.85, targetWidth / 794);
        
        if (window.innerWidth < 1024) {
          // Sur mobile, on ajuste exactement
          newScale = Math.min(1, targetWidth / 794);
        }

        setScale(newScale);
      }
    });

    if (containerRef.current) {
      // On observe le conteneur parent (le div flex-1 bg-[#e4e4e7])
      const parent = containerRef.current.parentElement;
      if (parent) observer.observe(parent);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @media print {
          .preview-wrapper { 
            height: auto !important; 
            display: block !important;
          }
          .preview-doc {
            transform: none !important;
            position: relative !important;
            width: 100% !important;
            min-height: auto !important;
            box-shadow: none !important;
          }
          @page {
            margin: 0.5cm;
          }
        }
      `}</style>
      <div 
        ref={containerRef} 
        className="preview-wrapper relative w-full flex justify-center transition-all duration-300 print:block" 
        style={{ height: 1122 * scale }}
      >
        <div 
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top center',
            width: '794px',
            minHeight: '1122px'
          }}
          className="preview-doc bg-white shadow-2xl flex flex-col text-[13px] text-gray-800 shrink-0 absolute top-0 print:relative"
        >
        <div className="flex-1 p-12 flex flex-col relative">
          {/* Header Preview */}
          <div className="flex justify-between items-start mb-12">
            <div className="flex flex-col gap-4">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-light text-slate-800 tracking-tight"
                >
                  {isProforma ? 'PROFORMA' : 'FACTURE'}
                </motion.h1>
                <motion.p 
                  key={data.number}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-slate-500 mt-1 font-medium"
                >
                  {data.number || (isProforma ? 'PRO-...' : 'FAC-...')}
                </motion.p>
              </div>
            </div>
            <div className="text-right text-slate-600 flex flex-col items-end">
              {settings.logo && (
                <img 
                  src={`${settings.logo}${settings.logo.includes('?') ? '&' : '?'}cors=1`}
                  alt="Logo de l'entreprise" 
                  crossOrigin="anonymous"
                  className="max-h-32 max-w-[300px] object-contain mb-4"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <p className="font-bold text-slate-900">{data.metadata?.companyName || settings.companyName}</p>
              <p className="whitespace-pre-wrap">{data.metadata?.address || settings.address}</p>
              <p>{settings.nineaLabel || 'NINEA'}: {data.metadata?.ninea || settings.ninea}</p>
              <p>{settings.rccmLabel || 'RCCM'}: {data.metadata?.rccm || settings.rccm}</p>
            </div>
          </div>

          {/* Client Info & Dates */}
          <div className="flex justify-between items-end mb-12">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 min-w-[250px]">
              <p className="text-slate-500 mb-2 font-medium uppercase tracking-wider text-xs">Facturé à</p>
              {client ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="font-bold text-slate-900 text-lg">{client.name}</p>
                  {client.address && <p className="text-slate-600 mt-1">{client.address}</p>}
                  {client.ninea && <p className="text-slate-600 mt-1">{settings.nineaLabel || 'NINEA'}: {client.ninea}</p>}
                </motion.div>
              ) : (
                <p className="text-slate-400 italic">Sélectionnez un client...</p>
              )}
            </div>

            <div className="text-right">
              <div className="mb-2">
                <span className="text-slate-500 inline-block w-24">Date :</span>
                <span className="font-medium text-slate-900">{formatDate(data.issueDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 inline-block w-24">Échéance :</span>
                <span className="font-medium text-slate-900">{formatDate(data.dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Lines */}
          <div className="flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-slate-500">
                  <th className="py-3 font-medium w-1/2">Description</th>
                  <th className="py-3 font-medium text-center">Qté</th>
                  <th className="py-3 font-medium text-right">Prix Unitaire</th>
                  <th className="py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {data.lines.map((line: any, index: number) => {
                    if (line.type === 'section') {
                      return (
                        <motion.tr 
                          key={`section-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="bg-slate-200 border-y-2 border-slate-300"
                        >
                          <td colSpan={4} className="py-3 text-center font-bold text-primary uppercase tracking-widest text-xs">
                            {line.description || 'Section sans titre'}
                          </td>
                        </motion.tr>
                      );
                    }

                    if (line.type === 'discount') {
                      return (
                        <motion.tr 
                          key={`discount-${index}`}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-orange-600 bg-orange-50/30"
                        >
                          <td className="py-3 pl-2">
                            <span className="font-medium">{line.description || 'Remise commerciale'}</span>
                          </td>
                          <td className="py-3 text-center">-</td>
                          <td className="py-3 text-right tabular-nums">{formatCFA(line.unitPrice || 0)}</td>
                          <td className="py-3 text-right font-medium tabular-nums">- {formatCFA(line.unitPrice || 0)}</td>
                        </motion.tr>
                      );
                    }

                    return (
                      <motion.tr 
                        key={`item-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <td className="py-4">
                          <p className="font-medium text-slate-800">{line.description || 'Article sans description'}</p>
                          {line.reference && <p className="text-xs text-slate-400 mt-1">Réf: {line.reference}</p>}
                          {line.deliverables && <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{line.deliverables}</p>}
                        </td>
                        <td className="py-4 text-center tabular-nums text-slate-600">
                          {line.isForfait ? 'Forfait' : `${line.quantity || 0} ${line.unit || ''}`}
                        </td>
                        <td className="py-4 text-right tabular-nums text-slate-600">
                          {formatCFA(line.unitPrice || 0)}
                        </td>
                        <td className="py-4 text-right font-medium text-slate-900 tabular-nums">
                          {formatCFA(line.isForfait ? (line.unitPrice || 0) : ((line.quantity || 0) * (line.unitPrice || 0)))}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-slate-500">
                <span>Sous-total</span>
                <span className="tabular-nums">{formatCFA(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>TVA ({data.metadata?.tvaRate ?? settings.defaultTva ?? 18}%)</span>
                <span className="tabular-nums">{formatCFA(tva)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900">
                <span className="font-bold text-slate-900 uppercase">Total TTC</span>
                <motion.span 
                  key={total}
                  className="font-bold text-xl tabular-nums text-primary"
                  initial={{ scale: 1.1, color: '#2D8B6F' }}
                  animate={{ scale: 1, color: '#0f172a' }}
                  transition={{ duration: 0.3 }}
                >
                  {formatCFA(total)}
                </motion.span>
              </div>
            </div>
          </div>

          {/* Footer & Pagination */}
          <div className="mt-auto pt-8 flex justify-between items-end print:break-inside-avoid">
            <div className="text-xs text-slate-400 max-w-sm">
              <p>{data.metadata?.footerMentions || settings.footerMentions}</p>
            </div>
            
            {/* Pagination Placeholder */}
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-right">
              <span>{data.metadata?.companyName || settings.companyName}</span>
              <div className="mt-1 text-slate-300 print:hidden">Page 1 / 1</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
