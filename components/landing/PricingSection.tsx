'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Star } from 'lucide-react';

type Currency = 'XOF' | 'EUR' | 'USD';

const pricingData = {
  XOF: { symbol: 'FCFA', free: 0, intermediate: 5000, premium: 15000 },
  EUR: { symbol: '€', free: 0, intermediate: 9, premium: 25 },
  USD: { symbol: '$', free: 0, intermediate: 10, premium: 29 },
};

export function PricingSection() {
  const [currency, setCurrency] = useState<Currency>('XOF');
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    // Basic detection based on timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith('Europe/')) {
      setCurrency('EUR');
    } else if (tz.startsWith('America/')) {
      setCurrency('USD');
    } else {
      setCurrency('XOF');
    }
  }, []);

  const getPrice = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return 0;
    return isAnnual ? Math.round(monthlyPrice * 10) : monthlyPrice;
  };

  const formatPrice = (price: number) => {
    if (currency === 'XOF') {
      return new Intl.NumberFormat('fr-FR').format(price);
    }
    return price;
  };

  const plans = [
    {
      id: 'free',
      name: "Essai Gratuit",
      description: "Pour tester l'application avant de s'engager.",
      price: pricingData[currency].free,
      features: [
        "Création de factures et devis illimitée",
        "Base de données clients",
        "Calcul automatique de la TVA",
        "Export Word standard",
        "Valable pendant 14 jours"
      ],
      ctaText: "Commencer gratuitement",
      highlight: false,
    },
    {
      id: 'intermediaire',
      name: "Intermédiaire",
      description: "Idéal pour les indépendants et freelances.",
      price: pricingData[currency].intermediate,
      features: [
        "Tout du plan Gratuit",
        "Modèles Word 100% personnalisables",
        "Relances automatisées",
        "Tableau de bord de suivi financier",
        "1 seul compte entreprise"
      ],
      ctaText: "Choisir le plan Intermédiaire",
      highlight: true,
    },
    {
      id: 'premium',
      name: "Premium",
      description: "Pour les agences et structures plus complexes.",
      price: pricingData[currency].premium,
      features: [
        "Tout du plan Intermédiaire",
        "Workflows de validation d'équipe",
        "Gestion multi-entreprises (jusqu'à 5)",
        "Exports Excel pour le comptable",
        "Support prioritaire 7j/7"
      ],
      ctaText: "Passer au Premium",
      highlight: false,
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Des tarifs simples, sans mauvaise surprise.
          </h2>
          <p className="text-lg text-slate-500 mb-8">
            Commencez par un essai gratuit de 14 jours, puis choisissez le plan qui correspond à votre activité.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Mensuel</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-8 bg-slate-200 rounded-full p-1 transition-colors duration-300"
              style={{ backgroundColor: isAnnual ? '#2D8B6F' : '#e2e8f0' }}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Annuel</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                2 mois offerts
              </span>
            </div>
          </div>
          
          {/* Currency override (hidden or tiny for those who want to force it) */}
          <div className="mt-6 flex justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="text-xs bg-transparent border-none text-slate-500 focus:ring-0 cursor-pointer"
            >
              <option value="XOF">FCFA (XOF)</option>
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-white rounded-[32px] p-8 flex flex-col transition-all duration-300 ease-out border
                ${plan.highlight 
                  ? 'border-primary/50 shadow-[0_20px_40px_rgba(45,139,111,0.15)] -translate-y-4' 
                  : 'border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]'
                }
              `}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                  <Star className="w-3 h-3 fill-current" /> Le plus populaire
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-500 text-sm h-10">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {formatPrice(getPrice(plan.price))}
                  </span>
                  <span className="text-lg font-bold text-slate-900">{pricingData[currency].symbol}</span>
                </div>
                <div className="text-slate-500 text-sm mt-1">
                  {plan.price === 0 ? 'Pour toujours' : (isAnnual ? '/ an' : '/ mois')}
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.highlight ? 'text-primary' : 'text-slate-400'}`} />
                    <span className="text-slate-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link 
                href={`/login?plan=${plan.id}`}
                className={`w-full py-4 rounded-2xl font-bold text-center transition-all duration-300 active:scale-[0.98]
                  ${plan.highlight
                    ? 'bg-primary text-white hover:bg-primary-dark shadow-[0_8px_20px_rgba(45,139,111,0.25)] hover:shadow-[0_12px_25px_rgba(45,139,111,0.35)] hover:-translate-y-0.5'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }
                `}
              >
                {plan.ctaText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
