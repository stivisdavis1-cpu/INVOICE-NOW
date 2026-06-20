'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useDataStore } from '@/store/data-store';
import { calculateInvoice } from '@/lib/utils';
import { useMemo } from 'react';

export function PaymentAgingChart() {
  const invoices = useDataStore((state) => state.invoices);

  const { chartData, atRiskAmount } = useMemo(() => {
    let notDue = 0;
    let late1_30 = 0;
    let late31_60 = 0;
    let late60Plus = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    invoices.forEach(inv => {
      if (inv.type === 'proforma' || inv.status === 'paid' || inv.status === 'draft') return;
      const total = calculateInvoice(inv.lines).total;
      
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) notDue += total;
      else if (diffDays <= 30) late1_30 += total;
      else if (diffDays <= 60) late31_60 += total;
      else late60Plus += total;
    });

    const atRisk = late31_60 + late60Plus;

    return {
      chartData: [
        { name: 'Non échu', value: notDue, fill: '#10B981' }, // green-500
        { name: '1-30 j', value: late1_30, fill: '#FBBF24' }, // amber-400
        { name: '31-60 j', value: late31_60, fill: '#F97316' }, // orange-500
        { name: '+60 j', value: late60Plus, fill: '#EF4444' }, // red-500
      ],
      atRiskAmount: atRisk
    };
  }, [invoices]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h3 className="text-[17px] font-bold text-gray-900 mb-1">Balance Âgée</h3>
          <p className="text-[13px] text-gray-500 font-medium">Analyse des retards de paiement (Risque client)</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">Créances à risque (&gt;30j)</div>
          <div className={`text-2xl font-black ${atRiskAmount > 0 ? 'text-red-500' : 'text-primary'}`}>
            {atRiskAmount >= 1000000 ? `${(atRiskAmount / 1000000).toFixed(1)}M` : atRiskAmount >= 1000 ? `${(atRiskAmount / 1000).toFixed(0)}k` : atRiskAmount}
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[250px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} dy={15} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} tickFormatter={(value) => `${value / 1000000}M`} dx={-15} />
            <Tooltip cursor={{fill: 'transparent'}} formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, 'Montant']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
              {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
              <LabelList dataKey="value" position="top" formatter={(val: any) => {
                  const num = Number(val);
                  if (num === 0) return '';
                  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                  return num;
              }} fill="#111827" fontSize={11} fontWeight={700} offset={8} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
