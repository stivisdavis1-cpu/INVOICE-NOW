'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';
import { useDataStore } from '@/store/data-store';
import { calculateInvoice } from '@/lib/utils';
import { useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';

export function InvoiceAmountChart() {
  const invoices = useDataStore((state) => state.invoices);
  const { t } = useTranslation();

  const { chartData, recoveryRate } = useMemo(() => {
    let draft = 0;
    let sent = 0;
    let paid = 0;

    invoices.forEach(inv => {
      if (inv.type === 'proforma') return;
      const total = calculateInvoice(inv.lines).total;
      if (inv.status === 'draft') draft += total;
      else if (inv.status === 'sent' || inv.status === 'late') sent += total;
      else if (inv.status === 'paid') paid += total;
    });

    const totalInvoiced = sent + paid;
    const recoveryRate = totalInvoiced > 0 ? (paid / totalInvoiced) * 100 : 0;

    return {
      chartData: [
        { name: t('status.draft') || 'Brouillon', value: draft, fill: '#E5E7EB' }, // gray-200
        { name: t('status.sent') || 'En attente', value: sent, fill: '#F97316' },   // orange-500
        { name: t('status.paid') || 'Encaissé', value: paid, fill: '#2D8B6F' },     // primary
      ],
      recoveryRate
    };
  }, [invoices, t]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h3 className="text-[17px] font-bold text-gray-900 mb-1">{t('dashboard.invoiceAmounts') || 'Répartition des Encours'}</h3>
          <p className="text-[13px] text-gray-500 font-medium">Analyse du pipeline financier</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">Taux de recouvrement</div>
          <div className="text-2xl font-black text-primary">{recoveryRate.toFixed(1)}%</div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[250px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 13, fontWeight: 500 }} 
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
              tickFormatter={(value) => `${value / 1000000}M`}
              dx={-15}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, 'Montant']}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={50}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList 
                dataKey="value" 
                position="top" 
                formatter={(val: any) => {
                  const num = Number(val);
                  if (num === 0) return '';
                  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                  return num;
                }} 
                fill="#111827" 
                fontSize={12} 
                fontWeight={700}
                offset={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
