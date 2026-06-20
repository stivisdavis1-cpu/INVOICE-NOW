'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDataStore } from '@/store/data-store';
import { useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';

export function CashflowChart() {
  const payments = useDataStore((state) => state.payments);
  const { t } = useTranslation();

  const { chartData, growth } = useMemo(() => {
    const months = [
      { month: 'Jan', amount: 0 },
      { month: 'Fév', amount: 0 },
      { month: 'Mar', amount: 0 },
      { month: 'Avr', amount: 0 },
      { month: 'Mai', amount: 0 },
      { month: 'Juin', amount: 0 },
      { month: 'Juil', amount: 0 },
      { month: 'Août', amount: 0 },
      { month: 'Sep', amount: 0 },
      { month: 'Oct', amount: 0 },
      { month: 'Nov', amount: 0 },
      { month: 'Déc', amount: 0 },
    ];

    payments.forEach(p => {
      const d = new Date(p.date);
      const m = d.getMonth();
      months[m].amount += p.amount;
    });

    const currentMonth = new Date().getMonth();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      if (m < 0) m += 12;
      result.push({ month: months[m].month, amount: months[m].amount });
    }
    const lastMonth = result[5]?.amount || 0;
    const prevMonth = result[4]?.amount || 0;
    const growth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
    
    return { chartData: result, growth };
  }, [payments]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h3 className="text-[17px] font-bold text-gray-900 mb-1">{t('dashboard.cashflow') || 'Évolution du Cashflow'}</h3>
          <p className="text-[13px] text-gray-500 font-medium">Encaissements mensuels nets</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">Croissance (M/M-1)</div>
          <div className={`text-2xl font-black ${growth >= 0 ? 'text-primary' : 'text-red-500'}`}>
            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[250px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} 
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
              formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, 'Montant']}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="var(--color-primary)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorAmount)" 
              activeDot={{ r: 6, fill: 'var(--color-primary)', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
