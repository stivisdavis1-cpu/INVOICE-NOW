'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDataStore } from '@/store/data-store';
import { calculateInvoice } from '@/lib/utils';
import { useMemo } from 'react';

export function RevenueByClientChart() {
  const invoices = useDataStore((state) => state.invoices);
  const clients = useDataStore((state) => state.clients);

  const { chartData, dependencyRisk } = useMemo(() => {
    const clientRevenue: Record<string, number> = {};
    let totalRevenue = 0;

    invoices.forEach(inv => {
      if (inv.type === 'proforma' || (inv.status !== 'paid' && inv.status !== 'accepted')) return;
      const total = calculateInvoice(inv.lines).total;
      clientRevenue[inv.clientId] = (clientRevenue[inv.clientId] || 0) + total;
      totalRevenue += total;
    });

    const sortedClients = Object.entries(clientRevenue)
      .map(([clientId, ca]) => {
        const client = clients.find(c => c.id === clientId);
        return { name: client?.name || 'Client Supprimé', value: ca };
      })
      .sort((a, b) => b.value - a.value);

    // Take top 4, group rest into "Autres"
    const top4 = sortedClients.slice(0, 4);
    const others = sortedClients.slice(4).reduce((acc, curr) => acc + curr.value, 0);
    
    if (others > 0) {
      top4.push({ name: 'Autres', value: others });
    }

    const maxClientShare = totalRevenue > 0 ? (sortedClients[0]?.value / totalRevenue) * 100 : 0;
    
    return {
      chartData: top4,
      dependencyRisk: maxClientShare
    };
  }, [invoices, clients]);

  const COLORS = ['#2D8B6F', '#3B82F6', '#F59E0B', '#8B5CF6', '#9CA3AF'];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h3 className="text-[17px] font-bold text-gray-900 mb-1">Concentration Client</h3>
          <p className="text-[13px] text-gray-500 font-medium">Répartition du Chiffre d'Affaires</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">Poids du Client #1</div>
          <div className={`text-2xl font-black ${dependencyRisk > 50 ? 'text-red-500' : 'text-primary'}`} title="S'il dépasse 50%, risque de dépendance élevé">
            {dependencyRisk.toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[250px] w-full mt-2 relative">
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 font-medium">Aucune donnée encaissée</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, 'Chiffre d\'Affaires']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={40} 
                iconType="circle"
                formatter={(val: any) => <span className="text-gray-700 font-medium text-[11px] ml-1">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
